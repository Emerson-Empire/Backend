import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { CompanyService } from '../services/CompanyService';

const companyService = new CompanyService();

// ─── Helper ──────────────────────────────────────────────────────────────
async function verifyAccess(req: Request, companyId: number): Promise<void> {
  const userId = (req as AuthRequest).user.id;
  await companyService.verifyOwnership(companyId, userId);
}

// ─── Dashboard: Stats ───────────────────────────────────────────────────
export const getStats = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);
    const data = await companyService.getStats(companyId);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Dashboard: Active interns ──────────────────────────────────────────
export const getActiveInterns = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 50);
    const data = await companyService.getActiveInterns(companyId, limit);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Dashboard: Upcoming sessions ───────────────────────────────────────
export const getUpcomingSessions = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);
    const limit = Math.min(Math.max(Number(req.query.limit) || 3, 1), 50);
    const data = await companyService.getUpcomingSessions(companyId, limit);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Dashboard: Recent feedback ─────────────────────────────────────────
export const getRecentFeedback = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);
    const limit = Math.min(Math.max(Number(req.query.limit) || 2, 1), 50);
    const data = await companyService.getRecentFeedback(companyId, limit);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Interns: List all ──────────────────────────────────────────────────
export const getAllInterns = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);
    const { dept, status } = req.query as Record<string, string>;
    const data = await companyService.getAllInterns(companyId, { dept, status });
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Interns: Detail ────────────────────────────────────────────────────
export const getInternDetail = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    const internId = Number(req.params.internId);
    if (isNaN(companyId) || isNaN(internId)) {
      res.status(400).json({ success: false, message: 'Invalid ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);
    const data = await companyService.getInternDetail(companyId, internId);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message === 'Intern not found' ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Slots: List ────────────────────────────────────────────────────────
export const getSlots = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);
    const data = await companyService.getSlots(companyId);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Slots: Create ──────────────────────────────────────────────────────
export const createSlot = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);

    const { title, department } = req.body;
    if (!title || !department) {
      res.status(400).json({ success: false, message: 'Title and department are required', errors: [] });
      return;
    }

    const data = await companyService.createSlot(companyId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Slots: Update ──────────────────────────────────────────────────────
export const updateSlot = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    const slotId = Number(req.params.slotId);
    if (isNaN(companyId) || isNaN(slotId)) {
      res.status(400).json({ success: false, message: 'Invalid ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);
    const data = await companyService.updateSlot(companyId, slotId, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message === 'Slot not found' ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Applications: List ─────────────────────────────────────────────────
export const getApplications = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);
    const { status } = req.query as Record<string, string>;
    const data = await companyService.getApplications(companyId, status);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Applications: Update status ────────────────────────────────────────
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    const appId = Number(req.params.appId);
    if (isNaN(companyId) || isNaN(appId)) {
      res.status(400).json({ success: false, message: 'Invalid ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);

    const { status, rejectionReason } = req.body;
    if (!['shortlisted', 'accepted', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status must be shortlisted, accepted, or rejected',
        errors: [],
      });
      return;
    }

    if (status === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
      res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
        errors: [],
      });
      return;
    }

    const data = await companyService.updateApplicationStatus(appId, companyId, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message === 'Application not found' ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Tasks: List ────────────────────────────────────────────────────────
export const getTasks = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);
    const { internName, status } = req.query as Record<string, string>;
    const data = await companyService.getTasks(companyId, { internName, status });
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Tasks: Create ──────────────────────────────────────────────────────
export const createTask = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);

    const { title, assignedTo, dueDate } = req.body;
    if (!title || !assignedTo || !dueDate) {
      res.status(400).json({
        success: false,
        message: 'Title, assignedTo, and dueDate are required',
        errors: [],
      });
      return;
    }

    const userId = (req as AuthRequest).user.id;
    const data = await companyService.createTask(companyId, userId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Tasks: Update ──────────────────────────────────────────────────────
export const updateTask = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    const taskId = Number(req.params.taskId);
    if (isNaN(companyId) || isNaN(taskId)) {
      res.status(400).json({ success: false, message: 'Invalid ID', errors: [] });
      return;
    }
    await verifyAccess(req, companyId);
    const data = await companyService.updateTask(companyId, taskId, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message === 'Task not found' ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Submissions: List ──────────────────────────────────────────────────
export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const { status } = req.query as Record<string, string>;
    const data = await companyService.getSubmissions(companyId, status);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Submissions: Review ────────────────────────────────────────────────
export const reviewSubmission = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    const subId = Number(req.params.subId);
    if (isNaN(companyId) || isNaN(subId)) { res.status(400).json({ success: false, message: 'Invalid ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const { status, reviewerComment } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status must be approved or rejected', errors: [] }); return;
    }
    if (!reviewerComment || !reviewerComment.trim()) {
      res.status(400).json({ success: false, message: 'Reviewer comment is required', errors: [] }); return;
    }
    const userId = (req as AuthRequest).user.id;
    const data = await companyService.reviewSubmission(subId, companyId, userId, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message === 'Submission not found' ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Sessions: List ─────────────────────────────────────────────────────
export const getSessions = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const { status } = req.query as Record<string, string>;
    const data = await companyService.getSessions(companyId, status);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Sessions: Create ───────────────────────────────────────────────────
export const createSession = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const { internId, mentorId, date, topic } = req.body;
    if (!internId || !mentorId || !date || !topic) {
      res.status(400).json({ success: false, message: 'internId, mentorId, date, and topic are required', errors: [] }); return;
    }
    const data = await companyService.createSession(companyId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const code = err.message.includes('placement') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Sessions: Update Status ────────────────────────────────────────────
export const updateSessionStatus = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    const sessionId = Number(req.params.sessionId);
    if (isNaN(companyId) || isNaN(sessionId)) { res.status(400).json({ success: false, message: 'Invalid ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    if (!['confirmed', 'rescheduled', 'cancelled'].includes(req.body.status)) {
      res.status(400).json({ success: false, message: 'Status must be confirmed, rescheduled, or cancelled', errors: [] }); return;
    }
    const data = await companyService.updateSessionStatus(sessionId, companyId, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message === 'Session not found' ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Analytics: Departments ─────────────────────────────────────────────
export const getDepartmentAnalytics = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const data = await companyService.getDepartmentAnalytics(companyId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Analytics: Tasks by Week ──────────────────────────────────────────
export const getTasksByWeek = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const data = await companyService.getTasksByWeek(companyId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Analytics: Performance ─────────────────────────────────────────────
export const getPerformanceAnalytics = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const data = await companyService.getPerformanceAnalytics(companyId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Feedback: List ─────────────────────────────────────────────────────
export const getFeedback = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const data = await companyService.getFeedback(companyId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Feedback: Create ──────────────────────────────────────────────────
export const createFeedback = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const { internId, week, rating, comment } = req.body;
    if (!internId || week === undefined || !rating || !comment) {
      res.status(400).json({ success: false, message: 'internId, week, rating, and comment are required', errors: [] }); return;
    }
    const userId = (req as AuthRequest).user.id;
    const data = await companyService.createFeedback(companyId, userId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const code = err.message.includes('already') ? 409 : err.message.includes('placement') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Feedback: Intern-to-Mentor ─────────────────────────────────────────
export const getInternToMentorFeedback = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const { mentorId } = req.query as Record<string, string>;
    const data = await companyService.getInternToMentorFeedback(companyId, mentorId ? Number(mentorId) : undefined);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Settings: Get Profile ──────────────────────────────────────────────
export const getCompanyProfile = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const data = await companyService.getCompanyProfile(companyId);
    res.json({ success: true, data });
  } catch (err: any) {
    const code = err.message === 'Company not found' ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Settings: Update Profile ───────────────────────────────────────────
export const updateCompanyProfile = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const data = await companyService.updateCompanyProfile(companyId, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Mentors: List ──────────────────────────────────────────────────────
export const getMentors = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const data = await companyService.getMentors(companyId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Mentors: Add ───────────────────────────────────────────────────────
export const addMentor = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId)) { res.status(400).json({ success: false, message: 'Invalid company ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    const { name, role, email } = req.body;
    if (!name || !role || !email) {
      res.status(400).json({ success: false, message: 'name, role, and email are required', errors: [] }); return;
    }
    const data = await companyService.addMentor(companyId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// ─── Mentors: Remove ────────────────────────────────────────────────────
export const removeMentor = async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    const mentorId = Number(req.params.mentorId);
    if (isNaN(companyId) || isNaN(mentorId)) { res.status(400).json({ success: false, message: 'Invalid ID', errors: [] }); return; }
    await verifyAccess(req, companyId);
    await companyService.removeMentor(companyId, mentorId);
    res.json({ success: true, message: 'Mentor removed' });
  } catch (err: any) {
    const code = err.message === 'Mentor not found' ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};
