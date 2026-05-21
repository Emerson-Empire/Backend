import { Request, Response } from "express";
import { ContactService } from "../services/ContactService";

const contactService = new ContactService();

export const submitContact = async (req: Request, res: Response) => {
  try {
    const {
        full_name,
        email,
        whatsapp,
        service,
        message,
    } = req.body;

    if (
        !full_name ||
        !email ||
        !whatsapp ||
        !service ||
        !message
    ) {
        res.status(400).json({
            message: `All fields are required`,
        });
        return;
    }
    const contact = await contactService.create({
      full_name,
      email,
      whatsapp,
      service,
      message,
    });

    res.status(201).json(contact);

  } catch (error) {
    res.status(500).json({
      message: `Error submitting contact form`,
    });
  }
};
