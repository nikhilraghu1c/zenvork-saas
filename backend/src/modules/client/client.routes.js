import { Router } from "express";
import { createClient, getClientList } from "./client.controller.js";

const clientRouter = Router();

// Owners and staff can manage clients belonging to their authenticated business.
clientRouter.get("/", getClientList);
clientRouter.post("/", createClient);

export default clientRouter;
