/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export default interface IUploadRequestResponse {
  file_name: string;
  file_type: string;
  file_url: string;
  upload_url: string;
}
