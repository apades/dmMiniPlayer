import { makeObservable, observable } from 'mobx'

export function makeKeysObservable<T extends object>(
  tar: T,
  keys: (keyof T)[],
) {
  return makeObservable(
    tar,
    Object.fromEntries(keys.map((key) => [key, observable])) as any,
  )
}
