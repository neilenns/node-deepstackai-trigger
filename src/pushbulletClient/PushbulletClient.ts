/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as log from "../Log";
import * as path from "path";
import IUploadRequestResponse from "./IUploadRequestResponse";
import PushbulletMessage from "./PushbulletMessage";
import request from "request-promise-native";

/**
 * A basic client for sending messages to the Pushbullet REST API
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
   * Asynchronously sends a message to the Pushbullet REST API.
   * @param message The PushbulletMessage to send
   */
  public async push(message: PushbulletMessage): Promise<void> {
    if (!this.accessToken) {
      throw Error("accessToken must be set before calling send().");
    }

    // Sending an image with Pushbullet is absolute nonsense.
    // Call the method that encapsulates the nonsense before sending the actual message.
    const imageDetails = await this.uploadFile(message);

    const body = {
      type: "file",
      title: message.title,
      body: message.body,
      file_name: imageDetails.file_name,
      file_type: imageDetails.file_type,
      file_url: imageDetails.file_url,
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
        log.error("Pushbullet", `Failed to call Pushbullet: ${e.error}`);
        return;
      });
  }

  /**
   * Sending an image with Pushbullet is just crazy silly roundabout. First
   * you have to say you're going to upload the file and get back the URL
   * to upload to, THEN you can actually upload the file. Oh, and then
   * you have to remember all the data you got back to send a message that
   * uses that file. Nonsense!!!
   * @param message The message with the file details to upload
   * @returns The response from Pushbullet that has the required details to send
   * a message with the image.
   */
  private async uploadFile(message: PushbulletMessage): Promise<IUploadRequestResponse> {
    // First step is to request the upload location
    const response = (await request
      .post({
        body: {
          file_name: path.basename(message.imageFileName),
          file_type: "image/jpeg",
        },
        uri: "https://api.pushbullet.com/v2/upload-request",
        headers: {
          "Access-Token": this.accessToken,
        },
        json: true,
      })
      .catch(e => {
        log.error("Pushbullet", `Failed to upload image: ${JSON.stringify(e.error)}`);
        return;
      })) as IUploadRequestResponse;

    // Once that's done the actual file can be sent as a mutli-part message.
    await request
      .post({
        formData: {
          file: fs.createReadStream(message.imageFileName),
        },
        uri: response.upload_url,
      })
      .catch(e => {
        log.error("Pushover", `Failed to call Pushover: ${e.error}`);
        return;
      });

    return response;
  }
}
