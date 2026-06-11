export interface Feedback {
  id: number;
  company_id: number;
  placement_id: number;
  intern_id: number;
  intern_name: string | null;
  rating: number;
  comment: string | null;
  week_number: number | null;
  created_at: Date;
}
