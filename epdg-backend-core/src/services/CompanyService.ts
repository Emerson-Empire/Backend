import { getPool } from '../db';

export class CompanyService {

  // ─── Verify company ownership ─────────────────────────────────────────
  async verifyOwnership(companyId: number, userId: number): Promise<void> {
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT id FROM companies WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [companyId, userId]
    );
    if (!rows.length) throw new Error('Company not found or access denied');
  }

  // ─── Dashboard: Stats ─────────────────────────────────────────────────
  async getStats(companyId: number) {
    const pool = getPool();

    const [activeInterns, openSlots, pendingApplications, pendingReviews] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM placements WHERE company_id = $1 AND status = 'active'`,
        [companyId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM internship_slots WHERE company_id = $1 AND status = 'open' AND deleted_at IS NULL`,
        [companyId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM applications a
         JOIN internship_slots s ON s.id = a.slot_id
         WHERE s.company_id = $1 AND a.status = 'pending'`,
        [companyId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM submissions sub
         JOIN tasks t ON t.id = sub.task_id
         JOIN placements p ON p.id = t.placement_id
         WHERE p.company_id = $1 AND sub.status = 'under_review'`,
        [companyId]
      ),
    ]);

    return {
      activeInterns: Number(activeInterns.rows[0].count),
      openSlots: Number(openSlots.rows[0].count),
      pendingApplications: Number(pendingApplications.rows[0].count),
      pendingReviews: Number(pendingReviews.rows[0].count),
    };
  }

  // ─── Dashboard: Active interns (limited) ──────────────────────────────
  async getActiveInterns(companyId: number, limit: number) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT
         u.id AS user_id,
         u.name,
         ip.department,
         p.id AS placement_id,
         p.status AS placement_status,
         (SELECT COUNT(*) FROM tasks WHERE placement_id = p.id AND deleted_at IS NULL) AS total_tasks,
         (SELECT COUNT(*) FROM tasks WHERE placement_id = p.id AND status = 'done' AND deleted_at IS NULL) AS done_tasks
       FROM placements p
       JOIN intern_profiles ip ON ip.id = p.intern_id
       JOIN users u ON u.id = ip.user_id
       WHERE p.company_id = $1 AND p.status = 'active'
       ORDER BY u.name
       LIMIT $2`,
      [companyId, limit]
    );

    return rows.map((r: any) => ({
      id: r.user_id,
      name: r.name,
      department: r.department || 'Not assigned',
      progress: r.total_tasks > 0 ? Math.round((r.done_tasks / r.total_tasks) * 100) : 0,
      status: r.placement_status,
    }));
  }

  // ─── Dashboard: Upcoming sessions ─────────────────────────────────────
  async getUpcomingSessions(companyId: number, limit: number) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT
        u.name AS mentor_name, iu.name AS intern_name,
        s.scheduled_at
      FROM sessions s
      JOIN users u ON u.id = s.mentor_id
      JOIN users iu ON iu.id = s.intern_id
      JOIN placements p ON p.id = s.placement_id
      WHERE p.company_id = $1
        AND s.scheduled_at > NOW()
        AND s.status = 'scheduled'
      ORDER BY s.scheduled_at ASC
      LIMIT $2`,
      [companyId, limit]
    );

    return rows.map((r: any) => ({
      mentor_name: r.mentor_name,
      intern_name: r.intern_name,
      scheduled_at: r.scheduled_at,
    }));
  }

  // ─── Dashboard: Recent feedback ───────────────────────────────────────
  async getRecentFeedback(companyId: number, limit: number) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT u.name AS intern_name, f.rating, f.comment, f.week_number
       FROM feedback f
       JOIN placements p ON p.id = f.placement_id
       JOIN intern_profiles ip ON ip.id = p.intern_id
       JOIN users u ON u.id = ip.user_id
       WHERE p.company_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2`,
      [companyId, limit]
    );

    return rows;
  }

  // ─── Interns: List all ────────────────────────────────────────────────
  async getAllInterns(companyId: number, filters: { dept?: string; status?: string; limit?: number }) {
    const pool = getPool();

    const conditions: string[] = ['p.company_id = $1'];
    const values: unknown[] = [companyId];
    let idx = 2;

    if (filters.dept) {
      conditions.push(`ip.department = $${idx++}`);
      values.push(filters.dept);
    }
    if (filters.status) {
      conditions.push(`p.status = $${idx++}`);
      values.push(filters.status);
    }

    const { rows } = await pool.query(
      `SELECT
         u.id AS user_id, u.name, u.email, u.created_at,
         ip.id AS profile_id, ip.department, ip.course, ip.year_of_study,
         ip.mentor_name, ip.track, ip.cv_url, ip.skills, ip.bio,
         ip.contact_phone, ip.profile_photo, ip.linkedin_url, ip.github_url, ip.portfolio_url,
         ip.country, ip.city, ip.is_approved,
         p.id AS placement_id, p.start_date, p.end_date, p.status AS placement_status,
         (SELECT COUNT(*) FROM tasks WHERE placement_id = p.id AND deleted_at IS NULL) AS total_tasks,
         (SELECT COUNT(*) FROM tasks WHERE placement_id = p.id AND status = 'done' AND deleted_at IS NULL) AS done_tasks,
         (SELECT COALESCE(SUM(points), 0) FROM tasks WHERE placement_id = p.id AND status = 'done' AND deleted_at IS NULL) AS total_points,
         (SELECT COUNT(*) FROM submissions sub
          JOIN tasks t ON t.id = sub.task_id
          WHERE t.placement_id = p.id) AS total_submissions,
         (SELECT COUNT(*) FROM sessions WHERE placement_id = p.id) AS total_sessions
       FROM placements p
       JOIN intern_profiles ip ON ip.id = p.intern_id
       JOIN users u ON u.id = ip.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY u.name`,
      values
    );

    return rows.map((r: any) => ({
      id: r.user_id,
      name: r.name,
      email: r.email,
      department: r.department || 'Not assigned',
      course: r.course,
      year_of_study: r.year_of_study,
      mentor_name: r.mentor_name,
      track: r.track,
      cv_url: r.cv_url,
      skills: r.skills,
      bio: r.bio,
      contact_phone: r.contact_phone,
      profile_photo: r.profile_photo,
      linkedin_url: r.linkedin_url,
      github_url: r.github_url,
      portfolio_url: r.portfolio_url,
      country: r.country,
      city: r.city,
      is_approved: r.is_approved,
      placement: {
        id: r.placement_id,
        start_date: r.start_date,
        end_date: r.end_date,
        status: r.placement_status,
        progress: r.total_tasks > 0 ? Math.round((r.done_tasks / r.total_tasks) * 100) : 0,
      },
      tasks_count: Number(r.total_tasks),
      submissions_count: Number(r.total_submissions),
      sessions_count: Number(r.total_sessions),
      points: Number(r.total_points),
    }));
  }

  // ─── Interns: Detail ──────────────────────────────────────────────────
  async getInternDetail(companyId: number, internUserId: number) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT
         u.id AS user_id, u.name, u.email, u.phone, u.created_at,
         ip.id AS profile_id, ip.department, ip.course, ip.year_of_study,
         ip.mentor_name, ip.track, ip.cv_url, ip.skills, ip.bio,
         ip.contact_phone, ip.profile_photo, ip.linkedin_url, ip.github_url, ip.portfolio_url,
         ip.country, ip.city, ip.is_approved, ip.nda_signed, ip.disclaimer_accepted, ip.onboarding_complete,
         p.id AS placement_id, p.start_date, p.end_date, p.status AS placement_status,
         (SELECT COUNT(*) FROM tasks WHERE placement_id = p.id AND deleted_at IS NULL) AS total_tasks,
         (SELECT COUNT(*) FROM tasks WHERE placement_id = p.id AND status = 'done' AND deleted_at IS NULL) AS done_tasks,
         (SELECT COALESCE(SUM(points), 0) FROM tasks WHERE placement_id = p.id AND deleted_at IS NULL) AS total_points,
         (SELECT COALESCE(SUM(points), 0) FROM tasks WHERE placement_id = p.id AND status = 'done' AND deleted_at IS NULL) AS earned_points,
         (SELECT COUNT(*) FROM submissions sub
          JOIN tasks t ON t.id = sub.task_id
          WHERE t.placement_id = p.id) AS total_submissions,
         (SELECT COUNT(*) FROM submissions sub
          JOIN tasks t ON t.id = sub.task_id
          WHERE t.placement_id = p.id AND sub.status = 'approved') AS approved_submissions,
         (SELECT COUNT(*) FROM sessions WHERE placement_id = p.id) AS total_sessions
       FROM placements p
       JOIN intern_profiles ip ON ip.id = p.intern_id
       JOIN users u ON u.id = ip.user_id
       WHERE p.company_id = $1 AND u.id = $2 AND p.deleted_at IS NULL`,
      [companyId, internUserId]
    );

    if (!rows.length) throw new Error('Intern not found');

    const r = rows[0];

    return {
      personal_info: {
        id: r.user_id,
        name: r.name,
        email: r.email,
        phone: r.contact_phone,
        photo: r.profile_photo,
        country: r.country,
        city: r.city,
        bio: r.bio,
        skills: r.skills,
        linkedin: r.linkedin_url,
        github: r.github_url,
        portfolio: r.portfolio_url,
        cv_url: r.cv_url,
      },
      placement: {
        id: r.placement_id,
        department: r.department,
        mentor: r.mentor_name,
        track: r.track,
        course: r.course,
        year_of_study: r.year_of_study,
        start_date: r.start_date,
        end_date: r.end_date,
        status: r.placement_status,
        is_approved: r.is_approved,
        nda_signed: r.nda_signed,
        onboarding_complete: r.onboarding_complete,
      },
      tasks_count: Number(r.total_tasks),
      submissions_count: Number(r.total_submissions),
      sessions_count: Number(r.total_sessions),
      points: Number(r.earned_points),
      rank: '-', // Placeholder — ranking logic can be added later
    };
  }

  // ─── Slots: List all ──────────────────────────────────────────────────
  async getSlots(companyId: number) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT
         s.id, s.title, s.department, s.slots_available, s.slots_filled,
         s.duration_weeks, s.stipend, s.is_remote, s.deadline, s.status,
         (SELECT COUNT(*) FROM applications WHERE slot_id = s.id) AS applicant_count
       FROM internship_slots s
       WHERE s.company_id = $1 AND s.deleted_at IS NULL
       ORDER BY s.created_at DESC`,
      [companyId]
    );

    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      department: r.department,
      duration: r.duration_weeks,
      stipend: r.stipend ? Number(r.stipend) : null,
      deadline: r.deadline,
      status: r.status,
      maxSlots: r.slots_available,
      slotsFilled: r.slots_filled,
      isRemote: r.is_remote,
      applicantCount: Number(r.applicant_count),
    }));
  }

  // ─── Slots: Create ────────────────────────────────────────────────────
  async createSlot(companyId: number, data: {
    title: string;
    department: string;
    description?: string;
    duration?: number;
    stipend?: number;
    isRemote?: boolean;
    deadline?: string;
    maxSlots?: number;
  }) {
    const pool = getPool();

    const { rows } = await pool.query(
      `INSERT INTO internship_slots (company_id, title, department, description, duration_weeks, stipend, is_remote, deadline, slots_available, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', NOW())
       RETURNING *`,
      [companyId, data.title, data.department, data.description || null,
       data.duration || null, data.stipend || null, data.isRemote || false,
       data.deadline || null, data.maxSlots || 1]
    );

    const r = rows[0];
    return {
      id: r.id,
      title: r.title,
      department: r.department,
      description: r.description,
      duration: r.duration_weeks,
      stipend: r.stipend ? Number(r.stipend) : null,
      isRemote: r.is_remote,
      deadline: r.deadline,
      status: r.status,
      maxSlots: r.slots_available,
      applicantCount: 0,
    };
  }

  // ─── Slots: Update ────────────────────────────────────────────────────
  async updateSlot(companyId: number, slotId: number, data: Record<string, any>) {
    const pool = getPool();

    const { rows: existing } = await pool.query(
      'SELECT id FROM internship_slots WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL',
      [slotId, companyId]
    );
    if (!existing.length) throw new Error('Slot not found');

    const allowedFields: Record<string, string> = {
      title: 'title',
      department: 'department',
      description: 'description',
      duration: 'duration_weeks',
      stipend: 'stipend',
      isRemote: 'is_remote',
      deadline: 'deadline',
      maxSlots: 'slots_available',
      status: 'status',
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, col] of Object.entries(allowedFields)) {
      if (data[key] !== undefined) {
        setClauses.push(`${col} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (!setClauses.length) throw new Error('No valid fields to update');

    values.push(slotId);
    const { rows } = await pool.query(
      `UPDATE internship_slots SET ${setClauses.join(', ')} WHERE id = $${idx}
       RETURNING *`,
      values
    );

    const r = rows[0];
    return {
      id: r.id,
      title: r.title,
      department: r.department,
      description: r.description,
      duration: r.duration_weeks,
      stipend: r.stipend ? Number(r.stipend) : null,
      isRemote: r.is_remote,
      deadline: r.deadline,
      status: r.status,
      maxSlots: r.slots_available,
      slotsFilled: r.slots_filled,
    };
  }

  // ─── Applications: List ───────────────────────────────────────────────
  async getApplications(companyId: number, statusFilter?: string) {
    const pool = getPool();

    const conditions: string[] = ['s.company_id = $1'];
    const values: unknown[] = [companyId];
    let idx = 2;

    if (statusFilter) {
      conditions.push(`a.status = $${idx++}`);
      values.push(statusFilter);
    }

    const { rows } = await pool.query(
      `SELECT
         a.id, a.status, a.cover_letter, a.applied_at, a.reviewed_at,
         u.id AS intern_user_id, u.name AS intern_name, u.email AS intern_email,
         ip.id AS profile_id, ip.department, ip.course, ip.year_of_study,
         ip.mentor_name, ip.track, ip.cv_url, ip.skills, ip.contact_phone,
         s.id AS slot_id, s.title AS slot_title, s.department AS slot_department
       FROM applications a
       JOIN internship_slots s ON s.id = a.slot_id
       JOIN intern_profiles ip ON ip.id = a.intern_id
       JOIN users u ON u.id = ip.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.applied_at DESC`,
      values
    );

    return rows.map((r: any) => ({
      id: r.id,
      status: r.status,
      cover_letter: r.cover_letter,
      applied_at: r.applied_at,
      reviewed_at: r.reviewed_at,
      intern: {
        id: r.intern_user_id,
        name: r.intern_name,
        email: r.intern_email,
        department: r.department,
        course: r.course,
        year_of_study: r.year_of_study,
        mentor: r.mentor_name,
        track: r.track,
        cv_url: r.cv_url,
        skills: r.skills,
        phone: r.contact_phone,
      },
      slot: {
        id: r.slot_id,
        title: r.slot_title,
        department: r.slot_department,
      },
    }));
  }

  // ─── Applications: Update status ──────────────────────────────────────
  async updateApplicationStatus(appId: number, companyId: number, data: {
    status: 'shortlisted' | 'accepted' | 'rejected';
    rejectionReason?: string;
  }) {
    const pool = getPool();

    const { rows: existing } = await pool.query(
      `SELECT a.id FROM applications a
       JOIN internship_slots s ON s.id = a.slot_id
       WHERE a.id = $1 AND s.company_id = $2`,
      [appId, companyId]
    );
    if (!existing.length) throw new Error('Application not found');

    if (data.status === 'rejected' && !data.rejectionReason) {
      throw new Error('Rejection reason is required when rejecting an application');
    }

    const { rows } = await pool.query(
      `UPDATE applications SET status = $1, reviewed_at = NOW(), company_notes = $2
       WHERE id = $3 RETURNING *`,
      [data.status, data.rejectionReason || null, appId]
    );

    const r = rows[0];
    return {
      id: r.id,
      status: r.status,
      reviewed_at: r.reviewed_at,
      rejection_reason: data.rejectionReason || null,
    };
  }

  // ─── Tasks: List ──────────────────────────────────────────────────────
  async getTasks(companyId: number, filters: { internName?: string; status?: string }) {
    const pool = getPool();

    const conditions: string[] = ['p.company_id = $1'];
    const values: unknown[] = [companyId];
    let idx = 2;

    if (filters.status) {
      conditions.push(`t.status = $${idx++}`);
      values.push(filters.status);
    }
    if (filters.internName) {
      conditions.push(`u.name ILIKE $${idx++}`);
      values.push(`%${filters.internName}%`);
    }

    const { rows } = await pool.query(
      `SELECT
         t.id, t.title, t.description, t.priority, t.status, t.due_date, t.points, t.created_at, t.completed_at,
         u.id AS assigned_to_id, u.name AS assigned_to_name,
         p.id AS placement_id
       FROM tasks t
       JOIN placements p ON p.id = t.placement_id
       JOIN intern_profiles ip ON ip.id = p.intern_id
       JOIN users u ON u.id = ip.user_id
       WHERE ${conditions.join(' AND ')} AND t.deleted_at IS NULL
       ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC`,
      values
    );

    const now = new Date();
    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      priority: r.priority,
      status: r.status,
      due_date: r.due_date,
      points: r.points,
      created_at: r.created_at,
      completed_at: r.completed_at,
      assigned_to: {
        id: r.assigned_to_id,
        name: r.assigned_to_name,
      },
      overdue: r.due_date && r.status !== 'done' ? new Date(r.due_date) < now : false,
    }));
  }

  // ─── Tasks: Create ────────────────────────────────────────────────────
  async createTask(companyId: number, assignedByUserId: number, data: {
    title: string;
    description?: string;
    assignedTo: number;
    priority?: string;
    dueDate: string;
    points?: number;
  }) {
    const pool = getPool();

    const { rows: placements } = await pool.query(
      `SELECT p.id FROM placements p
       JOIN intern_profiles ip ON ip.id = p.intern_id
       WHERE ip.user_id = $1 AND p.company_id = $2 AND p.status = 'active'
       LIMIT 1`,
      [data.assignedTo, companyId]
    );

    if (!placements.length) throw new Error('No active placement found for this intern');

    const placementId = placements[0].id;
    const assignedBy = assignedByUserId;

    const { rows } = await pool.query(
      `INSERT INTO tasks (placement_id, assigned_by, title, description, priority, due_date, points, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [placementId, assignedBy, data.title, data.description || null,
       data.priority || 'normal', data.dueDate, data.points || 10]
    );

    const r = rows[0];
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      priority: r.priority,
      status: r.status,
      due_date: r.due_date,
      points: r.points,
      assigned_to: data.assignedTo,
      created_at: r.created_at,
    };
  }

  // ─── Tasks: Update ────────────────────────────────────────────────────
  async updateTask(companyId: number, taskId: number, data: Record<string, any>) {
    const pool = getPool();

    const { rows: existing } = await pool.query(
      `SELECT t.id FROM tasks t
       JOIN placements p ON p.id = t.placement_id
       WHERE t.id = $1 AND p.company_id = $2 AND t.deleted_at IS NULL`,
      [taskId, companyId]
    );
    if (!existing.length) throw new Error('Task not found');

    const allowedFields: Record<string, string> = {
      title: 'title',
      description: 'description',
      priority: 'priority',
      status: 'status',
      due_date: 'due_date',
      points: 'points',
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, col] of Object.entries(allowedFields)) {
      if (data[key] !== undefined) {
        setClauses.push(`${col} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (data.status === 'done') {
      setClauses.push(`completed_at = $${idx++}`);
      values.push(new Date());
    }

    if (!setClauses.length) throw new Error('No valid fields to update');

    values.push(taskId);
    const { rows } = await pool.query(
      `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${idx}
       RETURNING *`,
      values
    );

    const r = rows[0];
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      priority: r.priority,
      status: r.status,
      due_date: r.due_date,
      points: r.points,
      completed_at: r.completed_at,
    };
  }

  // ─── Submissions: List ──────────────────────────────────────────────────
  async getSubmissions(companyId: number, statusFilter?: string) {
    const pool = getPool();

    const conditions: string[] = ['p.company_id = $1'];
    const values: unknown[] = [companyId];
    let idx = 2;

    if (statusFilter) {
      conditions.push(`sub.status = $${idx++}`);
      values.push(statusFilter);
    }

    const { rows } = await pool.query(
      `SELECT sub.id, sub.status, sub.file_name, sub.file_size_kb, sub.submitted_at,
              sub.reviewer_comment, sub.reviewed_at,
              u.name AS intern_name, t.title AS task_name
       FROM submissions sub
       JOIN tasks t ON t.id = sub.task_id
       JOIN placements p ON p.id = sub.placement_id
       JOIN intern_profiles ip ON ip.id = p.intern_id
       JOIN users u ON u.id = ip.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY sub.submitted_at DESC`,
      values
    );

    return rows.map((r: any) => ({
      id: r.id,
      internName: r.intern_name,
      taskName: r.task_name,
      fileName: r.file_name,
      fileSize: r.file_size_kb,
      submittedAgo: r.submitted_at,
      status: r.status,
      reviewerComment: r.reviewer_comment,
    }));
  }

  // ─── Submissions: Review ────────────────────────────────────────────────
  async reviewSubmission(subId: number, companyId: number, reviewerId: number, data: {
    status: 'approved' | 'rejected';
    reviewerComment: string;
  }) {
    const pool = getPool();

    const { rows: existing } = await pool.query(
      `SELECT sub.id FROM submissions sub
       JOIN tasks t ON t.id = sub.task_id
       JOIN placements p ON p.id = t.placement_id
       WHERE sub.id = $1 AND p.company_id = $2`,
      [subId, companyId]
    );
    if (!existing.length) throw new Error('Submission not found');

    if (!data.reviewerComment || !data.reviewerComment.trim()) {
      throw new Error('Reviewer comment is required');
    }

    const { rows } = await pool.query(
      `UPDATE submissions SET status = $1, reviewer_comment = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4 RETURNING id, status, reviewer_comment, reviewed_at`,
      [data.status, data.reviewerComment, reviewerId, subId]
    );

    const r = rows[0];
    return {
      id: r.id,
      status: r.status,
      reviewerComment: r.reviewer_comment,
      reviewedAt: r.reviewed_at,
    };
  }

  // ─── Sessions: List ─────────────────────────────────────────────────────
  async getSessions(companyId: number, statusFilter?: string) {
    const pool = getPool();

    const conditions: string[] = ['p.company_id = $1'];
    const values: unknown[] = [companyId];
    let idx = 2;

    if (statusFilter === 'upcoming') {
      conditions.push(`s.status = 'scheduled' AND s.scheduled_at > NOW()`);
    } else if (statusFilter === 'past') {
      conditions.push(`(s.status = 'completed' OR s.scheduled_at < NOW())`);
    } else if (statusFilter === 'scheduled') {
      conditions.push(`s.status = 'scheduled'`);
    } else if (statusFilter) {
      conditions.push(`s.status = $${idx++}`);
      values.push(statusFilter);
    }

    const { rows } = await pool.query(
      `SELECT s.id, s.scheduled_at, s.duration_minutes, s.status, s.meeting_link,
              s.notes, s.intern_rating, s.intern_feedback,
              mu.name AS mentor_name, iu.name AS intern_name
       FROM sessions s
       JOIN users mu ON mu.id = s.mentor_id
       JOIN users iu ON iu.id = s.intern_id
       JOIN placements p ON p.id = s.placement_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY s.scheduled_at DESC`,
      values
    );

    return rows.map((r: any) => ({
      id: r.id,
      mentorName: r.mentor_name,
      internName: r.intern_name,
      scheduledAt: r.scheduled_at,
      durationMinutes: r.duration_minutes,
      status: r.status,
      meetingLink: r.meeting_link,
      topic: r.notes,
      rating: r.intern_rating,
      feedback: r.intern_feedback,
    }));
  }

  // ─── Sessions: Create ───────────────────────────────────────────────────
  async createSession(companyId: number, data: {
    internId: number;
    mentorId: number;
    date: string;
    time: string;
    topic: string;
    duration?: number;
    meetingLink?: string;
  }) {
    const pool = getPool();

    const { rows: placements } = await pool.query(
      `SELECT id FROM placements WHERE company_id = $1 AND intern_id = (
        SELECT id FROM intern_profiles WHERE user_id = $2
      ) AND status = 'active' LIMIT 1`,
      [companyId, data.internId]
    );

    if (!placements.length) throw new Error('No active placement found for this intern');

    const placementId = placements[0].id;
    const scheduledAt = `${data.date}T${data.time || '10:00'}`;

    const { rows } = await pool.query(
      `INSERT INTO sessions (placement_id, mentor_id, intern_id, scheduled_at, duration_minutes, meeting_link, notes, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', NOW())
       RETURNING *`,
      [placementId, data.mentorId, data.internId, scheduledAt,
       data.duration || 60, data.meetingLink || null, data.topic || null]
    );

    const r = rows[0];
    return {
      id: r.id,
      mentorId: r.mentor_id,
      internId: r.intern_id,
      scheduledAt: r.scheduled_at,
      durationMinutes: r.duration_minutes,
      status: r.status,
      meetingLink: r.meeting_link,
      topic: r.notes,
    };
  }

  // ─── Sessions: Update Status ────────────────────────────────────────────
  async updateSessionStatus(sessionId: number, companyId: number, data: {
    status: 'confirmed' | 'rescheduled' | 'cancelled';
    newDate?: string;
  }) {
    const pool = getPool();

    const { rows: existing } = await pool.query(
      `SELECT s.id FROM sessions s
       JOIN placements p ON p.id = s.placement_id
       WHERE s.id = $1 AND p.company_id = $2`,
      [sessionId, companyId]
    );
    if (!existing.length) throw new Error('Session not found');

    const setClauses: string[] = ['status = $1'];
    const values: unknown[] = [data.status];
    let idx = 2;

    if (data.newDate) {
      setClauses.push(`scheduled_at = $${idx++}`);
      values.push(data.newDate);
    }

    values.push(sessionId);
    const { rows } = await pool.query(
      `UPDATE sessions SET ${setClauses.join(', ')} WHERE id = $${idx}
       RETURNING id, status, scheduled_at`,
      values
    );

    return rows[0];
  }

  // ─── Analytics: Departments ─────────────────────────────────────────────
  async getDepartmentAnalytics(companyId: number) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT
         ip.department,
         COUNT(DISTINCT ip.id) AS intern_count,
         COALESCE(
           AVG(
             CASE WHEN tstat.total > 0 THEN (tstat.done::float / tstat.total) * 100 END
           ), 0
         ) AS avg_completion,
         COALESCE(
           AVG(
             CASE WHEN tstat.total > 0 THEN (tstat.ontime::float / tstat.total) * 100 END
           ), 0
         ) AS avg_on_time
       FROM placements p
       JOIN intern_profiles ip ON ip.id = p.intern_id
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'done') AS done,
           COUNT(*) FILTER (WHERE status = 'done' AND due_date >= NOW()) AS ontime
         FROM tasks WHERE placement_id = p.id AND deleted_at IS NULL
       ) tstat ON true
       WHERE p.company_id = $1 AND p.status = 'active'
       GROUP BY ip.department
       ORDER BY avg_completion DESC`,
      [companyId]
    );

    return rows.map((r: any) => ({
      deptName: r.department,
      internCount: Number(r.intern_count),
      avgCompletionPercent: Math.round(Number(r.avg_completion)),
      avgOnTimePercent: Math.round(Number(r.avg_on_time)),
    }));
  }

  // ─── Analytics: Tasks by Week ───────────────────────────────────────────
  async getTasksByWeek(companyId: number) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT
         DATE_TRUNC('week', t.completed_at)::date AS week_start,
         COUNT(*) AS task_count
       FROM tasks t
       JOIN placements p ON p.id = t.placement_id
       WHERE p.company_id = $1
         AND t.status = 'done'
         AND t.completed_at >= NOW() - INTERVAL '4 weeks'
       GROUP BY DATE_TRUNC('week', t.completed_at)
       ORDER BY week_start ASC`,
      [companyId]
    );

    return rows.map((r: any) => ({
      week: r.week_start,
      taskCount: Number(r.task_count),
    }));
  }

  // ─── Analytics: Performance ─────────────────────────────────────────────
  async getPerformanceAnalytics(companyId: number) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT
         u.id, u.name,
         ip.department,
         COUNT(t.id) FILTER (WHERE t.status = 'done') AS tasks_done,
         COUNT(t.id) AS total_tasks,
         COALESCE(SUM(t.points) FILTER (WHERE t.status = 'done'), 0) AS points,
         COUNT(t.id) FILTER (WHERE t.status = 'done' AND t.due_date >= NOW()) AS ontime_tasks,
         (SELECT COUNT(*) FROM submissions sub
          JOIN tasks tk ON tk.id = sub.task_id
          WHERE tk.placement_id = p.id AND sub.submitted_at >= NOW() - INTERVAL '7 days') AS recent_submissions
       FROM placements p
       JOIN intern_profiles ip ON ip.id = p.intern_id
       JOIN users u ON u.id = ip.user_id
       LEFT JOIN tasks t ON t.placement_id = p.id AND t.deleted_at IS NULL
       WHERE p.company_id = $1 AND p.status = 'active'
       GROUP BY u.id, u.name, ip.department, p.id
       ORDER BY points DESC`,
      [companyId]
    );

    return rows.map((r: any, index: number) => {
      const total = Number(r.total_tasks);
      const done = Number(r.tasks_done);
      const ontime = Number(r.ontime_tasks);
      const onTimePercent = total > 0 ? Math.round((ontime / total) * 100) : 0;
      const recentSubs = Number(r.recent_submissions);
      return {
        rank: index + 1,
        name: r.name,
        dept: r.department,
        tasksDone: done,
        onTimePercent,
        points: Number(r.points),
        trend: 'up',
        isAtRisk: onTimePercent < 50 || recentSubs === 0,
      };
    });
  }

  // ─── Feedback: List ─────────────────────────────────────────────────────
  async getFeedback(companyId: number) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT f.id, f.rating, f.comment, f.week_number, f.created_at,
              u.name AS intern_name, ip.department
       FROM feedback f
       JOIN placements p ON p.id = f.placement_id
       JOIN intern_profiles ip ON ip.id = p.intern_id
       JOIN users u ON u.id = ip.user_id
       WHERE p.company_id = $1 AND f.type = 'mentor_to_intern'
       ORDER BY f.created_at DESC`,
      [companyId]
    );

    // Compute weekly averages
    const weeklyMap = new Map<number, { total: number; count: number }>();
    for (const r of rows) {
      const w = r.week_number || 0;
      const entry = weeklyMap.get(w) || { total: 0, count: 0 };
      entry.total += r.rating;
      entry.count += 1;
      weeklyMap.set(w, entry);
    }
    const weeklyAverages = Array.from(weeklyMap.entries())
      .map(([week, { total, count }]) => ({ week, averageRating: Math.round((total / count) * 10) / 10 }))
      .sort((a, b) => a.week - b.week);

    return {
      feedback: rows.map((r: any) => ({
        id: r.id,
        internName: r.intern_name,
        department: r.department,
        rating: r.rating,
        comment: r.comment,
        week: r.week_number,
        createdAt: r.created_at,
      })),
      weeklyAverages,
    };
  }

  // ─── Feedback: Create ───────────────────────────────────────────────────
  async createFeedback(companyId: number, givenBy: number, data: {
    internId: number;
    week: number;
    rating: number;
    comment: string;
  }) {
    const pool = getPool();

    const { rows: placements } = await pool.query(
      `SELECT id FROM placements WHERE company_id = $1 AND intern_id = (
        SELECT id FROM intern_profiles WHERE user_id = $2
      ) AND status = 'active' LIMIT 1`,
      [companyId, data.internId]
    );
    if (!placements.length) throw new Error('No active placement found for this intern');

    const placementId = placements[0].id;

    // Prevent duplicate
    const { rows: dup } = await pool.query(
      `SELECT id FROM feedback WHERE placement_id = $1 AND week_number = $2 AND type = 'mentor_to_intern'`,
      [placementId, data.week]
    );
    if (dup.length) throw new Error('Feedback already submitted for this intern and week');

    const { rows } = await pool.query(
      `INSERT INTO feedback (placement_id, given_by, type, rating, comment, week_number, created_at)
       VALUES ($1, $2, 'mentor_to_intern', $3, $4, $5, NOW())
       RETURNING id, rating, comment, week_number`,
      [placementId, givenBy, data.rating, data.comment, data.week]
    );

    const r = rows[0];
    return { id: r.id, rating: r.rating, comment: r.comment, week: r.week_number };
  }

  // ─── Feedback: Intern-to-Mentor ─────────────────────────────────────────
  async getInternToMentorFeedback(companyId: number, mentorId?: number) {
    const pool = getPool();

    const conditions: string[] = [
      `f.type = 'intern_to_mentor'`,
      `p.company_id = $1`,
    ];
    const values: unknown[] = [companyId];
    let idx = 2;

    if (mentorId) {
      conditions.push(`p.mentor_id = $${idx++}`);
      values.push(mentorId);
    }

    const { rows } = await pool.query(
      `SELECT u.name AS intern_name, mu.name AS mentor_name,
              f.rating, f.comment
       FROM feedback f
       JOIN placements p ON p.id = f.placement_id
       JOIN intern_profiles ip ON ip.id = p.intern_id
       JOIN users u ON u.id = ip.user_id
       LEFT JOIN users mu ON mu.id = p.mentor_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY f.created_at DESC`,
      values
    );

    return rows.map((r: any) => ({
      internName: r.intern_name,
      mentorName: r.mentor_name,
      rating: r.rating,
      comment: r.comment,
    }));
  }

  // ─── Settings: Get Profile ──────────────────────────────────────────────
  async getCompanyProfile(companyId: number) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT * FROM companies WHERE id = $1 AND deleted_at IS NULL`,
      [companyId]
    );
    if (!rows.length) throw new Error('Company not found');

    const r = rows[0];

    const { rows: deptRows } = await pool.query(
      `SELECT DISTINCT department FROM internship_slots
       WHERE company_id = $1 AND department IS NOT NULL AND deleted_at IS NULL
       ORDER BY department`,
      [companyId]
    );

    return {
      name: r.company_name,
      logo: r.logo_url,
      about: r.description,
      industry: r.industry,
      size: r.number_of_employees,
      website: r.website,
      coordinator: {
        name: r.contact_person,
        phone: r.contact_phone,
        email: r.email,
      },
      departments: deptRows.map((d: any) => d.department),
      notificationPreferences: {
        emailNotifications: true,
        weeklyDigest: true,
      },
    };
  }

  // ─── Settings: Update Profile ───────────────────────────────────────────
  async updateCompanyProfile(companyId: number, data: Record<string, any>) {
    const pool = getPool();

    const fieldMap: Record<string, string> = {
      name: 'company_name',
      logo: 'logo_url',
      about: 'description',
      industry: 'industry',
      size: 'number_of_employees',
      website: 'website',
      contactPerson: 'contact_person',
      contactPhone: 'contact_phone',
      email: 'email',
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        setClauses.push(`${col} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (data.coordinator) {
      if (data.coordinator.name !== undefined) {
        setClauses.push(`contact_person = $${idx++}`);
        values.push(data.coordinator.name);
      }
      if (data.coordinator.phone !== undefined) {
        setClauses.push(`contact_phone = $${idx++}`);
        values.push(data.coordinator.phone);
      }
      if (data.coordinator.email !== undefined) {
        setClauses.push(`email = $${idx++}`);
        values.push(data.coordinator.email);
      }
    }

    if (!setClauses.length) throw new Error('No valid fields to update');

    values.push(companyId);
    await pool.query(
      `UPDATE companies SET ${setClauses.join(', ')} WHERE id = $${idx}`,
      values
    );

    return this.getCompanyProfile(companyId);
  }

  // ─── Mentors: List ──────────────────────────────────────────────────────
  async getMentors(companyId: number) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT cm.id, cm.name, cm.role, cm.email,
              (SELECT COUNT(*) FROM placements p
               JOIN intern_profiles ip ON ip.id = p.intern_id
               WHERE p.company_id = $1 AND p.status = 'active'
                 AND ip.mentor_name ILIKE cm.name) AS intern_count
       FROM company_mentors cm
       WHERE cm.company_id = $1 AND cm.deleted_at IS NULL
       ORDER BY cm.name`,
      [companyId]
    );

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      email: r.email,
      internCount: Number(r.intern_count),
    }));
  }

  // ─── Mentors: Add ───────────────────────────────────────────────────────
  async addMentor(companyId: number, data: { name: string; role: string; email: string }) {
    const pool = getPool();

    const { rows } = await pool.query(
      `INSERT INTO company_mentors (company_id, name, role, email, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, role, email`,
      [companyId, data.name, data.role, data.email]
    );

    const r = rows[0];
    return { id: r.id, name: r.name, role: r.role, email: r.email, internCount: 0 };
  }

  // ─── Mentors: Remove ────────────────────────────────────────────────────
  async removeMentor(companyId: number, mentorId: number) {
    const pool = getPool();

    const { rowCount } = await pool.query(
      `UPDATE company_mentors SET deleted_at = NOW()
       WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [mentorId, companyId]
    );

    if (!rowCount) throw new Error('Mentor not found');
  }
}
