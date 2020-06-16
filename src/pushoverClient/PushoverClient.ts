/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import PushoverMessage from "./PushoverMessage";
import request from "request-promise-native";
import * as log from "../Log";
import fs from "fs";

export default class PushoverClient {
  public apiKey: string;
  public userKey: string;

  constructor(init?: Partial<PushoverClient>) {
    Object.assign(this, init);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async send(message: PushoverMessage): Promise<void> {
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
