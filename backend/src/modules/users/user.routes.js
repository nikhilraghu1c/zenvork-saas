import { Router } from "express";
import { authorize } from "../../middlewares/authorize.middleware.js";
import {
  createStaffUser,
  getStaffUsers,
  updateStaffStatus,
} from "./user.controller.js";

const userRouter = Router();

// Owners can see only staff accounts belonging to their own business.
userRouter.get("/", authorize("OWNER"), getStaffUsers);
// Owners create staff only; role and business identity are server-controlled.
userRouter.post("/", authorize("OWNER"), createStaffUser);
// Owners can toggle access for a tenant-owned staff account without removing its history.
userRouter.patch("/:id/status", authorize("OWNER"), updateStaffStatus);

export default userRouter;
