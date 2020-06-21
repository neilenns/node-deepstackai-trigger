/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * A Pushbullet REST API message
 */
export default class PushbulletMessage {
  /**
   * Body of the message.
   */
  public body: string;
  /**
   * The image file to attach to the message.
   */
  public imageFileName: string;
  /**
   * Title of the message.
   */
  public title: string;

  constructor(init?: Partial<PushbulletMessage>) {
    Object.assign(this, init);
  }
}
