/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import mkdirp from "mkdirp";
import * as log from "./Log";

/**
 * Local location where all web images are stored.
 */
const localStoragePath = "/node-deepstackai-trigger/www";

/**
 * Creates the data storage directory for the web images
 */
export function initializeStorage(): void {
  log.info("Web storage", `Creating local storage folder ${localStoragePath}.`);
  mkdirp.sync(localStoragePath);
}
