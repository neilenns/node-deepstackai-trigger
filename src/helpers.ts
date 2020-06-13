/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Converts a string to a number
 * @param text The string to convert to a number
 * @returns The number, or undefined if conversion wasn't possible
 */
export function convertStringToNumber(text: string): number | undefined {
  if (!text) {
    return undefined;
  }

  const convertedNumber = Number(text);
  return isNaN(convertedNumber) ? undefined : convertedNumber;
}
