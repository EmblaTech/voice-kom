
/**
 * Helper for optional field validation.
 * @param value The value to validate
 * @param validator A function that returns true if valid
 * @param message The error message to push if invalid
 * @param errors The errors array to push to
 */
export function validateIfPresent(value: any, validator: (v: any) => boolean, message: string, errors: string[]): void {
    if (value !== undefined && !validator(value)) errors.push(message);
}
