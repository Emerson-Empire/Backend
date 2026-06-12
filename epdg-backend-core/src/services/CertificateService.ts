import { getPool } from "../db";

export class CertificateService {

  async getCertificates(schoolId: string) {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT 
          s.full_name as "studentName",
          c.company,
          c.completion_date as "completionDate",
          CONCAT(LEFT(c.certificate_token, 4), '****') as "token",
          c.download_url as "downloadUrl"
       FROM completions c
       JOIN students s ON c.student_id = s.id
       WHERE c.school_id = $1
       ORDER BY c.completion_date DESC`,
      [schoolId]
    );
    return rows;
  }

  async getCertificateByToken(token: string) {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT 
          s.full_name as "studentName",
          c.company,
          c.completion_date as "completionDate",
          c.certificate_token as "token",
          c.download_url as "downloadUrl"
       FROM completions c
       JOIN students s ON c.student_id = s.id
       WHERE c.certificate_token = $1`,
      [token]
    );
    return rows[0];
  }
}