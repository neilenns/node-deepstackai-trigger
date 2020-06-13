/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import mkdirp from "mkdirp";
import * as log from "./Log";
import { promises as fsPromise } from "fs";
import path from "path";

/**
 * Local location where all web images are stored.
 */
export const localStoragePath = "/node-deepstackai-trigger/www";

/**
 * Creates the data storage directory for the web images
 */
export async function initializeStorage(): Promise<string | undefined> {
  log.info("Local storage", `Creating local storage folder ${localStoragePath}.`);
  return mkdirp(localStoragePath);
}

/**
 * Takes the full path to an original file and returns the  full path for that
 * same base filename name on local storage.
 * @param fileName The full path to the original file
 */
export function mapToLocalStorage(fileName: string): string {
  return path.join(localStoragePath, path.basename(fileName));
}

/**
 * Copies a file to local storage
 * @param fileName The file to copy
 */
export async function copyToLocalStorage(fileName: string): Promise<string> {
  const localFileName = path.join(localStoragePath, path.basename(fileName));
  await fsPromise.copyFile(fileName, localFileName).catch(e => {
    log.warn("Local storage", `Unable to copy to local storage: ${e.message}`);
  });

  return localFileName;
}
