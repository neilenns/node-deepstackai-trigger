/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import Rect from "../src/Rect";

test("Verify mask overlaps", () => {
  const predictedRect = new Rect(31, 125, 784, 1209);

  let testRect: Rect;

  // Completely outside the top left
  testRect = new Rect(0, 0, 10, 10);
  expect(predictedRect.overlaps(testRect)).toBe(false);

  // Completely outside the top right
  testRect = new Rect(785, 126, 10, 10);
  expect(predictedRect.overlaps(testRect)).toBe(false);

  // Overlaps a bit right on an edge
  testRect = new Rect(31, 125, 40, 160);
  expect(predictedRect.overlaps(testRect)).toBe(true);

  // Completely inside
  testRect = new Rect(40, 160, 50, 1200);
  expect(predictedRect.overlaps(testRect)).toBe(true);

  // Extends beyond bottom right
  testRect = new Rect(200, 200, 800, 1300);
  expect(predictedRect.overlaps(testRect)).toBe(true);

  // Extends beyond top left
  testRect = new Rect(0, 0, 40, 160);
  expect(predictedRect.overlaps(testRect)).toBe(true);

  // Exact duplicate
  testRect = predictedRect;
  expect(predictedRect.overlaps(testRect)).toBe(true);
});
