import { Router } from "express";
import { submitContact } from "../controllers/ContactController";

const router = Router();

router.post('/', submitContact)

export default router;