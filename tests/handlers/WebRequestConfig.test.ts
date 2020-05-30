/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import WebRequestConfig from "../../src/handlers/webRequest/WebRequestConfig";

test("Verify web request handler configuration", () => {
  // Empty constructor should default to enabled true
  let config = new WebRequestConfig();
  expect(config.enabled).toBe(true);

  // Undefined enabled should be true
  config = new WebRequestConfig({ enabled: undefined });
  expect(config.enabled).toBe(true);

  // Explicitly set enabled true should be true
  config = new WebRequestConfig({ enabled: true });
  expect(config.enabled).toBe(true);

  // Explicitly set enabled false should be false
  config = new WebRequestConfig({ enabled: false });
  expect(config.enabled).toBe(false);
});
