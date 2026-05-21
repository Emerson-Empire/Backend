import { Request, Response } from "express";
import { createContact } from "../services/ContactService";
import { CreateContactDto } from "../models/ContactRequest";

export async function submitContact(req: Request, res: Response) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      message,
      serviceInterest,
      urgency,
      trackInterest,
      source,
    }: CreateContactDto = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !message ||
      !serviceInterest ||
      !urgency ||
      !trackInterest ||
      !source
    ) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    const contact = await createContact({
      firstName,
      lastName,
      email,
      phone,
      message,
      serviceInterest,
      urgency,
      trackInterest,
      source,
    });

    return res.status(201).json({
      success: true,
      contact,
    });
  } catch (error: any) {
    console.error("Submit contact error:", error);

    if (error?.code === "23505") {
      res
        .status(409)
        .json({ message: "A contact request with this email already exists" });
      return;
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
