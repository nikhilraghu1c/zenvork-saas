import { Router } from "express";
import { userAuth } from "../middlewares/auth.middleware.js";
import bookingRouter from "../modules/booking/booking.routes.js";
import clientRouter from "../modules/client/client.routes.js";
import dashboardRouter from "../modules/dashboard/dashboard.routes.js";
import resourceRouter from "../modules/resource/resource.routes.js";
import serviceRouter from "../modules/service/service.routes.js";
import userRouter from "../modules/users/user.routes.js";
import authRouter from "./auth.routes.js";

const apiRouter = Router();

// Public endpoints for registration, login, logout, and business-type selection.
apiRouter.use("/", authRouter);
// Resource endpoints require an authenticated user before reaching the module router.
apiRouter.use("/resources", userAuth, resourceRouter);
// Service catalogue endpoints require authentication and are tenant-scoped by the module.
apiRouter.use("/services", userAuth, serviceRouter);
// Client endpoints require authentication and derive their tenant from the signed-in user.
apiRouter.use("/clients", userAuth, clientRouter);
// Dashboard summary queries are available to every authenticated business user.
apiRouter.use("/dashboard", userAuth, dashboardRouter);
// Booking endpoints require authentication and are tenant-scoped by the signed-in user.
apiRouter.use("/bookings", userAuth, bookingRouter);
// User-management endpoints require authentication before reaching the module router.
apiRouter.use("/users", userAuth, userRouter);

export default apiRouter;
