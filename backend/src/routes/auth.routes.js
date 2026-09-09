import express from "express";
import { registerBusiness } from "../modules/business/business.controller.js";
import { login } from "../controllers/auth/login.controller.js";
import { logout } from "../controllers/auth/logout.controller.js";

const authRouter = express.Router();

authRouter.post("/register-business", registerBusiness);
authRouter.post("/login", login);
authRouter.post("/logout", logout);


export default authRouter;
