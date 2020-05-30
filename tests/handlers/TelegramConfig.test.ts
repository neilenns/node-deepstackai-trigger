/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TelegramConfig from "../../src/handlers/telegramManager/TelegramConfig";

test("Verify Telegram handler configuration", () => {
  // Empty constructor should default to enabled true
  let config = new TelegramConfig();
  expect(config.enabled).toBe(true);

  // Undefined enabled should be true
  config = new TelegramConfig({ enabled: undefined });
  expect(config.enabled).toBe(true);

  // Explicitly set enabled true should be true
  config = new TelegramConfig({ enabled: true });
  expect(config.enabled).toBe(true);

  // Explicitly set enabled false should be false
  config = new TelegramConfig({ enabled: false });
  expect(config.enabled).toBe(false);
});
