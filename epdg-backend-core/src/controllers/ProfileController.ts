import { Request, Response } from "express";
import { ProfileService } from "../services/ProfileService";

const profileService = new ProfileService();

export const getProfile = async (req: Request, res: Response) => {
    try {
        const { schoolId } = req.params;
        const data = await profileService.getProfile(schoolId);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { schoolId } = req.params;
        const data = await profileService.updateProfile(schoolId, req.body);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { schoolId } = req.params;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
        }

        await profileService.changePassword(schoolId, currentPassword, newPassword);
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {

        if (error.message === 'Incorrect current password' || error.message === 'School not found') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};