/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * A Pushover REST API message
 */
export default class PushoverMessage {
  /**
   * Text of the message.
   */
  public message: string;
  /**
   * The user key/token for the message recipient.
   */
  public userKey?: string;
  /**
   * The device name for the message recipient.
   */
  public device?: string;
  /**
   * The image file to attach to the message.
   */
  public imageFileName: string;
  /**
   * The Pushover notification sound to play. Default is "pushover".
   */
  public sound?: string;

  constructor(init?: Partial<PushoverMessage>) {
    Object.assign(this, init);
  }
}
