/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as LocalStorageManager from "./LocalStorageManager";
import * as log from "./Log";
import * as Settings from "./Settings";

import { createHttpTerminator, HttpTerminator } from "http-terminator";
import express from "express";
import motionRouter from "./routes/motion";
import path from "path";
import { Server } from "http";
import statisticsRouter from "./routes/statistics";
import serveIndex from "serve-index";

const app = express();
let server: Server;
let httpTerminator: HttpTerminator;

export function startApp(): void {
  const annotatedImagePath = path.join(LocalStorageManager.localStoragePath, LocalStorageManager.Locations.Annotations);
  const originalsImagePath = path.join(LocalStorageManager.localStoragePath, LocalStorageManager.Locations.Originals);

  app.use("/", express.static(annotatedImagePath));
  app.use(
    "/annotations",
    express.static(annotatedImagePath),
    serveIndex(annotatedImagePath, { icons: true, view: "details" }),
  );
  app.use(
    "/originals",
    express.static(originalsImagePath),
    serveIndex(originalsImagePath, { icons: true, view: "details" }),
  );
  app.use("/motion", motionRouter);
  app.use("/statistics", statisticsRouter);

  try {
    server = app.listen(Settings.port, () => log.info("Web server", `Listening at http://localhost:${Settings.port}`));
    httpTerminator = createHttpTerminator({
      server,
    });
  } catch (e) {
    log.warn("Web server", `Unable to start web server: ${e.error}`);
  }
}

export async function stopApp(): Promise<void> {
  if (server) {
    log.verbose("Web server", "Stopping.");
    await httpTerminator.terminate();
  }
}
