import { Request, Response } from "express";
import { PlacementService } from "../services/PlacementService";

const placementService = new PlacementService();

export const getPipelineBoard = async (req: Request, res: Response) => {
    try {
        const { schoolId } = req.params;
        const dept = req.query.dept as string; 
        
        const data = await placementService.getPipelineBoard(schoolId, dept);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPipelineStats = async (req: Request, res: Response) => {
    try {
        const { schoolId } = req.params;
        const data = await placementService.getPipelineStats(schoolId);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};