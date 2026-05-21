export interface ContactRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  serviceInterest: string;
  urgency: number;
  trackInterest: string;
  source: string;
  status: string;
  createdAt: Date;
}

export type CreateContactDto = Omit<
  ContactRequest,
  "id" | "status" | "createdAt"
>;
