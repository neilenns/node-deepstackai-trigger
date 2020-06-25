/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import express from "express";
import * as statisticsController from "../controllers/statistics";

const router = express.Router();

// Set up the routes
router.get("/trigger/:triggerName", statisticsController.getTriggerStatistics);
router.get("/trigger/:triggerName/reset", statisticsController.resetTriggerStatistics);
router.get("/", statisticsController.getOverallStatistics);
router.get("/reset", statisticsController.resetOverallStatistics);

// Export it for use elsewhere
export default router;
