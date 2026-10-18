import express from "express";
import { login } from "../controllers/auth/login.controller.js";
import { logout } from "../controllers/auth/logout.controller.js";
import { changePassword } from "../controllers/auth/change-password.controller.js";
import { userAuth } from "../middlewares/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/change-password", userAuth, changePassword);

export default authRouter;
