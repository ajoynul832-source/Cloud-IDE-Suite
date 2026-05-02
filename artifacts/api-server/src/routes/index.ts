import { Router, type IRouter } from "express";
import healthRouter from "./health";
import buildRouter from "./build";
import runRouter from "./run";
import projectBuildRouter from "./project-build";

const router: IRouter = Router();

router.use(healthRouter);
router.use(runRouter);
router.use(projectBuildRouter);
router.use(buildRouter);

export default router;
