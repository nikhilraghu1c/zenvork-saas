import { Router } from "express";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { getActiveBusinessTypes } from "../business/business-type.controller.js";
import {
  createBusiness,
  getSummary,
  listBusinesses,
  resetOwnerPassword,
  updateBusinessStatus,
  updatePlanExpiry,
} from "./admin.controller.js";

const adminRouter = Router();
adminRouter.use(authorize("PLATFORM_ADMIN"));
adminRouter.get("/business-types", getActiveBusinessTypes);
adminRouter.get("/summary", getSummary);
adminRouter.get("/businesses", listBusinesses);
adminRouter.post("/businesses", createBusiness);
adminRouter.patch("/businesses/:id/status", updateBusinessStatus);
adminRouter.patch("/businesses/:id/plan-expiry", updatePlanExpiry);
adminRouter.post("/businesses/:id/reset-owner-password", resetOwnerPassword);
export default adminRouter;
