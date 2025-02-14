import clone from 'just-clone';
import { AnyMap, PrimitiveSet, isArray, isMap, isPlainObject, isSet } from './check';
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

function diffSetValues(a: PrimitiveSet, b: PrimitiveSet) {
  const aMinusB = new Set() as PrimitiveSet;
  const bMinusA = new Set() as PrimitiveSet;

  const intersection = new Set() as PrimitiveSet;

  for (const va of a) {
    if (b.has(va)) {
      intersection.add(va);
    } else {
      aMinusB.add(va);
    }
  }

  for (const vb of b) {
    if (!intersection.has(vb)) {
      bMinusA.add(vb);
    }
  }

  return { aMinusB, bMinusA, intersection };
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
        for (let i = source.length, tl = target.length; i < tl; i++) {
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
    // Note: Only works well with primitive values (string/number/boolean) as Set elements
    // since object references will be shared between source and target Sets.
    const { aMinusB: inTargetNotSource, bMinusA: inSourceNotTarget } = diffSetValues(target, source);

    for (const v of inSourceNotTarget) {
      // these are the values in source but not in target
      // @type-note: clone() can handle primitive fine
      target.add(clone(v as any));
    }

    // for intersection that in both, no need to go deep,
    // because if is not primitive, they share the same object ref (although not recommended)

    if (mode === 'replace') {
      for (const v of inTargetNotSource) {
        target.delete(v);
      }
    }
  }
}

/**
 * Merge `source` to `target`, mutating `target`. `source` is untouched.
 *
 * Object keys that are both in `source` and `target` are overriden. Arrays are merged by index.
 *
 * @remarks
 * When merging Sets, it's recommended to use primitive values (string/number/boolean) as elements
 * since object references will be shared between source and target Sets.
 */
export function merge<Target, Source>(target: Target, source: Source): Target & Source {
  assign(target, source);
  return target as Target & Source;
}

/**
 * Merge `source` to `target` with append mode, mutating `target`. `source` is untouched.
 *
 * Object keys that are both in `source` and `target` are overriden. Arrays are appended to `target`.
 *
 * @remarks
 * When appending to Sets, it's recommended to use primitive values (string/number/boolean) as elements
 * since object references will be shared between source and target Sets.
 */
export function append<Target, Source>(target: Target, source: Source): Target & Source {
  assign(target, source, { mode: 'append' });
  return target as Target & Source;
}

/**
 * Merge `source` to `target` with replace mode, mutating `target`. `source` is untouched.
 *
 * Object keys that are not in `source` but in `target` are deleted. Arrays are shrinked if `source` is shorter.
 *
 * @remarks
 * When replacing Sets, it's recommended to use primitive values (string/number/boolean) as elements
 * since object references will be shared between source and target Sets.
 */
export function replace<Target, Source>(target: Target, source: Source): Source {
  assign(target, source, { mode: 'replace' });
  return target as unknown as Source;
}

/**
 * Update `target` with `source`, mutating `target`. `source` is untouched.
 *
 * An alias of `merge()`.
 *
 * @remarks
 * See {@link merge} for details about Set element handling recommendations.
 */
export function update<Data>(target: Data, source: DeepPartial<Data>): Data {
  assign(target, source);
  return target;
}
