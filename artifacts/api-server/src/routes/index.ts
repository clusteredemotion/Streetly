import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import statsRouter from "./stats";
import categoriesRouter from "./categories";
import locationsRouter from "./locations";
import businessesRouter from "./businesses";
import reviewsRouter from "./reviews";
import agentsRouter from "./agents";
import adminRouter from "./admin";
import streetExplorerRouter from "./streetexplorer";
import claimsRouter from "./claims";
import geoRouter from "./geo";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/stats", statsRouter);
router.use("/geo", geoRouter);
router.use("/categories", categoriesRouter);
router.use(locationsRouter);
router.use("/businesses", businessesRouter);
router.use("/businesses/:businessId/reviews", reviewsRouter);
router.use("/businesses/:businessId/claim", claimsRouter);
router.use("/agents", agentsRouter);
router.use("/admin", adminRouter);
router.use("/streets", streetExplorerRouter);

export default router;
