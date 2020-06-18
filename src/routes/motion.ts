/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import express from "express";
import * as motionController from "../controllers/motion";

const router = express.Router();

// Set up the routes
router.get("/:triggerName", motionController.handleMotionEvent);

// Export it for use elsewhere
export default router;
