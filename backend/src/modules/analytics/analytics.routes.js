import { Router } from "express";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { getRevenueAnalytics } from "./analytics.controller.js";

const analyticsRouter = Router();

// Revenue reporting is owner-only because it exposes tenant financial performance.
analyticsRouter.get("/revenue", authorize("OWNER"), getRevenueAnalytics);

export default analyticsRouter;
