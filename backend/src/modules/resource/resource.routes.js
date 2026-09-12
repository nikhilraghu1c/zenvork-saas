import { Router } from "express";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { createResource, getResources, getResourceOptions } from "./resource.controller.js";

const resourceRouter = Router();

// Any authenticated user can view only their business's resources.
resourceRouter.get("/", getResources);
resourceRouter.get("/options", getResourceOptions);
// Only owners can add resources to their business.
resourceRouter.post("/", authorize("OWNER"), createResource);

export default resourceRouter;
