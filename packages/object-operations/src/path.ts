import { isFunction, isNumber, isString } from './check';
import type { Gettable, Shift } from './types';

export type PathKey = string | number;
export type ObjectPath = PathKey[];

export const WILDCARD = '*';
export const WILDCARD_NUMBER = Number.POSITIVE_INFINITY;

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
        path.push(key === WILDCARD ? WILDCARD_NUMBER : Number.parseInt(key));
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
      if (part === WILDCARD_NUMBER) {
        result += '[' + WILDCARD + ']';
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
  try {
    for (let i = start; i < end; i++) {
      const key = p[i];
      if (curr == null) {
        return fallback;
      }
      curr = curr[key];
    }
    return curr ?? fallback;
  } catch {
    return fallback;
  }
}

export function match(targetPath: ObjectPath, rules: ObjectPath[]): boolean {
  // Track active rules that still match up to current depth
  const matched = new Set(rules);

  for (let i = 0; i < targetPath.length; i++) {
    const targetKey = targetPath[i];

    for (const rule of matched) {
      const ruleKey = rule[i];
      const isLastRuleKey = i === rule.length - 1;

      // wildcard match, and can early return
      // note that wildcards must be the last key of the rule
      if (isNumber(targetKey) && ruleKey === WILDCARD_NUMBER && isLastRuleKey) return true;
      if (isString(targetKey) && ruleKey === WILDCARD && isLastRuleKey) return true;

      if (!isLastRuleKey && (ruleKey === WILDCARD || ruleKey === WILDCARD_NUMBER)) {
        // invalid wildcard rule, not ending with wildcard, no need to keep looking at this rule
        matched.delete(rule);
      }

      if (ruleKey == null || targetKey !== ruleKey) {
        // not matching for this rule at position i, no need to keep looking at this rule
        matched.delete(rule);
      }

      // match, need to continue looking to next path key
    }

    // early return if no rules left
    if (matched.size === 0) return false;
  }

  // process longer rules
  for (const rule of matched) {
    // exact match
    if (rule.length === targetPath.length) return true;

    // special tail wildcard match
    if (
      rule.length === targetPath.length + 1 &&
      (rule[rule.length - 1] === WILDCARD || rule[rule.length - 1] === WILDCARD_NUMBER)
    ) {
      return true;
    }
  }

  return false;
}

export function bound(obj: any) {
  return {
    get: (...args: Shift<Parameters<typeof get>>) => get(obj, ...args),
  };
}
