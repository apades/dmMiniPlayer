export function onceCallGet(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): PropertyDescriptor {
  let val: any
  const oGet = descriptor.get!
  descriptor.get = function () {
    if (!val) val = oGet.bind(this)()
    return val
  }
  return descriptor
}

export function onceCall(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): PropertyDescriptor {
  let val: any
  const oGet = descriptor.value
  descriptor.value = function () {
    if (!val) val = oGet.bind(this)()
    return val
  }
  return descriptor
}

export function onceCallPro() {
  return (target: any, propertyKey: string) => {
    let val: any
  }
}

export function windowsOnceCall(key: string) {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    const oGet = descriptor.value
    descriptor.value = function () {
      if (!window[`__onceCall_${key}`])
        window[`__onceCall_${key}`] = oGet.bind(this)()
      return window[`__onceCall_${key}`]
    }
    return descriptor
  }
}

export function logFn(
  target: any,
  propertyName: string,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  descriptor: TypedPropertyDescriptor<Function>,
) {
  const method = descriptor.value!

  descriptor.value = function () {
    console.log(`run ${propertyName}`, this)
    // eslint-disable-next-line prefer-rest-params
    return method.apply(this, arguments)
  }
}

export function useGetSet(props: Partial<{ emptyMsg?: string }>) {
  return (target: object, propertyKey: string) => {
    let value = (target as any)[propertyKey]
    const getter = () => {
      if (!value) throw Error(props.emptyMsg || `${propertyKey} is not initd`)
      return value
    }
    const setter = (newVal: string) => {
      value = newVal
    }
    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
    })
  }
}
