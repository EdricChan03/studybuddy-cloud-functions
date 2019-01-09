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
  isEquals(value: any, against: any): boolean {
    return value === against;
  }
  
  /**
   * Checks if the value specified is of a specific type
   * @param value The value to check
   * @param type The type to check
   * @return True if the property is of type `type`, false otherwise
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
  isString(value: string): boolean {
    return this.isType(value, 'string');
  }
  /**
   * Checks if the value specified is not empty
   * @param value The value to check
   * @return True if the property is empty, false otherwise
   */
  isEmpty(value: string): boolean {
    return value === '';
  }
  /**
   * Checks if the value specified is a valid hexadecimal color value
   * @param val The value to check
   * @return True if the property is a valid hexadecimal color, false otherwise
   */
  isHexColor(value: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(value);
  }
}
