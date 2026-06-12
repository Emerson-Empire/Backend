import { Request, Response } from "express";
import { SchoolService } from "../services/SchoolService";

const schoolService = new SchoolService();

//school dashboard
export const getStats = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const data = await schoolService.getStats(schoolId);

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPipeline = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const data = await schoolService.getPipeline(schoolId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentCompletions = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 3;

    const data = await schoolService.getRecentCompletions(schoolId, limit);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingActions = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const data = await schoolService.getPendingActions(schoolId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//student management

export const getStudents = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;

    const search = req.query.search as string;
    const status = req.query.status as string;

    const data = await schoolService.getStudents(schoolId, search, status);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { schoolId, studentId } = req.params;

    const data = await schoolService.getStudentById(schoolId, studentId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const registerStudent = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;

    const data = await schoolService.registerStudent(schoolId, req.body);

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const bulkRegisterStudents = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;

    const data = await schoolService.bulkRegisterStudents(
      schoolId,
      req.body.students,
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;

    const data = await schoolService.getSubmissions(schoolId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStudentProgress = async (req: Request, res: Response) => {
  try {
    const { schoolId, studentId } = req.params;
    const data = await schoolService.getStudentProgress(schoolId, studentId);

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCohortSummary = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const data = await schoolService.getCohortSummary(schoolId);

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
