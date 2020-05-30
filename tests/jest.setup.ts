/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// This is required because the project uses request-promise-native
// and some dependency somewhere uses request-promise.
// See https://github.com/request/request-promise/issues/247.
jest.mock("request-promise");

// Ensure there's no warning from the telegram bot module.
process.env.NTBA_FIX_319 = "true";
