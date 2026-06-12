import { getPool } from "../db";
import bcrypt from "bcrypt";

export class ProfileService {
 
  async getProfile(schoolId: string) {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT 
          name, logo, about, location, website, accreditation,
          coordinator_name as "coordinatorName",
          coordinator_phone as "coordinatorPhone",
          coordinator_email as "coordinatorEmail",
          courses_offered as "coursesOffered", 
          notification_preferences as "notificationPreferences"
       FROM schools
       WHERE id = $1`,
      [schoolId]
    );
    return rows[0];
  }

  async updateProfile(schoolId: string, fields: any) {
    const pool = getPool();
    
    const fieldMapping: any = {
      name: 'name',
      logo: 'logo',
      about: 'about',
      location: 'location',
      website: 'website',
      accreditation: 'accreditation',
      coordinatorName: 'coordinator_name',
      coordinatorPhone: 'coordinator_phone',
      coordinatorEmail: 'coordinator_email',
      coursesOffered: 'courses_offered',
      notificationPreferences: 'notification_preferences'
    };

    let query = `UPDATE schools SET `;
    const values: any[] = [];
    let count = 1;

    Object.keys(fields).forEach((key) => {
      const dbColumn = fieldMapping[key];
      if (dbColumn) {
        query += `${dbColumn} = $${count}, `;
        values.push(fields[key]);
        count++;
      }
    });

    query = query.slice(0, -2);
    query += ` WHERE id = $${count}`;
    values.push(schoolId);

    await pool.query(query, values);
    
    return this.getProfile(schoolId);
  }

  async changePassword(schoolId: string, currentPassword: string, newPassword: string) {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT password_hash FROM schools WHERE id = $1`,
      [schoolId]
    );

    if (rows.length === 0) {
      throw new Error("School not found");
    }

    const storedHash = rows[0].password_hash;

    const isMatch = await bcrypt.compare(currentPassword, storedHash);
    if (!isMatch) {
      throw new Error("Incorrect current password");
    }

    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    await pool.query(
      `UPDATE schools SET password_hash = $1 WHERE id = $2`,
      [newHash, schoolId]
    );

    return true;
  }
}