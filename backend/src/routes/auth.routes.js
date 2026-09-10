import express from "express";
import { registerBusiness } from "../modules/business/business.controller.js";
import { getActiveBusinessTypes } from "../modules/business/business-type.controller.js";
import { login } from "../controllers/auth/login.controller.js";
import { logout } from "../controllers/auth/logout.controller.js";

const authRouter = express.Router();

authRouter.get("/business-types", getActiveBusinessTypes);
authRouter.post("/register-business", registerBusiness);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

export default authRouter;
