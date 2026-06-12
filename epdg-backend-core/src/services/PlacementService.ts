import { getPool } from "../db";

export class PlacementService {
  async getPipelineBoard(schoolId: string, dept?: string) {
    const pool = getPool();

    let query = `
      SELECT 
        s.full_name as "name",
        s.student_id as "studentId",
        s.department,
        (CURRENT_DATE - ip.stage_entered_date)::int as "daysInStage",
        ip.company,
        ip.mentor,
        ip.progress,
        ip.updated_at as "lastUpdated",
        ip.status as "stage"
      FROM intern_profiles ip
      JOIN students s ON ip.student_id = s.id
      WHERE ip.school_id = $1
    `;
    
    const values: any[] = [schoolId];
    
    if (dept) {
      query += ` AND s.department = $2`;
      values.push(dept);
    }
    
    const { rows } = await pool.query(query, values);
    
    const pipelineGroups: any = {
      submitted: [],
      approved: [],
      invited: [],
      onboarding: [],
      active: [],
      completed: []
    };
    
    rows.forEach((row: any) => {
      const stage = row.stage; // ex: 'submitted', 'active', etc.
      if (pipelineGroups[stage]) {
        pipelineGroups[stage].push({
          name: row.name,
          studentId: row.studentId,
          department: row.department,
          daysInStage: row.daysInStage || 0,
          company: row.company,
          mentor: row.mentor,
          progress: row.progress,
          lastUpdated: row.lastUpdated
        });
      }
    });
    
    return pipelineGroups;
  }

  async getPipelineStats(schoolId: string) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT 
          COUNT(*)::int as "totalInPipeline",
          COALESCE(ROUND(AVG(days_to_placement), 1), 0)::float as "avgDaysToPlacement",
          COALESCE(ROUND((COUNT(*) FILTER (WHERE status = 'completed')::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 1), 0)::float as "successRate"
       FROM intern_profiles
       WHERE school_id = $1`,
      [schoolId]
    );
    
    return rows[0] || { totalInPipeline: 0, avgDaysToPlacement: 0, successRate: 0 };
  }
}