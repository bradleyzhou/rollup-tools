/// below are copied from immerjs source code
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export type AnyMap = Map<any, any>;
export function isMap(value: unknown): value is AnyMap {
  return value instanceof Map;
}

export type AnySet = Set<any>;
export function isSet(value: unknown): value is AnySet {
  return value instanceof Set;
}

const objCtroStr = Object.prototype.constructor.toString();

export function isPlainObject(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  const Ctor = Object.hasOwnProperty.call(proto, 'constructor') && proto.constructor;

  if (Ctor === Object) return true;

  return typeof Ctor == 'function' && Function.toString.call(Ctor) === objCtroStr;
}

/// above are copied from immerjs source code

export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

export function isPrimitive(value: unknown): value is Primitive {
  if (value === null || value === undefined) return true;
  return typeof value !== 'object' && typeof value !== 'function';
}

/**
 * A set with primtive values.
 */
export type PrimitiveSet = Set<Primitive>;

export function isArray(value: unknown): value is any[] {
  return Array.isArray(value);
}

/**
 * Check if `value` is a number and not NaN
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}
