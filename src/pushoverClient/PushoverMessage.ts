/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export default class PushoverMessage {
  public message: string;
  public userKey?: string;
  public device?: string;
  public imageFileName: string;
  public sound?: string;

  constructor(init?: Partial<PushoverMessage>) {
    Object.assign(this, init);
  }
}
