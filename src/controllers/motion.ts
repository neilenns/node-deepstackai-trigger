/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import express from "express";
import * as log from "../Log";

export function handleMotionEvent(req: express.Request, res: express.Response): void {
  log.info("Web server", `Received motion event for ${req.params.triggerName}`);
  res.json({ trigger: req.params.triggerName });
}
