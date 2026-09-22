import { Router } from "express";
import { getDashboardSummary } from "./dashboard.controller.js";

const dashboardRouter = Router();

// Dashboard data is derived only from records in the authenticated tenant.
dashboardRouter.get("/summary", getDashboardSummary);

export default dashboardRouter;
