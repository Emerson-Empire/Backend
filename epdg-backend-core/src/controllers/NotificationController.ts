import { Request, Response } from "express";
import { NotificationService } from "../services/NotificationService";

const notificationService = new NotificationService();

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const { schoolId } = req.params;
        const data = await notificationService.getNotifications(schoolId);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { schoolId, notifId } = req.params;
       
        const data = await notificationService.markAsRead(schoolId, notifId);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const { schoolId } = req.params;
        const count = await notificationService.markAllAsRead(schoolId);
        res.status(200).json({ success: true, updated: count });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const { schoolId, notifId } = req.params;
        await notificationService.deleteNotification(schoolId, notifId);
        res.status(200).json({ success: true, message: 'Notification dismissed' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};