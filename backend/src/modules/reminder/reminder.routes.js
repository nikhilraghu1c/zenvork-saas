import { Router } from "express";
import { getReminders, updateReminderAction } from "./reminder.controller.js";

const reminderRouter = Router();

// Every reminder belongs to the authenticated business; the parent router applies userAuth.
reminderRouter.get("/", getReminders);
reminderRouter.patch("/:id", updateReminderAction);

export default reminderRouter;
