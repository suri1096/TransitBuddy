import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import authRouter from "./auth";
import connectionsRouter from "./connections";
import locationRouter from "./location";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(authRouter);
router.use(connectionsRouter);
router.use(locationRouter);

export default router;
