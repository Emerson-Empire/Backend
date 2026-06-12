import { Router } from "express";
import * as CertificateController from "../controllers/CertificateController";

const router = Router();

router.post('/verify', CertificateController.verifyCertificate);
router.get('/:token', CertificateController.getCertificateByToken);

export default router;