import { isFunction, isNumber } from './check';
import type { Gettable, Shift } from './types';

export type PathKey = string | number;
export type ObjectPath = PathKey[];

export function parse(str: string): ObjectPath {
  const path = [] as ObjectPath;

  let key = '',
    bracket = false;
  for (const c of str) {
    if (c === ' ') continue;
    if (c === '[') {
      bracket = true;
      if (key) {
        path.push(key);
        key = '';
      }
    } else if (c === ']') {
      if (!bracket) {
        throw new Error('Invalid path str: see ] but no previous [');
      }
      bracket = false;
      if (key) {
        path.push(key === '*' ? Number.POSITIVE_INFINITY : Number.parseInt(key));
        key = '';
      }
    } else if (c === '.') {
      if (bracket) {
        throw new Error('Invalid path str: see . inside []');
      }
      if (key) {
        path.push(key);
        key = '';
      }
    } else {
      key += c;
    }
  }
  if (bracket) {
    throw new Error('Invalid path str: see [ but no ]');
  }
  if (key) {
    path.push(key);
    key = '';
  }
  return path;
}

type StringifyOption = {
  rootSymbol: string;
  noStartingDot: boolean;
};

export function stringify(path: ObjectPath, option: Partial<StringifyOption> = {}): string {
  let result = option.rootSymbol || '';

  for (const part of path) {
    if (isNumber(part)) {
      if (part === Number.POSITIVE_INFINITY) {
        result += '[*]';
      } else {
        result += `[${part}]`;
      }
    } else {
      // string
      result += `.${part}`;
    }
  }
  if (option.noStartingDot && result.startsWith('.')) {
    result = result.substring(1);
  }

  return result;
}

export type PathValue = string | ObjectPath;
type PathValueGettable = Gettable<PathValue>;

function getFromPathValue(path: PathValueGettable): ObjectPath {
  const p = isFunction(path) ? path() : path;
  return Array.isArray(p) ? p : parse(p);
}

type GetOptions = {
  fallback: any;
  start: number;
  end: number;
};

export function get(obj: any, path: PathValueGettable, option: Partial<GetOptions> = {}) {
  const p = getFromPathValue(path);
  const { fallback = undefined, start = 0, end = p.length } = option;
  let curr = obj;
  for (let i = start; i < end; i++) {
    const key = p[i];
    if (curr == null) {
      return fallback;
    }
    curr = curr[key];
  }

  if (curr == null && fallback != null) {
    return fallback;
  }

  return curr;
}

export function bound(obj: any) {
  return {
    get: (...args: Shift<Parameters<typeof get>>) => get(obj, ...args),
  };
}
