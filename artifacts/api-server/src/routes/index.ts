import { Router, type IRouter } from "express";
import healthRouter       from "./health";
import runRouter          from "./run";
import runStatusRouter    from "./run-status";
import buildRouter        from "./build";
import projectBuildRouter from "./project-build";
import projectsRouter     from "./projects";
import versionsRouter     from "./versions";
import usageRouter        from "./usage";
import authRouter         from "./auth";
import shareRouter        from "./share";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(runRouter);
router.use(runStatusRouter);
router.use(projectBuildRouter);
router.use(projectsRouter);
router.use(versionsRouter);
router.use(usageRouter);
router.use(shareRouter);
router.use(buildRouter);

export default router;
