/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as logger from "winston";

logger.remove(logger.transports.Console); // remove the default options

const myFormat = logger.format.printf(info => {
  return `${info.timestamp} [${info.label}] ${info.message}`;
});

logger.configure({
  level: process.env.LOG_LEVEL ?? "info",
  transports: [new logger.transports.Console()],
  format: logger.format.combine(logger.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), myFormat),
});

export default logger;
