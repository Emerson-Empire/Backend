import { Router } from "express";
import * as ContactController from "../controllers/ContactController";

const router = Router();

router.post('/', ContactController.submitContact);

export default router;