import { merge, append, replace, update } from '../src/assign';

describe('assign operations', () => {
  describe('merge()', () => {
    test('merges two objects', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const result = merge(target, source);

      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
      expect(target).toEqual(result); // Should mutate target
    });

    test('merges two arrays by index', () => {
      const target = [1, { a: 2 }];
      const source = [{ b: 3 }, 4];
      const result = merge(target, source);

      expect(result).toEqual([{ b: 3 }, 4]);
    });

    test('merges maps', () => {
      type NestedMap = Map<string, number>;

      const target = new Map<string, number | NestedMap>([
        ['a', 1],
        ['b', new Map<string, number>([['c', 2]])],
      ]);

      const source = new Map<string, number | NestedMap>([
        ['b', new Map<string, number>([['d', 3]])],
        ['e', 4],
      ]);

      const result = merge(target, source);

      const expected = new Map<string, number | NestedMap>([
        ['a', 1],
        [
          'b',
          new Map<string, number>([
            ['c', 2],
            ['d', 3],
          ]),
        ],
        ['e', 4],
      ]);

      expect(result).toEqual(expected);
    });
  });

  describe('append()', () => {
    test('appends arrays', () => {
      const target = [1, 2];
      const source = [3, 4];
      const result = append(target, source);

      expect(result).toEqual([1, 2, 3, 4]);
    });

    test('merges objects while appending arrays', () => {
      const target = { a: [1], b: { c: 2 } };
      const source = { a: [3], b: { d: 3 } };
      const result = append(target, source);

      expect(result).toEqual({ a: [1, 3], b: { c: 2, d: 3 } });
    });
  });

  describe('replace()', () => {
    test('replaces object properties', () => {
      const target = { a: 1, b: { c: 2 }, d: 3 };
      const source = { b: { e: 4 }, f: 5 };
      const result = replace(target, source);

      expect(result).toEqual({ b: { e: 4 }, f: 5 });
    });

    test('truncates arrays', () => {
      const target = [1, 2, 3];
      const source = [4];
      const result = replace(target, source);

      expect(result).toEqual([4]);
    });
  });

  describe('update()', () => {
    test('updates nested properties', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { c: 3 } };
      const result = update(target, source);

      expect(result).toEqual({ a: 1, b: { c: 3 } });
    });

    test('handles partial updates', () => {
      const target = { a: 1, b: { c: 2, d: 3 } };
      const source = { b: { d: 4 } };
      const result = update(target, source);

      expect(result).toEqual({ a: 1, b: { c: 2, d: 4 } });
    });
  });
});
