import { Router } from "express";
import { userAuth } from "../middlewares/auth.middleware.js";
import resourceRouter from "../modules/resource/resource.routes.js";
import userRouter from "../modules/users/user.routes.js";
import authRouter from "./auth.routes.js";

const apiRouter = Router();

// Public endpoints for registration, login, logout, and business-type selection.
apiRouter.use("/", authRouter);
// Resource endpoints require an authenticated user before reaching the module router.
apiRouter.use("/resources", userAuth, resourceRouter);
// User-management endpoints require authentication before reaching the module router.
apiRouter.use("/users", userAuth, userRouter);

export default apiRouter;
