/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// Force to a module
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as ts from "typescript";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      LOG_LEVEL: "info" | "debug";
    }
  }
}
