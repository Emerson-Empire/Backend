export interface Session {
  id: number;
  company_id: number;
  placement_id: number;
  intern_id: number;
  mentor_id: number | null;
  scheduled_at: string;
  status: string;
  created_at: Date;
}
