import clone from 'just-clone';
import { AnyMap, AnySet, isArray, isMap, isPlainObject, isSet } from './check';
import { DeepPartial } from './types';

export { clone };

type AssignMode = 'replace' | 'append' | 'merge';
type AssignDescription = 'no-match' | 'both-array' | 'both-object' | 'both-map' | 'both-set';
type AssignOption = {
  mode: AssignMode;
  desc: AssignDescription;
};

function describeAssignment(a: any, b: any): AssignDescription {
  if (isMap(a) && isMap(b)) {
    return 'both-map';
  } else if (isSet(a) && isSet(b)) {
    return 'both-set';
  } else if (isArray(a) && isArray(b)) {
    return 'both-array';
  } else if (isPlainObject(a) && isPlainObject(b)) {
    return 'both-object';
  } else {
    return 'no-match';
  }
}

function diffObjKeys(a: any, b: any): string[] {
  const aMinusB = [] as string[];
  for (const k in a) {
    if (!(k in b)) {
      aMinusB.push(k);
    }
  }
  return aMinusB;
}

function diffMapKeys(a: AnyMap, b: AnyMap): string[] {
  const aMinusB = [] as string[];
  for (const [k, _] of a) {
    if (!b.has(k)) {
      aMinusB.push(k);
    }
  }
  return aMinusB;
}

function diffSetKeys(a: AnySet, b: AnySet): string[] {
  const aMinusB = [] as string[];
  for (const v of a) {
    if (!b.has(v)) {
      aMinusB.push(v);
    }
  }
  return aMinusB;
}

function assign(target: any, source: any, option?: Partial<AssignOption>) {
  // both-array, both-object, both-primitive, both-map, both-set, else
  let { mode = 'merge', desc } = option ?? {};
  if (!desc) {
    desc = describeAssignment(target, source);
  }

  if (desc === 'no-match') return;

  if (desc === 'both-array') {
    if (mode === 'append') {
      // array append, just clone and append source to target
      for (let j = 0; j < source.length; j++) {
        target.push(clone(source[j]));
      }
    } else {
      for (let i = 0; i < source.length; i++) {
        // handle shared items in both target and source
        const iDesc = describeAssignment(target[i], source[i]);
        if (iDesc === 'no-match') {
          target[i] = clone(source[i]);
        } else {
          assign(target[i], source[i], { mode, desc: iDesc });
        }
      }
      // handle extra items in target
      if (mode === 'replace') {
        for (let i = source.length; i < target.length; i++) {
          target.pop();
        }
      }
    }
  } else if (desc === 'both-object') {
    for (const k in source) {
      // merge from object source to target
      const kDesc = describeAssignment(target[k], source[k]);
      if (kDesc === 'no-match') {
        target[k] = clone(source[k]);
      } else {
        assign(target[k], source[k], { mode, desc: kDesc });
      }
    }
    if (mode === 'replace') {
      // remove extra keys in target in replace mode
      for (const k of diffObjKeys(target, source)) {
        delete target[k];
      }
    }
  } else if (desc === 'both-map') {
    for (const [k, v] of source as AnyMap) {
      const kDesc = describeAssignment(target.get(k), v);
      if (kDesc === 'no-match') {
        target.set(k, clone(v));
      } else {
        assign(target.get(k), v, { mode, desc: kDesc });
      }
    }
    if (mode === 'replace') {
      for (const k of diffMapKeys(target, source)) {
        target.delete(k);
      }
    }
  } else {
    // desc === 'both-set'
    for (const v of source as AnySet) {
      const vDesc = describeAssignment(target.has(v) ? v : undefined, v);
      if (vDesc === 'no-match') {
        target.add(v);
      } else {
        assign(target.has(v), v, { mode, desc: vDesc });
      }
    }
    if (mode === 'replace') {
      for (const v of diffSetKeys(target, source)) {
        target.delete(v);
      }
    }
  }
}

/**
 * Merge `source` to `target`, mutating `target`. `source` is untouched.
 *
 * Object keys that are both in `source` and `target` are overriden. Arrays are merged by index.
 */
export function merge<Target, Source>(target: Target, source: Source): Target & Source {
  assign(target, source);
  return target as Target & Source;
}

/**
 * Merge `source` to `target` with append mode, mutating `target`. `source` is untouched.
 *
 * Object keys that are both in `source` and `target` are overriden. Arrays are appended to `target`.
 */
export function append<Target, Source>(target: Target, source: Source): Target & Source {
  assign(target, source, { mode: 'append' });
  return target as Target & Source;
}

/**
 * Merge `source` to `target` with replace mode, mutating `target`. `source` is untouched.
 *
 * Object keys that are not in `source` but in `target` are deleted. Arrays are shrinked if `source` is shorter.
 */
export function replace<Target, Source>(target: Target, source: Source): Source {
  assign(target, source, { mode: 'replace' });
  return target as unknown as Source;
}

/**
 * Update `target` with `source`, mutating `target`. `source` is untouched.
 *
 * An alias of `merge()`.
 */
export function update<Data>(target: Data, source: DeepPartial<Data>): Data {
  assign(target, source);
  return target;
}
