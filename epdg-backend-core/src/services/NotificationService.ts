import { getPool } from "../db";

export class NotificationService {
 
  async getNotifications(schoolId: string) {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT 
          id,
          title,
          body,
          created_at as "timeAgo",
          type,
          unread
       FROM notifications
       WHERE school_id = $1
       ORDER BY created_at DESC`,
      [schoolId]
    );
    return rows;
  }

  async markAsRead(schoolId: string, notifId: string) {
    const pool = getPool();
    const { rows } = await pool.query(
      `UPDATE notifications 
       SET unread = false 
       WHERE school_id = $1 AND id = $2
       RETURNING id, title, body, created_at as "timeAgo", type, unread`,
      [schoolId, notifId]
    );
    return rows[0];
  }

  async markAllAsRead(schoolId: string) {
    const pool = getPool();
    const { rowCount } = await pool.query(
      `UPDATE notifications 
       SET unread = false 
       WHERE school_id = $1 AND unread = true`,
      [schoolId]
    );
    return rowCount || 0;
  }

  async deleteNotification(schoolId: string, notifId: string) {
    const pool = getPool();
    await pool.query(
      `DELETE FROM notifications 
       WHERE school_id = $1 AND id = $2`,
      [schoolId, notifId]
    );
    return true;
  }
}