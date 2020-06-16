/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import PushoverMessage from "./PushoverMessage";
import request from "request-promise-native";
import * as log from "../Log";
import fs from "fs";

/**
 * A basic client for sending messages to the Pushover REST API
 */
export default class PushoverClient {
  /**
   * The api key/token registered for the application
   */
  public apiKey: string;
  /**
   * The user key/token that registered the application
   */
  public userKey: string;

  constructor(init?: Partial<PushoverClient>) {
    Object.assign(this, init);
  }

  /**
   * Asynchronously sends a message to the Pushover REST API.
   * @param message The PushoverMessage to send
   */
  public async send(message: PushoverMessage): Promise<void> {
    if (!this.apiKey) {
      throw Error("apiKey must be set before calling send().");
    }

    if (!this.userKey) {
      throw Error("userKey must be set before calling send().");
    }

    const form = {
      token: this.apiKey,
      user: this.userKey,
      message: message.message,
      sound: message.sound,
      attachment: fs.createReadStream(message.imageFileName),
    };

    return await request
      .post({
        formData: form,
        uri: "https://api.pushover.net/1/messages.json",
      })
      .catch(e => {
        log.error("Pushover", `Failed to call Pushover: ${e.error}`);
        return;
      });
  }
}
