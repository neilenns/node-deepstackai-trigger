/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as chokidar from 'chokidar';
import * as JSONC from 'jsonc-parser';
import * as log from './Log';
import * as MqttManager from './handlers/mqttManager/MqttManager';
import * as TelegramManager from './handlers/telegramManager/TelegramManager';
import * as WebRequestHandler from './handlers/webRequest/WebRequestHandler';
import analyzeImage from './DeepStack';
import IDeepStackPrediction from './types/IDeepStackPrediction';
import MqttConfig from './handlers/mqttManager/MqttConfig';
import TelegramConfig from './handlers/telegramManager/TelegramConfig';
import WebRequestConfig from './handlers/webRequest/WebRequestConfig';
import { Stats } from 'fs';

export default class Trigger {
  private _initalizedTime: Date;
  private _lastTriggerTime: Date;
  private _processExisting: boolean;
  private _watcher: chokidar.FSWatcher;

  public name: string;
  public watchPattern: string;
  public watchObjects?: string[];
  public triggerUris?: string[];
  public enabled = true;
  public cooldownTime: number;
  public threshold: {
    minimum: number;
    maximum: number;
  };

  // Handler configurations
  public webRequestHandlerConfig: WebRequestConfig;
  public mqttConfig: MqttConfig;
  public telegramConfig: TelegramConfig;

  constructor(init?: Partial<Trigger>) {
    Object.assign(this, init);
    this._initalizedTime = new Date(Date.now());

    // This gets initialized to the epoch date so the first process of an image always passes the
    // cooldown timeout test.
    this._lastTriggerTime = new Date("1/1/1970");

    // If there's an environment variable set for PROCESS_EXISTING_IMAGES then parse it
    // into an actual boolean value. Otherwise it's false.
    this._processExisting = process.env.PROCESS_EXISTING_IMAGES
      ? (JSONC.parse(process.env.PROCESS_EXISTING_IMAGES) as boolean)
      : false;
  }

  private async analyzeImage(fileName: string): Promise<IDeepStackPrediction[] | undefined> {
    log.info(`Trigger ${this.name}`, `${fileName}: Analyzing`);
    const analysis = await analyzeImage(fileName);

    if (!analysis?.success) {
      log.error(`Trigger ${this.name}`, `${fileName}: Analysis failed`);
      return undefined;
    }

    if (analysis.predictions.length == 0) {
      log.info(`Trigger ${this.name}`, `${fileName}: No objects detected`);
      return undefined;
    }

    log.info(`Trigger ${this.name}`, `${fileName}: Found at least one object in the photo`);
    return analysis.predictions;
  }

  /**
   * Handles a file system change event and processes the image.
   * @param fileName The filename to process
   * @param stats The stats for the file
   */
  public async processImage(fileName: string, stats: Stats): Promise<void> {
    // Don't process old files
    if (!this.passesDateTest(fileName, stats)) return;

    this._lastTriggerTime = new Date();

    // Get the predictions, if any
    const predictions = await this.analyzeImage(fileName);
    if (!predictions) return;

    // Check to see if any predictions cause this to activate
    const triggeredPredictions = this.getTriggeredPredictions(fileName, predictions);
    if (!triggeredPredictions) return;

    // Call all the handlers for the trigger
    await Promise.all([
      ...(await WebRequestHandler.processTrigger(fileName, this, triggeredPredictions)),
      ...(await MqttManager.processTrigger(fileName, this, triggeredPredictions)),
      ...(await TelegramManager.processTrigger(fileName, this, triggeredPredictions)),
    ]);
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
   * @returns True if the file is more recent than when this trigger was created
   * or existing files should be processed
   */
  private passesDateTest(fileName: string, stats: Stats): boolean {
    // This has to use atimeMs (last access time) to ensure it also works while testing.
    // Copying files in Windows preserves the lastModified and createdDate fields
    // from the original. Using lastAccessTime ensures all these checks perform
    // correctly even during development.
    const receivedDate = new Date(stats.atimeMs);

    if (receivedDate < this._initalizedTime && !this._processExisting) {
      log.info(`Trigger ${this.name}`, `${fileName}: Skipping as it was created before the service started.`);
      return false;
    }

    // Don't do the cooldown test if one wasn't specified in the file.
    if (!this.cooldownTime) return true;

    // getTime() returns milliseconds so divide by 1000 to get seconds
    const secondsSinceLastTrigger = (receivedDate.getTime() - this._lastTriggerTime.getTime()) / 1000;

    // Only check cooldown on images that have timestamps after startup.
    // This eases testing since this code only gets to this point for images
    // that arrived prior to startup when _processExisting is true.
    if (secondsSinceLastTrigger < this.cooldownTime && receivedDate > this._initalizedTime) {
      log.info(
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
   * @param label The label of the identified object
   * @param confidence The confidence level of the identification
   * @returns True if the label is associated with the trigger and the confidence is within the threshold range
   */
  private isTriggered(fileName: string, { label, confidence }: IDeepStackPrediction): boolean {
    const scaledConfidence = confidence * 100;
    const isTriggered =
      this.isRegisteredForObject(fileName, label) && this.confidenceMeetsThreshold(fileName, scaledConfidence);

    if (!isTriggered) {
      log.info(`Trigger ${this.name}`, `${fileName}: Not triggered by ${label} (${scaledConfidence})`);
    } else {
      log.info(`Trigger ${this.name}`, `${fileName}: Triggered by ${label} (${scaledConfidence})`);
    }
    return isTriggered;
  }

  /**
   * Checks to see if the trigger is supposed to activate on the identified object.
   * @param label The object label
   * @returns True if the trigger is activated by the label
   */
  private isRegisteredForObject(fileName: string, label: string): boolean {
    const isRegistered = this.watchObjects.includes(label);
    if (!isRegistered) {
      log.info(
        `Trigger ${this.name}`,
        `${fileName}: Detected object ${label} is not in the watch objects list [${this.watchObjects.join(", ")}]`,
      );
    } else {
      log.info(`Trigger ${this.name}`, `${fileName}: Matched triggering object ${label}`);
    }

    return isRegistered;
  }

  /**
   * Checks to see if the confidence level of the identified object is within the threshold
   * range for the trigger
   * @param confidence The confidence level
   * @returns True if the confidence level is with the range that activates the trigger.
   */
  private confidenceMeetsThreshold(fileName: string, confidence: number): boolean {
    const meetsThreshold = confidence >= this.threshold.minimum && confidence <= this.threshold.maximum;

    if (!meetsThreshold) {
      log.info(
        `Trigger ${this.name}`,
        `${fileName}: Confidence ${confidence} wasn't between threshold ${this.threshold.minimum} and ${this.threshold.maximum}`,
      );
    } else {
      log.info(
        `Trigger ${this.name}`,
        `${fileName}: Confidence ${confidence} meets threshold ${this.threshold.minimum} and ${this.threshold.maximum}`,
      );
    }
    return meetsThreshold;
  }

  /**
   * Starts watching for file changes.
   * @returns True if watching was started, false if it was skipped because the trigger isn't enabled
   */
  public startWatching(): boolean {
    if (!this.enabled) {
      return false;
    }

    try {
      this._watcher = chokidar.watch(this.watchPattern).on("add", this.processImage.bind(this));
      log.info(`Trigger ${this.name}`, `Listening for new images in ${this.watchPattern}`);
    } catch (e) {
      log.error(`Trigger ${this.name}`, `Unable to start watching for images: ${e}`);
      throw e;
    }

    return true;
  }

  /**
   * Stops watching for file changes.
   * @returns True if watching was started, false if it was skipped because the trigger isn't enabled
   */
  public async stopWatching(): Promise<void> {
    try {
      await this._watcher.close();
      log.info(`Trigger ${this.name}`, `Stopped listening for new images in ${this.watchPattern}`);
    } catch (e) {
      log.error(`Trigger ${this.name}`, `Unable to stop watching for images: ${e}`);
      throw e;
    }
  }
}
