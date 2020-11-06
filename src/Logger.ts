/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as logger from "winston";

logger.configure({
  transports: [new logger.transports.Console()],
  format: logger.format.combine(logger.format.colorize(), logger.format.json(), logger.format.prettyPrint()),
});

export default logger;
