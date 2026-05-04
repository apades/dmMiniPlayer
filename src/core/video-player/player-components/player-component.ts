import { ReactElement, ReactNode } from 'react'
import { JsonValue, Jsonify } from 'type-fest'

declare const ProtocolWithReturnSymbol: unique symbol
interface ProtocolWithReturn<Name extends string, Data, Return> {
  Name: Name
  data: Jsonify<Data>
  return: Jsonify<Return>
  /**
   * Type differentiator only.
   */
  [ProtocolWithReturnSymbol]: true
}

export function protocolWithReturn<Name extends string, Data, Return>(
  name: Name,
  data: Data,
  re: Return,
) {
  return {
    name,
    data,
    return: re,
    [ProtocolWithReturnSymbol]: true,
  }
}

export type PlayerComponentActions<T extends PlayerComponent<any>> =
  T['__actions']

export type PlayerComponentInitialData<T extends PlayerComponent<any>> =
  T['setup'] extends (initialData: infer InitialData) => void
    ? InitialData
    : never

export abstract class PlayerComponent<T> {
  abstract readonly name: string
  readonly __actions: {
    [Key in keyof T]?: string | ProtocolWithReturn<string, any, any>
  } = {} as const

  setup(initialData: INTERFACE_PLAYER_COMPONENT_INITIAL_DATA) {}

  onMounted() {}

  onBeforeMediaUpdate() {}
  onMediaUpdated() {}

  onUnmounted() {}

  render(): null | undefined | ReactNode {
    return null
  }
}

declare global {
  interface DM_ACTIONS {}
  interface INTERFACE_PLAYER_COMPONENT_INITIAL_DATA {}
}
