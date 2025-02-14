import { isFunction, isMap, isSet, isPlainObject, isPrimitive, isArray, isNumber } from '../src/check';

describe('check utilities', () => {
  describe('isFunction', () => {
    test('should return true for functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function () {})).toBe(true);
      expect(isFunction(class {})).toBe(true);
    });

    test('should return false for non-functions', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction(null)).toBe(false);
      expect(isFunction(undefined)).toBe(false);
      expect(isFunction(123)).toBe(false);
    });
  });

  describe('isMap', () => {
    test('should return true for Map instances', () => {
      expect(isMap(new Map())).toBe(true);
    });

    test('should return false for non-Map values', () => {
      expect(isMap({})).toBe(false);
      expect(isMap(new Set())).toBe(false);
      expect(isMap([])).toBe(false);
    });
  });

  describe('isSet', () => {
    test('should return true for Set instances', () => {
      expect(isSet(new Set())).toBe(true);
    });

    test('should return false for non-Set values', () => {
      expect(isSet({})).toBe(false);
      expect(isSet(new Map())).toBe(false);
      expect(isSet([])).toBe(false);
    });
  });

  describe('isPlainObject', () => {
    test('should return true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
      expect(isPlainObject(new Object())).toBe(true);
    });

    test('should return false for non-plain objects', () => {
      expect(isPlainObject(new Map())).toBe(false);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(class {})).toBe(false);
    });
  });

  describe('isPrimitive', () => {
    test('should return true for primitive values', () => {
      expect(isPrimitive('string')).toBe(true);
      expect(isPrimitive(123)).toBe(true);
      expect(isPrimitive(true)).toBe(true);
      expect(isPrimitive(null)).toBe(true);
      expect(isPrimitive(undefined)).toBe(true);
      expect(isPrimitive(Symbol())).toBe(true);
    });

    test('should return false for non-primitive values', () => {
      expect(isPrimitive({})).toBe(false);
      expect(isPrimitive([])).toBe(false);
      expect(isPrimitive(() => {})).toBe(false);
    });
  });

  describe('isArray', () => {
    test('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    test('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('array')).toBe(false);
      expect(isArray(123)).toBe(false);
    });
  });

  describe('isNumber', () => {
    test('should return true for valid numbers', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(1.23)).toBe(true);
      expect(isNumber(-1)).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
    });

    test('should return false for NaN and non-numbers', () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });
  });
});
