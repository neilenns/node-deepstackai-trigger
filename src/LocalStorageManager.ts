/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as log from "./Log";
import * as Settings from "./Settings";

import mkdirp from "mkdirp";
import { promises as fsPromise } from "fs";
import path from "path";

/**
 * Number of milliseconds in a minute
 */
const millisecondsInAMinute = 1000 * 60;

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
 * @param interval Frequency of purge, in minutes
 * @param age Age of a file, in minutes, to get purged
 */
export function startBackgroundPurge(): void {
  log.info(
    "Local storage",
    `Enabling background purge every ${Settings.purgeInterval} minutes for files older than ${Settings.purgeAge} minutes.`,
  );
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

  // Loop through all the files and purge any that are older than they should be.
  // Can there possibly be more await statements in a single line?
  await Promise.all((await fsPromise.readdir(localStoragePath)).map(async fileName => await purgeFile(fileName)));

  log.info("Local storage", "Purge complete");
  backgroundTimer = setTimeout(purgeOldFiles, Settings.purgeInterval * millisecondsInAMinute);
}

/**
 * Purges an individual file that meets the purge criteria
 * @param fileName The filename to purge
 */
async function purgeFile(fileName: string): Promise<void> {
  const fullLocalPath = mapToLocalStorage(fileName);
  const lastAccessTime = (await fsPromise.stat(fullLocalPath)).atime;

  const minutesSinceLastAccess = (new Date().getTime() - lastAccessTime.getTime()) / millisecondsInAMinute;

  if (minutesSinceLastAccess > Settings.purgeAge) {
    await fsPromise.unlink(fullLocalPath);
    log.info("Local storage", `Purging ${fileName}. Age: ${minutesSinceLastAccess.toFixed(0)} minutes.`);
  }
}
