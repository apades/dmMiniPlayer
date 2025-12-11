import { isFunction } from 'lodash-es'

export async function wait(time = 0) {
  return new Promise<void>((res) => setTimeout(res, time))
}

type Fn1<T> = (args: T[]) => void
type Fn2<A, B> = (on: A, arg2: B) => void

const a = {
  evaluate: (fn: Fn1<string>) => {},
}
const b = {
  evaluate: (fn: Fn2<number, string>) => {},
}

type EvaluateType<T> = T extends {
  evaluate: (pageFunction: infer Fn, args?: any) => any
}
  ? Fn extends Fn1<any>
    ? {
        evaluate: (pageFunction: Fn1<any>, args?: any) => any
      }
    : Fn extends Fn2<any, any>
      ? {
          evaluate: (pageFunction: Fn2<any, any>, args?: any) => any
        }
      : never
  : never

//  type EvaluateType2<T> = T extends {
//   evaluate: infer Fn
//  } ? Fn extends Fn1<any> ?

//  : never
export async function evaluate<
  T extends {
    evaluate: (...args: any) => any
  },
  Arg extends any[],
  Arg0 = Parameters<Parameters<T['evaluate']>[0]>[0],
  // Fn = EvaluateType<T>,
>(tar: T, fn: (arg0: Arg0, args: Arg) => any, args?: readonly [...Arg]) {
  return tar.evaluate(
    (arg0: any, args: any) => {
      const isArray = (val: any): val is Array<any> => val instanceof Array
      const _args: any[] = isArray(args) ? args : arg0
      _args.forEach((v, i) => {
        if (typeof v === 'string' && v.startsWith('fn:')) {
          _args[i] = new Function(`return (${v.slice(3)})(...arguments)`)
        }
      })
      const fn = _args.shift()

      return fn(arg0, args)
    },
    [fn, ...(args ?? [])]?.map((v) => {
      if (!isFunction(v)) return v
      return `fn:${v.toString()}`
    }),
  )
}

// evaluate(a, (arg0) => {})
// evaluate(
//   b,
//   (arg0, args) => {
//     args[0]
//   },
//   [() => 1, 3],
// )
