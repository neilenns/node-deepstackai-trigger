/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as log from "./Log";
import * as Settings from "./Settings";

import mkdirp from "mkdirp";
import path from "path";
import { promises as fsPromise } from "fs";

export enum Locations {
  Annotations = "annotations",
  Snapshots = "snapshots",
  Originals = "originals",
}

/**
 * Number of milliseconds in a minute
 */
const _millisecondsInAMinute = 1000 * 60;

/**
 * The background timer that runs the local file purge.
 */
let _backgroundTimer: NodeJS.Timeout;

/**
 * Local location where all web images are stored.
 */
export const localStoragePath = "/node-deepstackai-trigger";

/**
 * Creates the data storage directory for the web images
 */
export async function initializeStorage(): Promise<void> {
  log.verbose("Local storage", `Creating local storage folders in ${localStoragePath}.`);

  await mkdirp(path.join(localStoragePath, Locations.Annotations));
  await mkdirp(path.join(localStoragePath, Locations.Snapshots));
  await mkdirp(path.join(localStoragePath, Locations.Originals));
}

/**
 * Takes a local storage location and the full path to an original file and returns the full path for that
 * same base filename name on local storage.
 * @param location The location in local storage to map the file to
 * @param fileName The full path to the original file
 */
export function mapToLocalStorage(location: Locations, fileName: string): string {
  return path.join(localStoragePath, location, path.basename(fileName));
}

/**
 * Copies a file to local storage.
 * @param location The location in local storage to copy the file to
 * @param fileName The file to copy
 */
export async function copyToLocalStorage(location: Locations, fileName: string): Promise<string> {
  const localFileName = path.join(localStoragePath, location, path.basename(fileName));
  await fsPromise.copyFile(fileName, localFileName).catch(e => {
    log.warn("Local storage", `Unable to copy to local storage: ${e.message}`);
  });

  return localFileName;
}

/**
 * Starts a background task that purges old files from local storage.
 */
export function startBackgroundPurge(): void {
  if (Settings.purgeInterval > 0) {
    log.verbose(
      "Local storage",
      `Enabling background purge every ${Settings.purgeInterval} minutes for files older than ${Settings.purgeAge} minutes.`,
    );
    purgeOldFiles();
  }
  else {
    log.verbose(
      "Local storage",
      `Background purge is disabled via settings.`,
    );  
  }
}

/**
 * Stops the background purge process from running.
 */
export function stopBackgroundPurge(): void {
  clearTimeout(_backgroundTimer);
  log.verbose("Local storage", `Background purge stopped.`);
}

/**
 * Purges files older than the purgeThreshold from local storage.
 */
async function purgeOldFiles(): Promise<void> {
  log.verbose("Local storage", "Running purge");

  // Do annotations first.
  let purgeDir = path.join(localStoragePath, Locations.Annotations);
  await Promise.all(
    (await fsPromise.readdir(purgeDir)).map(async fileName => await purgeFile(path.join(purgeDir, fileName))),
  );

  // Now do snapshots.
  purgeDir = path.join(localStoragePath, Locations.Snapshots);
  await Promise.all(
    (await fsPromise.readdir(purgeDir)).map(async fileName => await purgeFile(path.join(purgeDir, fileName))),
  );

  // Now do originals.
  purgeDir = path.join(localStoragePath, Locations.Originals);
  await Promise.all(
    (await fsPromise.readdir(purgeDir)).map(async fileName => await purgeFile(path.join(purgeDir, fileName))),
  );

  log.verbose("Local storage", "Purge complete");

  if (Settings.purgeInterval > 0 ) {
    _backgroundTimer = setTimeout(purgeOldFiles, Settings.purgeInterval * _millisecondsInAMinute);
  }
}

/**
 * Purges an individual file that meets the purge criteria.
 * @param fullLocalPath The full path and filename to purge
 */
async function purgeFile(fullLocalPath: string): Promise<void> {
  const lastAccessTime = (await fsPromise.stat(fullLocalPath)).atime;

  const minutesSinceLastAccess = (new Date().getTime() - lastAccessTime.getTime()) / _millisecondsInAMinute;

  if (minutesSinceLastAccess > Settings.purgeAge) {
    await fsPromise.unlink(fullLocalPath);
    log.verbose("Local storage", `Purging ${fullLocalPath}. Age: ${minutesSinceLastAccess.toFixed(0)} minutes.`);
  }
}
