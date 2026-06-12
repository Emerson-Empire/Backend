import { getPool } from "../db";

//school dashboard service

export class SchoolService {
  async getStats(schoolId: string) {
    const pool = getPool();

    const { rows } = await pool.query(
      `
      SELECT 
        (SELECT COUNT(*) FROM students WHERE school_id = $1 AND status = 'active') as activeStudents,
        (SELECT COUNT(*) FROM placements WHERE school_id = $1 AND status = 'pending') as pendingPlacement,
        (SELECT COUNT(*) FROM completions WHERE school_id = $1) as completed,
        (SELECT COUNT(*) FROM students WHERE school_id = $1) as total
      FROM (SELECT 1) as dummy
    `,
      [schoolId],
    );

    return rows[0];
  }

  async getPipeline(schoolId: string) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT status, COUNT(*) as count 
     FROM intern_profiles 
     WHERE school_id = $1 
     GROUP BY status`, [schoolId]
  );
  return rows;
}

async getRecentCompletions(schoolId: string, limit: number = 3) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT name, company, completion_date, certificate_token 
     FROM completions 
     WHERE school_id = $1 
     ORDER BY completion_date DESC LIMIT $2`, [schoolId, limit]
  );
  return rows;
}

async getPendingActions(schoolId: string) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT name, status 
     FROM intern_profiles 
     WHERE school_id = $1 AND status = 'pending_approval'`, [schoolId]
  );
  return rows;
}

//students management service

async getStudents(
  schoolId: string,
  search?: string,
  status?: string
) {
  const pool = getPool();

  let query = `
    SELECT *
    FROM students
    WHERE school_id = $1
  `;

  const values: any[] = [schoolId];

  if (search) {
    query += `
      AND (
        name ILIKE $${values.length + 1}
        OR id::text ILIKE $${values.length + 1}
      )
    `;

    values.push(`%${search}%`);
  }

  if (status) {
    query += `
      AND status = $${values.length + 1}
    `;

    values.push(status);
  }

  const { rows } = await pool.query(query, values);

  return rows;
}

async getStudentById(
  schoolId: string,
  studentId: string
) {
  const pool = getPool();

  const { rows } = await pool.query(
    `
    SELECT *
    FROM students
    WHERE school_id = $1
    AND id = $2
    `,
    [schoolId, studentId]
  );

  return rows[0];
}

async registerStudent(
  schoolId: string,
  student: any
) {
  const pool = getPool();

  const {
    fullName,
    email,
    studentId,
    course,
    year,
    enrolledStatus,
    preferredDept,
    cvUrl
  } = student;

  if (
    !fullName ||
    !email ||
    !studentId ||
    !course ||
    !year
  ) {
    throw new Error("Missing required fields");
  }

  const existing = await pool.query(
    `
    SELECT id
    FROM students
    WHERE email = $1
       OR student_id = $2
    `,
    [email, studentId]
  );

  if (existing.rows.length > 0) {
    throw new Error(
      "Student email or studentId already exists"
    );
  }

  const { rows } = await pool.query(
    `
    INSERT INTO students (
      school_id,
      full_name,
      email,
      student_id,
      course,
      year,
      enrolled_status,
      preferred_dept,
      cv_url,
      status
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,'pending'
    )
    RETURNING *
    `,
    [
      schoolId,
      fullName,
      email,
      studentId,
      course,
      year,
      enrolledStatus,
      preferredDept,
      cvUrl
    ]
  );

  return rows[0];
}

async bulkRegisterStudents(
  schoolId: string,
  students: any[]
) {
  const passed = [];
  const failed = [];

  for (let i = 0; i < students.length; i++) {
    try {
      const result =
        await this.registerStudent(
          schoolId,
          students[i]
        );

      passed.push(result);
    } catch (error: any) {
      failed.push({
        row: i + 1,
        reason: error.message
      });
    }
  }

  return {
    passed,
    failed
  };
}

async getSubmissions(
  schoolId: string
) {
  const pool = getPool();

  const { rows } = await pool.query(
    `
    SELECT
      created_at as date,
      student_count as "studentCount",
      status
    FROM submission_batches
    WHERE school_id = $1
    ORDER BY created_at DESC
    `,
    [schoolId]
  );

  return rows;
}

async getStudentProgress(schoolId: string, studentId: string) {
  const pool = getPool();

  const metricsRes = await pool.query(
    `SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') as "tasksCompleted",
        ROUND(AVG(score), 1) as "averageScore",
        SUM(hours_logged) as "totalHours",
        COUNT(DISTINCT session_id) as "sessionsAttended"
     FROM student_metrics 
     WHERE school_id = $1 AND student_id = $2`,
    [schoolId, studentId]
  );

  const weeklyTasksRes = await pool.query(
    `SELECT week_label as "week", task_count as "count"
     FROM weekly_tasks
     WHERE school_id = $1 AND student_id = $2
     ORDER BY week_start_date DESC LIMIT 4`,
    [schoolId, studentId]
  );

  const skillsRes = await pool.query(
    `SELECT skill_name as "skill", progress_percentage as "percentage"
     FROM student_skills
     WHERE school_id = $1 AND student_id = $2`,
    [schoolId, studentId]
  );

  const feedbackRes = await pool.query(
    `SELECT rating, comment
     FROM mentor_feedback
     WHERE school_id = $1 AND student_id = $2
     ORDER BY created_at DESC LIMIT 2`,
    [schoolId, studentId]
  );

  return {
    performanceMetrics: metricsRes.rows[0] || { tasksCompleted: 0, averageScore: 0, totalHours: 0, sessionsAttended: 0 },
    weeklyTasks: weeklyTasksRes.rows,
    skills: skillsRes.rows,
    mentorFeedback: feedbackRes.rows
  };
}

async getCohortSummary(schoolId: string) {
  const pool = getPool();

  const overviewRes = await pool.query(
    `SELECT 
        ROUND(AVG(completion_rate), 1) as "avgCompletion",
        ROUND(AVG(on_time_rate), 1) as "avgOnTime",
        SUM(total_sessions) as "totalSessions",
        (SELECT COUNT(*) FROM completions WHERE school_id = $1) as "certificatesIssued"
     FROM cohort_overview
     WHERE school_id = $1`,
    [schoolId]
  );

  const deptRes = await pool.query(
    `SELECT department, COUNT(*) as "studentCount", ROUND(AVG(performance_score), 1) as "avgScore"
     FROM students
     WHERE school_id = $1
     GROUP BY department
     LIMIT 3`,
    [schoolId]
  );

  const topPerformersRes = await pool.query(
    `SELECT name, performance_score as "score", department
     FROM students
     WHERE school_id = $1 AND status = 'active'
     ORDER BY performance_score DESC
     LIMIT 3`,
    [schoolId]
  );

  return {
    overview: overviewRes.rows[0] || { avgCompletion: 0, avgOnTime: 0, totalSessions: 0, certificatesIssued: 0 },
    departmentBreakdown: deptRes.rows,
    topPerformers: topPerformersRes.rows
  };
}
}


