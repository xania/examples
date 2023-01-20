export function Q<T>() {
  return identity<T>();
}

enum ExpressionType {
  Constant = 21793871,
  Pick,
  Equal,
  Identiy,
  Append,
  Call,
}

type PropOfType<T, Value> = {
  [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P];
};

abstract class Expression<S, T> {
  // pick: PickFunction<T>;
  // pipe<U>(line: (x: Expression<S, T>) => Expression<S, U>): Expression<S, U>;
  // eq<U>(target: T, trueValue: U, falseValue: U): EqualExpression<S, T, U>;

  pick: PickFunction<S, T> = _pick;
  pipe: PipeFunction<S, T> = _pipe;
  eq: EqualFunction<S, T> = _equal;
  call: CallFunction<S, T> = _call;
  equal: EqualFunction<S, T> = _equal;

  set<SU, ST, K extends keyof PropOfType<ST, T>>(
    expr: PickExpression<SU, ST, K>
  ) {
    return new SetExpression(this, expr);
  }
}

function _pick<S, T, K extends keyof T>(
  this: Expression<S, T>,
  key: K
): PickExpression<S, T, K> {
  return new PickExpression<S, T, K>(key);
}
type PickFunction<S, T> = <K extends keyof T>(
  key: K
) => PickExpression<S, T, K>;

function _pipe<S, T, U>(
  this: Expression<S, T>,
  line: (x: Expression<S, T>) => Expression<S, U>
): Expression<S, U> {
  return line(this);
}

type PipeFunction<S, T> = <U>(
  line: (x: Expression<S, T>) => Expression<S, U>
) => Expression<S, U>;

function _equal<S, T, U>(
  this: Expression<S, T>,
  target: T,
  trueValue: U,
  falseValue: U | undefined
): EqualExpression<S, T, U> {
  return new EqualExpression(this, target, trueValue, falseValue);
}

type EqualFunction<S, T> = <U>(
  this: Expression<S, T>,
  target: T,
  trueValue: U,
  falseValue?: U | undefined
) => EqualExpression<S, T, U>;

type CallFunction<S, T> = (source: S) => T;

class SetExpression<S, T, S2, T2> extends Expression<S, T2> {
  constructor(
    public source: Expression<S, T>,
    public target: PickExpression<S2, T2, keyof T2>
  ) {
    super();
  }
}

class ConstExpression<T> extends Expression<any, T> {
  public readonly type = ExpressionType.Constant;

  constructor(public value: T) {
    super();
  }
}

class EqualExpression<S, T, U> extends Expression<S, U> {
  public readonly type = ExpressionType.Equal;

  constructor(
    public source: Expression<S, T>,
    public target: T,
    public trueValue: U,
    public falseValue?: U | undefined
  ) {
    super();
  }
}

class PickExpression<S, T, K extends keyof T> extends Expression<S, T[K]> {
  public readonly type = ExpressionType.Pick;
  constructor(public key: K) {
    super();
  }
}

export function constant<T>(value: T): ConstExpression<T> {
  return new ConstExpression(value);
}

class IdentityExpression<T> extends Expression<T, T> {
  public readonly type = ExpressionType.Identiy;
}

export function identity<T>(): IdentityExpression<T> {
  return new IdentityExpression<T>();
}

class CallExpresion<S = any, U = any> extends Expression<S, U> {
  public readonly type = ExpressionType.Call;

  constructor(public call: (x: S) => U) {
    super();
  }
}

class AppendExpresion<S = any, T = any> extends Expression<S, T> {
  public readonly type = ExpressionType.Append;
}

type StackItem =
  | EqualExpression<any, any, any>
  | PickExpression<any, any, any>
  | CallExpresion
  | AppendExpresion;

function _call(this: StackItem, source: any): any {
  const stack: any[] = [this];
  const heap: any[] = [source];

  while (stack.length) {
    const curr = stack.pop() as StackItem;
    switch (curr.type) {
      case ExpressionType.Equal:
        // stack.push(curr.source)
        stack.push(
          new CallExpresion((x) => {
            return x === curr.target ? curr.trueValue : curr.falseValue;
          })
        );
        stack.push(curr.source);
        break;
      case ExpressionType.Pick:
        const obj = heap.pop()!;
        heap.push(obj[curr.key]);
        break;
      case ExpressionType.Append:
        const x = heap.pop();
        const arr = heap.pop();
        arr.push(x);
        heap.push(arr);
        break;
      case ExpressionType.Call:
        heap.push(curr.call(heap.pop()));
        break;
      default:
        throwNever(curr);
    }
  }

  return heap.pop();
}

function throwNever(curr: never) {
  throw Error('not supported expression type ' + curr);
}

type ObjectKeys<
  T extends Record<string, unknown>,
  Key = keyof T
> = Key extends string
  ? T[Key] extends Record<string, unknown>
    ? Key | `${Key}.${ObjectKeys<T[Key]>}`
    : `${Key}`
  : never;
