/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as AnnotationManager from "./handlers/annotationManager/AnnotationManager";
import * as chokidar from "chokidar";
import * as LocalStorage from "./LocalStorageManager";
import * as log from "./Log";
import * as MqttManager from "./handlers/mqttManager/MqttManager";
import * as PushoverManager from "./handlers/pushoverManager/PushoverManager";
import * as Settings from "./Settings";
import * as TelegramManager from "./handlers/telegramManager/TelegramManager";
import * as TriggerManager from "./TriggerManager";
import * as WebRequestHandler from "./handlers/webRequest/WebRequestHandler";

import analyzeImage from "./DeepStack";
import IDeepStackPrediction from "./types/IDeepStackPrediction";
import MqttHandlerConfig from "./handlers/mqttManager/MqttHandlerConfig";
import TelegramConfig from "./handlers/telegramManager/TelegramConfig";
import PushoverConfig from "./handlers/pushoverManager/PushoverConfig";
import { promises as fsPromise } from "fs";
import Rect from "./Rect";
import request from "request-promise-native";
import WebRequestConfig from "./handlers/webRequest/WebRequestConfig";

export default class Trigger {
  private _initializedTime: Date;
  private _lastTriggerTime: Date;
  private _watcher: chokidar.FSWatcher;

  public analysisDuration: number;
  public receivedDate: Date;
  public name: string;
  public watchPattern: string;
  public watchObjects?: string[];
  public triggerUris?: string[];
  public snapshotUri?: string;
  public enabled = true;
  public cooldownTime: number;
  public threshold: {
    minimum: number;
    maximum: number;
  };

  public masks: Rect[];

  // Handler configurations
  public webRequestHandlerConfig: WebRequestConfig;
  public mqttHandlerConfig: MqttHandlerConfig;
  public telegramConfig: TelegramConfig;
  public pushoverConfig: PushoverConfig;

  constructor(init?: Partial<Trigger>) {
    Object.assign(this, init);
    this._initializedTime = new Date(Date.now());

    // This gets initialized to the epoch date so the first process of an image always passes the
    // cooldown timeout test.
    this._lastTriggerTime = new Date("1/1/1970");
  }

  private async analyzeImage(fileName: string): Promise<IDeepStackPrediction[] | undefined> {
    log.verbose(`Trigger ${this.name}`, `${fileName}: Analyzing`);
    const startTime = new Date();
    const analysis = await analyzeImage(fileName).catch(e => {
      log.warn(`Trigger ${this.name}`, e);
      return undefined;
    });

    this.analysisDuration = new Date().getTime() - startTime.getTime();

    if (!analysis?.success) {
      log.error(`Trigger ${this.name}`, `${fileName}: Analysis failed`);
      return undefined;
    }

    if (analysis.predictions.length == 0) {
      log.verbose(`Trigger ${this.name}`, `${fileName}: No objects detected. (${this.analysisDuration} ms)`);
      return undefined;
    }

    log.verbose(
      `Trigger ${this.name}`,
      `${fileName}: Found at least one object in the photo. (${this.analysisDuration} ms)`,
    );
    return analysis.predictions;
  }

  /**
   * Handles a file system change event and processes the image.
   * @param fileName The filename to process
   */
  public async processImage(fileName: string): Promise<void> {
    TriggerManager.incrementAnalyzedFilesCount();

    // Don't process old files.
    if (!(await this.passesDateTest(fileName))) return;

    this._lastTriggerTime = new Date();

    // Get the predictions, if any.
    const predictions = await this.analyzeImage(fileName);
    if (!predictions) {
      return;
    }

    // Check to see if any predictions cause this to activate.
    const triggeredPredictions = this.getTriggeredPredictions(fileName, predictions);
    if (!triggeredPredictions) {
      MqttManager.publishStatisticsMessage(TriggerManager.triggeredCount, TriggerManager.analyzedFilesCount);
      return;
    }

    // At this point a prediction matched so increment the count.
    TriggerManager.incrementTriggeredCount();

    // Generate the annotations so it is ready for the other trigger handlers. This does
    // nothing if annotations are disabled.
    await AnnotationManager.processTrigger(fileName, this, triggeredPredictions);

    // Call all the handlers for the trigger. There is no need to wait for these to finish before proceeding.
    MqttManager.processTrigger(fileName, this, triggeredPredictions);
    PushoverManager.processTrigger(fileName, this, triggeredPredictions);
    TelegramManager.processTrigger(fileName, this, triggeredPredictions);
    WebRequestHandler.processTrigger(fileName, this, triggeredPredictions);

    // Send the updated statistics.
    MqttManager.publishStatisticsMessage(TriggerManager.triggeredCount, TriggerManager.analyzedFilesCount);
  }

  /**
   * Goes through a list of predictions and returns the ones that triggered
   * @param predictions The list of predictions to check
   * @returns The predictions that are within the confidence range for requested objects
   */
  private getTriggeredPredictions(
    fileName: string,
    predictions: IDeepStackPrediction[],
  ): IDeepStackPrediction[] | undefined {
    const triggeredPredictions = predictions.filter(prediction => this.isTriggered(fileName, prediction));

    return triggeredPredictions.length ? triggeredPredictions : undefined;
  }

  /**
   * Checks to see if a file should be processed based on the last modified time
   * and the setting to process existing files.
   * @param fileName The filename of the image being evaluated
   * @returns True if the file is more recent than when this trigger was created
   * or existing files should be processed
   */
  private async passesDateTest(fileName: string): Promise<boolean> {
    // This has to use atimeMs (last access time) to ensure it also works while testing.
    // Copying files in Windows preserves the lastModified and createdDate fields
    // from the original. Using lastAccessTime ensures all these checks perform
    // correctly even during development.
    const stats = await fsPromise.stat(fileName);
    this.receivedDate = new Date(stats.atimeMs);

    if (this.receivedDate < this._initializedTime && !Settings.processExistingImages) {
      log.verbose(`Trigger ${this.name}`, `${fileName}: Skipping as it was created before the service started.`);
      return false;
    }

    // Don't do the cooldown test if one wasn't specified in the file.
    if (!this.cooldownTime) return true;

    // getTime() returns milliseconds so divide by 1000 to get seconds
    const secondsSinceLastTrigger = (this.receivedDate.getTime() - this._lastTriggerTime.getTime()) / 1000;

    // Only check cooldown on images that have timestamps after startup.
    // This eases testing since this code only gets to this point for images
    // that arrived prior to startup when _processExisting is true.
    if (secondsSinceLastTrigger < this.cooldownTime && this.receivedDate > this._initializedTime) {
      log.verbose(
        `Trigger ${this.name}`,
        `${fileName}: Skipping as it was received before the cooldown period of ${this.cooldownTime} seconds expired.`,
      );
      return false;
    }

    return true;
  }
  /**
   * Checks to see if an identified object is registered for the trigger, and if the
   * confidence level is high enough to fire the trigger.
   * @param fileName The filename of the image being evaluated
   * @param label The label of the identified object
   * @param confidence The confidence level of the identification
   * @returns True if the label is associated with the trigger and the confidence is within the threshold range
   */
  private isTriggered(fileName: string, prediction: IDeepStackPrediction): boolean {
    const { confidence, label } = prediction;
    const scaledConfidence = confidence * 100;
    const isTriggered =
      this.isRegisteredForObject(fileName, label) &&
      this.confidenceMeetsThreshold(fileName, scaledConfidence) &&
      !this.isMasked(fileName, prediction);

    if (!isTriggered) {
      log.verbose(`Trigger ${this.name}`, `${fileName}: Not triggered by ${label} (${scaledConfidence})`);
    } else {
      log.verbose(`Trigger ${this.name}`, `${fileName}: Triggered by ${label} (${scaledConfidence})`);
    }
    return isTriggered;
  }

  /**
   * Checks to see if predictions overlap the list of masks defined in the trigger
   * @param fileName The filename of the image being evaluated
   * @param predictions The list of predictions found in the image
   * @returns True if any of the predictions are masked
   */
  public isMasked(fileName: string, prediction: IDeepStackPrediction): boolean {
    if (!this.masks) {
      return false;
    }

    // Loop through the masks to see if any overlap the prediction
    const result = this.masks.some(mask => {
      const predictionRect = new Rect(prediction.x_min, prediction.y_min, prediction.x_max, prediction.y_max);
      const doesOverlap = mask.overlaps(predictionRect);

      if (doesOverlap) {
        log.verbose(`Trigger ${this.name}`, `Prediction region ${predictionRect} blocked by trigger mask ${mask}.`);
      }

      return doesOverlap;
    });

    return result;
  }

  /**
   * Checks to see if the trigger is supposed to activate on the identified object.
   * @param label The object label
   * @returns True if the trigger is activated by the label
   */
  public isRegisteredForObject(fileName: string, label: string): boolean {
    const isRegistered = this.watchObjects?.some(watchLabel => {
      return watchLabel.toLowerCase() === label?.toLowerCase();
    });

    if (!isRegistered) {
      log.verbose(
        `Trigger ${this.name}`,
        `${fileName}: Detected object ${label} is not in the watch objects list [${this.watchObjects?.join(", ")}]`,
      );
    } else {
      log.verbose(`Trigger ${this.name}`, `${fileName}: Matched triggering object ${label}`);
    }

    return isRegistered ?? false;
  }

  /**
   * Checks to see if the confidence level of the identified object is within the threshold
   * range for the trigger
   * @param fileName The filename of the image being evaluated
   * @param confidence The confidence level
   * @returns True if the confidence level is with the range that activates the trigger.
   */
  private confidenceMeetsThreshold(fileName: string, confidence: number): boolean {
    const meetsThreshold = confidence >= this.threshold.minimum && confidence <= this.threshold.maximum;

    if (!meetsThreshold) {
      log.verbose(
        `Trigger ${this.name}`,
        `${fileName}: Confidence ${confidence} wasn't between threshold ${this.threshold.minimum} and ${this.threshold.maximum}`,
      );
    } else {
      log.verbose(
        `Trigger ${this.name}`,
        `${fileName}: Confidence ${confidence} meets threshold ${this.threshold.minimum} and ${this.threshold.maximum}`,
      );
    }
    return meetsThreshold;
  }

  /**
   * Starts watching for file changes.
   * @param awaitWrite True if Chokidar should wait for writes to complete before firing events. Slows things
   * down but necessary when this runs on a Docker container with images stored on a network drive.
   * @returns True if watching was started, false if it was skipped because the trigger isn't enabled
   */
  public startWatching(): boolean {
    if (!this.enabled) {
      return false;
    }

    if (!this.watchPattern) {
      return false;
    }

    try {
      this._watcher = chokidar
        .watch(this.watchPattern, { awaitWriteFinish: Settings.awaitWriteFinish })
        .on("add", this.processImage.bind(this));
      log.verbose(`Trigger ${this.name}`, `Listening for new images in ${this.watchPattern}`);
    } catch (e) {
      throw Error(`Trigger ${this.name} unable to start watching for images: ${e}`);
    }

    return true;
  }

  /**
   * Stops watching for file changes.
   */
  public async stopWatching(): Promise<void> {
    if (this._watcher) {
      await this._watcher.close().catch(e => {
        log.warn(`Trigger ${this.name}`, `unable to stop watching for images: ${e}`);
      });

      log.verbose(`Trigger ${this.name}`, `Stopped listening for new images in ${this.watchPattern}`);
    }
  }

  /**
   * Downloads an image from the address registered with the trigger.
   */
  public async downloadWebImage(): Promise<string> {
    if (!this.snapshotUri) {
      log.warn(`Trigger ${this.name}`, `Unable to download snapshot: snapshotUri not specified.`);
      return;
    }

    if (!this.enabled) {
      log.warn(`Trigger ${this.name}`, `Snapshot downloaded requested however this trigger isn't enabled.`);
      return;
    }

    log.verbose(`Trigger ${this.name}`, `Downloading snapshot from ${this.snapshotUri}.`);

    // The image gets saved to local storage using the name of the trigger and a unique-enough number.
    const localStoragePath = LocalStorage.mapToLocalStorage(
      LocalStorage.Locations.Snapshots,
      `${this.name}_${new Date().getTime()}.jpg`,
    );

    // Setting encoding: null makes the response magically become a Buffer, which
    // then passes straight to writeFile and generates a proper image file in local storage.
    // If encoding: null is omitted then the resulting local file is corrupted.
    const response = await request.get(this.snapshotUri, { encoding: null }).catch(e => {
      log.warn(`Trigger ${this.name}`, `Unable to download snapshot from ${this.snapshotUri}: ${e}`);
      return;
    });
    await fsPromise.writeFile(localStoragePath, response).catch(e => {
      log.warn(`Trigger ${this.name}`, `Unable to save snapshot: ${e}`);
      return;
    });

    log.verbose(`Trigger ${this.name}`, `Download from ${this.snapshotUri} complete.`);

    return localStoragePath;
  }
}
