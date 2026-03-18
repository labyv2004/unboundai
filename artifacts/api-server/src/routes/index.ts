import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import sessionsRouter from "./sessions.js";
import messagesRouter from "./messages.js";
import memoriesRouter from "./memories.js";
import downloadRouter from "./download.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/sessions", sessionsRouter);
router.use("/sessions/:sessionId/messages", messagesRouter);
router.use("/memories", memoriesRouter);
router.use("/download", downloadRouter);

export default router;
