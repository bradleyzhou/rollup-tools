export type DeepPartial<T> = T extends any[]
  ? T
  : T extends object
    ? {
        [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

export type Gettable<T> = ((...args: any[]) => T) | T;

/**
 * Remove the first element from an array or tuple type.
 */
export type Shift<T extends any[]> = T extends [any, ...infer Rest] ? Rest : [];

/**
 * Remove the last element from an array or tuple type.
 */
export type Poped<T extends any[]> = T extends [...infer Rest, any] ? Rest : [];
