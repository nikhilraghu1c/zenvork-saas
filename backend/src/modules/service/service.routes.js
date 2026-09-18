import { Router } from "express";
import { authorize } from "../../middlewares/authorize.middleware.js";
import {
  createService,
  getServiceById,
  getServiceOptions,
  getServices,
  updateService,
} from "./service.controller.js";

const serviceRouter = Router();

// Owners and staff can select and view services owned by their authenticated business.
serviceRouter.get("/", getServices);
serviceRouter.get("/options", getServiceOptions);
serviceRouter.get("/:id", getServiceById);
// Service catalogue changes are restricted to business owners.
serviceRouter.post("/", authorize("OWNER"), createService);
serviceRouter.patch("/:id", authorize("OWNER"), updateService);

export default serviceRouter;
