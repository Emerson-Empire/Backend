export interface ContactRequest {
    id: string;
    full_name: string;
    email: string;
    whatsapp: string;
    service: string;
    message: string;
    created_at: Date;
}

export interface ContactRequestInput {
  full_name: string;
  email: string;
  whatsapp: string;
  service: string;
  message: string;
}