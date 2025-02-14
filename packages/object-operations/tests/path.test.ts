import { parse, stringify, get, bound, match } from '../src/path';

describe('path utilities', () => {
  describe('parse', () => {
    test('should parse dot notation', () => {
      expect(parse('a.b.c')).toEqual(['a', 'b', 'c']);
      expect(parse('foo.bar.baz')).toEqual(['foo', 'bar', 'baz']);
    });

    test('should parse bracket notation', () => {
      expect(parse('a[0].b[1]')).toEqual(['a', 0, 'b', 1]);
      expect(parse('foo[1][2]')).toEqual(['foo', 1, 2]);
    });

    test('should parse mixed notation', () => {
      expect(parse('a.b[0].c')).toEqual(['a', 'b', 0, 'c']);
      expect(parse('foo[1].bar.baz[2]')).toEqual(['foo', 1, 'bar', 'baz', 2]);
    });

    test('should handle wildcard', () => {
      expect(parse('a[*]')).toEqual(['a', Number.POSITIVE_INFINITY]);
    });

    test('should throw on invalid paths', () => {
      expect(() => parse('a[.b]')).toThrow();
      expect(() => parse('a[b')).toThrow();
      expect(() => parse('a]')).toThrow();
    });
  });

  describe('stringify', () => {
    test('should stringify path array', () => {
      expect(stringify(['a', 'b', 'c'])).toBe('.a.b.c');
      expect(stringify(['foo', 1, 'bar'])).toBe('.foo[1].bar');
    });

    test('should handle wildcard', () => {
      expect(stringify(['a', Number.POSITIVE_INFINITY])).toBe('.a[*]');
    });

    test('should respect options', () => {
      expect(stringify(['a', 'b'], { noStartingDot: true })).toBe('a.b');
      expect(stringify(['a', 'b'], { rootSymbol: '$' })).toBe('$.a.b');
    });
  });

  describe('get', () => {
    const obj = {
      a: {
        b: {
          c: 42,
          d: [1, 2, 3],
        },
      },
    };

    test('should get nested values', () => {
      expect(get(obj, 'a.b.c')).toBe(42);
      expect(get(obj, ['a', 'b', 'd', 1])).toBe(2);
    });

    test('should return fallback for missing paths', () => {
      expect(get(obj, 'a.b.x', { fallback: 'default' })).toBe('default');
      expect(get(obj, 'a.b.d[5]', { fallback: null })).toBe(null);
    });

    test('should handle partial paths', () => {
      expect(get(obj, 'x.a.b.d.x', { start: 1, end: 4 })).toEqual([1, 2, 3]);
    });
  });

  describe('match', () => {
    test('should match exact paths', () => {
      expect(match(['a', 'b', 'c'], [['a', 'b', 'c']])).toBe(true);
      expect(match([1, 2, 3], [[1, 2, 3]])).toBe(true);
    });

    test('should handle string wildcards', () => {
      expect(match(['a', 'b', 'c'], [['a', '*']])).toBe(true);
      expect(match(['a', 'b', 'c'], [['*', 'b', 'c']])).toBe(false);
      expect(match(['a', 'b'], [['a', 'b', '*']])).toBe(true);
    });

    test('should handle numeric wildcards', () => {
      expect(match([1, 2, 3], [[1, Number.POSITIVE_INFINITY]])).toBe(true);
      expect(match([1, 2], [[1, 2, Number.POSITIVE_INFINITY]])).toBe(true);
      expect(match([1, 2, 3], [[Number.POSITIVE_INFINITY]])).toBe(true);
    });

    test('should handle mixed type paths', () => {
      expect(match(['a', 1, 'b'], [['a', 1, '*']])).toBe(true);
      expect(match(['a', 1, 'b'], [['a', Number.POSITIVE_INFINITY, 'b']])).toBe(false);
    });

    test('should handle multiple rules', () => {
      const rules = [
        ['a', 'b'],
        ['c', '*'],
        [1, Number.POSITIVE_INFINITY],
      ];
      expect(match(['a', 'b'], rules)).toBe(true);
      expect(match(['c', 'd'], rules)).toBe(true);
      expect(match([1, 2, 3], rules)).toBe(true);
      expect(match(['x', 'y'], rules)).toBe(false);
    });

    test('should reject invalid wildcard positions', () => {
      expect(match(['a', 'b', 'c'], [['a', '*', 'c']])).toBe(false);
      expect(match([1, 2, 3], [[1, Number.POSITIVE_INFINITY, 3]])).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(match([], [[]])).toBe(true);
      expect(match(['*'], [['*']])).toBe(true);
      expect(match([Number.POSITIVE_INFINITY], [[Number.POSITIVE_INFINITY]])).toBe(true);
    });
  });

  describe('bound', () => {
    const obj = {
      a: {
        b: {
          c: 42,
        },
      },
    };

    test('should create bound getter', () => {
      const boundObj = bound(obj);
      expect(boundObj.get('a.b.c')).toBe(42);
      expect(boundObj.get(['a', 'b', 'c'])).toBe(42);
    });
  });
});
