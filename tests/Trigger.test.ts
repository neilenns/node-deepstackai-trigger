/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import trigger from "../src/Trigger";

test("Verify watchObjects", () => {
  const testTrigger = new trigger();
  testTrigger.watchObjects = ["cat", "elephant", "bike"];

  expect(testTrigger.isRegisteredForObject("test", "dog")).toBe(false);
  expect(testTrigger.isRegisteredForObject("test", "cat")).toBe(true);

  testTrigger.watchObjects = undefined;
  expect(testTrigger.isRegisteredForObject("test", "cat")).toBe(false);

  testTrigger.watchObjects = [];
  expect(testTrigger.isRegisteredForObject("test", "cat")).toBe(false);
});
