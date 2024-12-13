export type RequiredLiteralKeys<T> = keyof {
  [K in keyof T as string extends K
    ? never
    : number extends K
      ? never
      : object extends Pick<T, K>
        ? never
        : K]: 0
}

export type OptionalLiteralKeys<T> = keyof {
  [K in keyof T as string extends K
    ? never
    : number extends K
      ? never
      : object extends Pick<T, K>
        ? K
        : never]: 0
}

export type IndexKeys<T> = string extends keyof T
  ? string
  : number extends keyof T
    ? number
    : never

export type KeyOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: any
}

export type OrPromise<T> = Promise<T> | T

export type Rec<T = any> = {
  [key: string]: T
}

export type ValueOf<T> = T[keyof T]

export type TransStringValToAny<
  T extends Record<string, any>,
  val = string | number,
> = {
  [K in keyof T]: T[K] extends string ? val : T[K]
}

export type AsyncFn<Args extends readonly unknown[] = any[], Return = any> = (
  ...args: Args
) => Promise<Awaited<Return>>
