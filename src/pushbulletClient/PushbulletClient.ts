/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import request from "request-promise-native";
import * as log from "../Log";
import PushbulletMessage from "./PushbulletMessage";

/**
 * A basic client for sending messages to the Pushover REST API
 */
export default class PushbulletClient {
  /**
   * The access token registered for the application
   */
  public accessToken: string;

  constructor(init?: Partial<PushbulletClient>) {
    Object.assign(this, init);
  }

  /**
   * Asynchronously sends a message to the Pushover REST API.
   * @param message The PushoverMessage to send
   */
  public async push(message: PushbulletMessage): Promise<void> {
    if (!this.accessToken) {
      throw Error("accessToken must be set before calling send().");
    }

    const body = {
      type: "note",
      title: message.title,
      body: message.body,
    };

    return await request
      .post({
        body: body,
        uri: "https://api.pushbullet.com/v2/pushes",
        headers: {
          "Access-Token": this.accessToken,
        },
        json: true,
      })
      .catch(e => {
        log.error("Pushover", `Failed to call Pushover: ${JSON.stringify(e.error)}`);
        return;
      });
  }
}
