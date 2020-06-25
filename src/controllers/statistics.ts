/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import express from "express";
import * as log from "../Log";
import * as TriggerManager from "../TriggerManager";

export function getTriggerStatistics(req: express.Request, res: express.Response): void {
  log.verbose("Web server", `Received statistics request for ${req.params.triggerName}.`);

  res.json(TriggerManager.getTriggerStatistics(req.params.triggerName));
}

export function resetTriggerStatistics(req: express.Request, res: express.Response): void {
  log.verbose("Web server", `Received statistics reset request for ${req.params.triggerName}.`);

  res.json(TriggerManager.resetTriggerStatistics(req.params.triggerName));
}

export function getOverallStatistics(req: express.Request, res: express.Response): void {
  log.verbose("Web server", `Received overall statistics request.`);

  res.json(TriggerManager.getOverallStatistics());
}

export function resetOverallStatistics(req: express.Request, res: express.Response): void {
  log.verbose("Web server", `Received overall statistics reset request.`);

  res.json(TriggerManager.resetOverallStatistics());
}
