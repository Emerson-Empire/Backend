export interface ContactRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  service_interest: string | null;
  urgency: number | null;
  message: string;
  source: string;
  status: string;
  created_at: Date;
}

export interface ContactRequestInput {
  first_name: string;
  last_name: string;
  email: string;
  service_interest?: string | null;
  urgency?: number | null;
  message: string;
}
