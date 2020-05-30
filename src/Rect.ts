/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/**
 * A simple class that represents a rectangle
 * via two points.
 */
export default class Rect {
  public xMinimum: number;
  public yMinimum: number;
  public xMaximum: number;
  public yMaximum: number;

  /**
   * Checks to see whether rectangles overlap
   * @param otherRect The rectangle to check against
   * @returns True if any portion of the rectangles overlap
   */
  public overlaps(otherRect: Rect): boolean {
    // left, top, right, bottom
    // const predictedRect = new Rect(31, 125, 784, 1209);
    // testRect = new Rect(31, 125, 40, 160);

    const aLeftOfB = this.xMaximum < otherRect.xMinimum;
    const aRightOfB = this.xMinimum > otherRect.xMaximum;
    const aAboveB = this.yMinimum > otherRect.yMaximum;
    const aBelowB = this.yMaximum < otherRect.yMinimum;

    return !(aLeftOfB || aRightOfB || aAboveB || aBelowB);
  }

  constructor(xMinimum: number, yMinimum: number, xMaximum: number, yMaximum: number) {
    this.xMinimum = xMinimum;
    this.xMaximum = xMaximum;
    this.yMinimum = yMinimum;
    this.yMaximum = yMaximum;
  }
}
