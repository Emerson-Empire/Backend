import getPool from "../config/database";
import { ContactRequest, ContactRequestInput } from "../models/ContactRequest";

const pool = getPool();

export class ContactService {
  async create(data: ContactRequestInput): Promise<ContactRequest> {
    const result = await pool.query<ContactRequest>(
      `INSERT INTO public.contact_requests
      (
        full_name,
        email,
        whatsapp,
        service,
        message
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [data.full_name, data.email, data.whatsapp, data.service, data.message],
    );

    return result.rows[0];
  }
}
