export class Validator {
    static isString(value: any):boolean {
        if (value !== undefined && typeof value !== 'string') {
            return false
        }
        return true
    }

    static isNum(value: any):boolean {
        if (value !== undefined && typeof value !== 'number') {
            return false
        }
        return true
    }

    static isBoolean(value: any):boolean {
        if (value !== undefined && typeof value !== 'boolean') {
            return false
        }
        return true
    }

    static isObject(value: any):boolean {
        if (value !== undefined && (typeof value !== 'object' || value == null || Array.isArray(value))) {
            return false
        }
        return true
    }

    static isInRange(value: any, min: number, max: number, fieldName: string): { valid: boolean; message?: string } {
        if (!Validator.isNum(value)) {
            return {
                valid: false,
                message: `${fieldName} must be a number`
            };
        }
        if (value && (value < min || value > max)) {
            return {
                valid: false,
                message: `${fieldName} must be between ${min} and ${max}`
            };
        }
        return { valid: true };
    }

    static isInValues(value: any, allowedValues: string[], fieldName: string): { valid: boolean; message?: string } {
        if (!Validator.isString(value)) {
            return {
                valid: false,
                message: `${fieldName} must be a string`
            };
        }
        if (!allowedValues.includes(value)) {
            return {
                valid: false,
                message: `${fieldName} must be a one of: ${allowedValues.join(', ')}`
            };
        }
        return { valid: true };
    }
}