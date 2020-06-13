/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import mkdirp from "mkdirp";
import * as log from "./Log";
import { promises as fsPromise } from "fs";
import path from "path";

/**
 * How long an image has to sit in local storage before it gets removed, in seconds.
 */
let purgeThreshold = 60;

/**
 * How often the purge runs, in seconds.
 */
let purgeInterval = 30;

/**
 * The background timer that runs the local file purge.
 */
let backgroundTimer: NodeJS.Timeout;

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

/**
 * Starts a background task that purges old files from local storage
 * @param threshold Age of a file, in seconds, to get purged
 * @param interval Frequency of purge, in seconds
 */
export function startBackgroundPurge(interval: number, threshold: number): void {
  log.info("Local storage", `Enabling background purge every ${interval} seconds.`);
  purgeThreshold = threshold;
  purgeInterval = interval;
  purgeOldFiles();
}

/**
 * Stops the background purge process from running.
 */
export function stopBackgroundPurge(): void {
  clearTimeout(backgroundTimer);
  log.info("Local storage", `Background purge stopped.`);
}

/**
 * Purges files older than the purgeThreshold from local storage
 */
async function purgeOldFiles(): Promise<void> {
  log.info("Local storage", "Running purge");

  (await fsPromise.readdir(localStoragePath)).map(async fileName => {
    const fullLocalPath = mapToLocalStorage(fileName);
    const lastAccessTime = (await fsPromise.stat(fullLocalPath)).atime;

    const secondsSinceLastAccess = (new Date().getTime() - lastAccessTime.getTime()) / 1000;

    if (secondsSinceLastAccess > purgeThreshold) {
      await fsPromise.unlink(fullLocalPath);
      log.info("Local storage", `Purging ${fileName}. Age: ${secondsSinceLastAccess}`);
    }

    // Get last access time
  });

  log.info("Local storage", "Purge complete");
  backgroundTimer = setTimeout(purgeOldFiles, purgeInterval * 1000);
}
