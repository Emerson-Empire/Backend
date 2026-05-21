import getPool from "../config/database";
import { CreateContactDto } from "../models/ContactRequest";

export async function createContact(dto: CreateContactDto) {
  const query = `
    INSERT INTO contact_requests (
      first_name,
      last_name,
      email,
      phone,
      message,
      service_interest,
      urgency,
      track_interest,
      source,
      status
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, 'new'
    )
    RETURNING *
  `;

  const values = [
    dto.firstName,
    dto.lastName,
    dto.email,
    dto.phone,
    dto.message,
    dto.serviceInterest,
    dto.urgency,
    dto.trackInterest,
    dto.source,
  ];

  const pool = getPool();
  const { rows } = await pool.query(query, values);

  return rows[0];
}
