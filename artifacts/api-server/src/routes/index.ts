import { Router, type IRouter } from "express";
import healthRouter from "./health";
import buildRouter from "./build";
import runRouter from "./run";
import projectBuildRouter from "./project-build";
import projectsRouter from "./projects";
import versionsRouter from "./versions";
import shareRouter from "./share";

const router: IRouter = Router();

router.use(healthRouter);
router.use(runRouter);
router.use(projectBuildRouter);
router.use(projectsRouter);
router.use(versionsRouter);
router.use(shareRouter);
router.use(buildRouter);

export default router;
