import { Router } from "express";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { getActiveBusinessTypes } from "../business/business-type.controller.js";
import {
  createBusiness,
  createBusinessType,
  createResourceType,
  getSummary,
  listBusinesses,
  listBusinessTypes,
  listResourceTypes,
  resetOwnerPassword,
  updateBusinessStatus,
  updateBusinessType,
  updateBusinessTypeStatus,
  updatePlanExpiry,
  updateResourceType,
  updateResourceTypeStatus,
} from "./admin.controller.js";

const adminRouter = Router();
adminRouter.use(authorize("PLATFORM_ADMIN"));
adminRouter.get("/business-types/active", getActiveBusinessTypes);
adminRouter.get("/business-types", listBusinessTypes);
adminRouter.post("/business-types", createBusinessType);
adminRouter.patch("/business-types/:id", updateBusinessType);
adminRouter.patch("/business-types/:id/status", updateBusinessTypeStatus);
adminRouter.get("/resource-types", listResourceTypes);
adminRouter.post("/resource-types", createResourceType);
adminRouter.patch("/resource-types/:businessTypeId/:code", updateResourceType);
adminRouter.patch("/resource-types/:businessTypeId/:code/status", updateResourceTypeStatus);
adminRouter.get("/summary", getSummary);
adminRouter.get("/businesses", listBusinesses);
adminRouter.post("/businesses", createBusiness);
adminRouter.patch("/businesses/:id/status", updateBusinessStatus);
adminRouter.patch("/businesses/:id/plan-expiry", updatePlanExpiry);
adminRouter.post("/businesses/:id/reset-owner-password", resetOwnerPassword);
export default adminRouter;
