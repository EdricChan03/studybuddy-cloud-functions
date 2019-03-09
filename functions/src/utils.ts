/**
 * Useful utility methods used in most of the Cloud Function definitions
 */
export class Utils {
  /**
   * Checks if the property specified in an array is equals to the 2nd parameter
   * @param value The value to check with
   * @param against The value to check against
   * @return True if the property is equals to the value, false otherwise
   */
  static isEquals(value: any, against: any): boolean {
    return value === against;
  }
  /**
   * Checks if the property specified (`value`) in an array is equals to the 2nd parameter (`against`)
   * @param value The value to check with
   * @param against The value to check against
   * @return True if the property is equals to the value, false otherwise
   * @deprecated Use the static version of {@link Utils.isEquals}
   */
  isEquals(value: any, against: any): boolean {
    return value === against;
  }

  /**
   * Checks if the value specified is of a specific type
   * @param value The value to check
   * @param type The type to check
   * @return True if the property is of type `type`, false otherwise
   */
  static isType(value: any, type: 'boolean' | 'function' | 'number' | 'object' | 'string' | 'symbol' | 'undefined'): boolean {
    return typeof value === type;
  }
  /**
   * Checks if the value specified is of a specific type
   * @param value The value to check
   * @param type The type to check
   * @return True if the property is of type `type`, false otherwise
   * @deprecated Use the static version of {@link Utils.isType}
   */
  isType(value: any, type: 'boolean' | 'function' | 'number' | 'object' | 'string' | 'symbol' | 'undefined'): boolean {
    return typeof value === type;
  }

  /**
   * Checks if the value specified is a string
   * @param value The value to check
   * @return True if the property is a string, false otherwise
   * @deprecated Use `isType` instead
   */
  static isString(value: string): boolean {
    return this.isType(value, 'string');
  }
  /**
   * Checks if the value specified is a string
   * @param value The value to check
   * @return True if the property is a string, false otherwise
   * @deprecated Use `isType` instead
   */
  isString(value: string): boolean {
    return this.isType(value, 'string');
  }

  /**
   * Checks if the value specified is not empty
   * @param value The value to check
   * @return True if the property is empty, false otherwise
   */
  static isEmpty(value: string): boolean {
    return value === '';
  }
  /**
   * Checks if the value specified is not empty
   * @param value The value to check
   * @return True if the property is empty, false otherwise
   * @deprecated Use the static version of {@link Utils.isEmpty}
   */
  isEmpty(value: string): boolean {
    return value === '';
  }

  /**
   * Checks if the value specified is a valid hexadecimal color value
   * @param val The value to check
   * @return True if the property is a valid hexadecimal color, false otherwise
   */
  static isHexColor(value: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(value);
  }
  /**
   * Checks if the value specified is a valid hexadecimal color value
   * @param val The value to check
   * @return True if the property is a valid hexadecimal color, false otherwise
   * @deprecated Use the static version of {@link Utils.isHexColor}
   */
  isHexColor(value: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(value);
  }

  /**
   * Converts an RGB code to a hexadecimal code
   * @see https://stackoverflow.com/a/39077686/6782707
   * @param r The red value of the RGB code
   * @param g The green value of the RGB code
   * @param b The blue value of the RGB code
   * @return The converted hexadecimal code
   */
  static rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('');
  }
}
