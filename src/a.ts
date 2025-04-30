type Env = {
  Bindings?: object
  Variables?: object
}
type BlankSchema = {}
type BlankInput = {}
export type Schema = {
  [Path: string]: {
    [Method: `$${Lowercase<string>}`]: {}
  }
}

type Input = {
  in?: {}
  out?: {}
  outputFormat?: {}
}
type HandlerResponse<O> = Response

type ExtractStringKey<S> = keyof S & string

type H<
  E extends Env = any,
  P extends string = any,
  I extends Input = BlankInput,
  R extends HandlerResponse<any> = any,
> = any

type HonoBase<a, b, c> = any

export interface HandlerInterface<
  E extends Env = Env,
  M extends string = string,
  S extends Schema = BlankSchema,
  BasePath extends string = '/',
> {
  <
    P extends string = ExtractStringKey<S> extends never
      ? BasePath
      : ExtractStringKey<S>,
    I extends Input = BlankInput,
    R extends HandlerResponse<any> = any,
    E2 extends Env = E,
  >(
    handler: H<E2, P, I, R>,
  ): HonoBase<any, S, BasePath>
  <
    P extends string = ExtractStringKey<S> extends never
      ? BasePath
      : ExtractStringKey<S>,
    I extends Input = BlankInput,
    I2 extends Input = I,
    R extends HandlerResponse<any> = any,
    E2 extends Env = E,
    E3 extends Env = any,
  >(
    ...handlers: [H<E2, P, I>, H<E3, P, I2, R>]
  ): HonoBase<any, any, BasePath>
  <
    P extends string,
    MergedPath,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    E2 extends Env = E,
  >(
    path: P,
    handler: H<E2, any, I, R>,
  ): HonoBase<
    E,
    S & ToSchema<M, MergePath<BasePath, P>, I, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string = ExtractStringKey<S> extends never
      ? BasePath
      : ExtractStringKey<S>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
  >(
    ...handlers: [H<E2, P, I>, H<E3, P, I2>, H<E4, P, I3, R>]
  ): HonoBase<
    IntersectNonAnyTypes<[E, E2, E3, E4]>,
    S & ToSchema<M, P, I3, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string,
    MergedPath extends MergePath<BasePath, P> = MergePath<BasePath, P>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
  >(
    path: P,
    ...handlers: [H<E2, MergedPath, I>, H<E3, MergedPath, I2, R>]
  ): HonoBase<
    E,
    S & ToSchema<M, MergePath<BasePath, P>, I2, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string = ExtractStringKey<S> extends never
      ? BasePath
      : ExtractStringKey<S>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
  >(
    ...handlers: [H<E2, P, I>, H<E3, P, I2>, H<E4, P, I3>, H<E5, P, I4, R>]
  ): HonoBase<
    IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
    S & ToSchema<M, P, I4, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string,
    MergedPath extends MergePath<BasePath, P> = MergePath<BasePath, P>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
  >(
    path: P,
    ...handlers: [
      H<E2, MergedPath, I>,
      H<E3, MergedPath, I2>,
      H<E4, MergedPath, I3, R>,
    ]
  ): HonoBase<
    E,
    S & ToSchema<M, MergePath<BasePath, P>, I3, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string = ExtractStringKey<S> extends never
      ? BasePath
      : ExtractStringKey<S>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    I5 extends Input = I & I2 & I3 & I4,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
    E6 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
  >(
    ...handlers: [
      H<E2, P, I>,
      H<E3, P, I2>,
      H<E4, P, I3>,
      H<E5, P, I4>,
      H<E6, P, I5, R>,
    ]
  ): HonoBase<
    IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6]>,
    S & ToSchema<M, P, I5, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string,
    MergedPath extends MergePath<BasePath, P> = MergePath<BasePath, P>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
  >(
    path: P,
    ...handlers: [
      H<E2, MergedPath, I>,
      H<E3, MergedPath, I2>,
      H<E4, MergedPath, I3>,
      H<E5, MergedPath, I4, R>,
    ]
  ): HonoBase<
    E,
    S & ToSchema<M, MergePath<BasePath, P>, I4, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string = ExtractStringKey<S> extends never
      ? BasePath
      : ExtractStringKey<S>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    I5 extends Input = I & I2 & I3 & I4,
    I6 extends Input = I & I2 & I3 & I4 & I5,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
    E6 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
    E7 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6]>,
  >(
    ...handlers: [
      H<E2, P, I>,
      H<E3, P, I2>,
      H<E4, P, I3>,
      H<E5, P, I4>,
      H<E6, P, I5>,
      H<E7, P, I6, R>,
    ]
  ): HonoBase<
    IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7]>,
    S & ToSchema<M, P, I6, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string,
    MergedPath extends MergePath<BasePath, P> = MergePath<BasePath, P>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    I5 extends Input = I & I2 & I3 & I4,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
    E6 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
  >(
    path: P,
    ...handlers: [
      H<E2, MergedPath, I>,
      H<E3, MergedPath, I2>,
      H<E4, MergedPath, I3>,
      H<E5, MergedPath, I4>,
      H<E6, MergedPath, I5, R>,
    ]
  ): HonoBase<
    E,
    S & ToSchema<M, MergePath<BasePath, P>, I5, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string = ExtractStringKey<S> extends never
      ? BasePath
      : ExtractStringKey<S>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    I5 extends Input = I & I2 & I3 & I4,
    I6 extends Input = I & I2 & I3 & I4 & I5,
    I7 extends Input = I & I2 & I3 & I4 & I5 & I6,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
    E6 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
    E7 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6]>,
    E8 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7]>,
  >(
    ...handlers: [
      H<E2, P, I>,
      H<E3, P, I2>,
      H<E4, P, I3>,
      H<E5, P, I4>,
      H<E6, P, I5>,
      H<E7, P, I6>,
      H<E8, P, I7, R>,
    ]
  ): HonoBase<
    IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8]>,
    S & ToSchema<M, P, I7, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string,
    MergedPath extends MergePath<BasePath, P> = MergePath<BasePath, P>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    I5 extends Input = I & I2 & I3 & I4,
    I6 extends Input = I & I2 & I3 & I4 & I5,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
    E6 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
    E7 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6]>,
  >(
    path: P,
    ...handlers: [
      H<E2, MergedPath, I>,
      H<E3, MergedPath, I2>,
      H<E4, MergedPath, I3>,
      H<E5, MergedPath, I4>,
      H<E6, MergedPath, I5>,
      H<E7, MergedPath, I6, R>,
    ]
  ): HonoBase<
    E,
    S & ToSchema<M, MergePath<BasePath, P>, I6, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string = ExtractStringKey<S> extends never
      ? BasePath
      : ExtractStringKey<S>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    I5 extends Input = I & I2 & I3 & I4,
    I6 extends Input = I & I2 & I3 & I4 & I5,
    I7 extends Input = I & I2 & I3 & I4 & I5 & I6,
    I8 extends Input = I & I2 & I3 & I4 & I5 & I6 & I7,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
    E6 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
    E7 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6]>,
    E8 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7]>,
    E9 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8]>,
  >(
    ...handlers: [
      H<E2, P, I>,
      H<E3, P, I2>,
      H<E4, P, I3>,
      H<E5, P, I4>,
      H<E6, P, I5>,
      H<E7, P, I6>,
      H<E8, P, I7>,
      H<E9, P, I8, R>,
    ]
  ): HonoBase<
    IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8, E9]>,
    S & ToSchema<M, P, I8, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string,
    MergedPath extends MergePath<BasePath, P> = MergePath<BasePath, P>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    I5 extends Input = I & I2 & I3 & I4,
    I6 extends Input = I & I2 & I3 & I4 & I5,
    I7 extends Input = I & I2 & I3 & I4 & I5 & I6,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
    E6 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
    E7 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6]>,
    E8 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7]>,
  >(
    path: P,
    ...handlers: [
      H<E2, MergedPath, I>,
      H<E3, MergedPath, I2>,
      H<E4, MergedPath, I3>,
      H<E5, MergedPath, I4>,
      H<E6, MergedPath, I5>,
      H<E7, MergedPath, I6>,
      H<E8, MergedPath, I7, R>,
    ]
  ): HonoBase<
    E,
    S & ToSchema<M, MergePath<BasePath, P>, I7, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string = ExtractStringKey<S> extends never
      ? BasePath
      : ExtractStringKey<S>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    I5 extends Input = I & I2 & I3 & I4,
    I6 extends Input = I & I2 & I3 & I4 & I5,
    I7 extends Input = I & I2 & I3 & I4 & I5 & I6,
    I8 extends Input = I & I2 & I3 & I4 & I5 & I6 & I7,
    I9 extends Input = I & I2 & I3 & I4 & I5 & I6 & I7 & I8,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
    E6 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
    E7 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6]>,
    E8 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7]>,
    E9 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8]>,
    E10 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8, E9]>,
  >(
    ...handlers: [
      H<E2, P, I>,
      H<E3, P, I2>,
      H<E4, P, I3>,
      H<E5, P, I4>,
      H<E6, P, I5>,
      H<E7, P, I6>,
      H<E8, P, I7>,
      H<E9, P, I8>,
      H<E10, P, I9, R>,
    ]
  ): HonoBase<
    IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8, E9, E10]>,
    S & ToSchema<M, P, I9, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string,
    MergedPath extends MergePath<BasePath, P> = MergePath<BasePath, P>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    I5 extends Input = I & I2 & I3 & I4,
    I6 extends Input = I & I2 & I3 & I4 & I5,
    I7 extends Input = I & I2 & I3 & I4 & I5 & I6,
    I8 extends Input = I & I2 & I3 & I4 & I5 & I6 & I7,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
    E6 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
    E7 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6]>,
    E8 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7]>,
    E9 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8]>,
  >(
    path: P,
    ...handlers: [
      H<E2, MergedPath, I>,
      H<E3, MergedPath, I2>,
      H<E4, MergedPath, I3>,
      H<E5, MergedPath, I4>,
      H<E6, MergedPath, I5>,
      H<E7, MergedPath, I6>,
      H<E8, MergedPath, I7>,
      H<E9, MergedPath, I8, R>,
    ]
  ): HonoBase<
    E,
    S & ToSchema<M, MergePath<BasePath, P>, I8, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string = ExtractStringKey<S> extends never
      ? BasePath
      : ExtractStringKey<S>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    I5 extends Input = I & I2 & I3 & I4,
    I6 extends Input = I & I2 & I3 & I4 & I5,
    I7 extends Input = I & I2 & I3 & I4 & I5 & I6,
    I8 extends Input = I & I2 & I3 & I4 & I5 & I6 & I7,
    I9 extends Input = I & I2 & I3 & I4 & I5 & I6 & I7 & I8,
    I10 extends Input = I & I2 & I3 & I4 & I5 & I6 & I7 & I8 & I9,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
    E6 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
    E7 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6]>,
    E8 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7]>,
    E9 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8]>,
    E10 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8, E9]>,
    E11 extends Env = IntersectNonAnyTypes<
      [E, E2, E3, E4, E5, E6, E7, E8, E9, E10]
    >,
  >(
    ...handlers: [
      H<E2, P, I>,
      H<E3, P, I2>,
      H<E4, P, I3>,
      H<E5, P, I4>,
      H<E6, P, I5>,
      H<E7, P, I6>,
      H<E8, P, I7>,
      H<E9, P, I8>,
      H<E10, P, I9>,
      H<E11, P, I10, R>,
    ]
  ): HonoBase<
    IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11]>,
    S & ToSchema<M, P, I10, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string,
    MergedPath extends MergePath<BasePath, P> = MergePath<BasePath, P>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    I5 extends Input = I & I2 & I3 & I4,
    I6 extends Input = I & I2 & I3 & I4 & I5,
    I7 extends Input = I & I2 & I3 & I4 & I5 & I6,
    I8 extends Input = I & I2 & I3 & I4 & I5 & I6 & I7,
    I9 extends Input = I & I2 & I3 & I4 & I5 & I6 & I7 & I8,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
    E6 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
    E7 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6]>,
    E8 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7]>,
    E9 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8]>,
    E10 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8, E9]>,
  >(
    path: P,
    ...handlers: [
      H<E2, MergedPath, I>,
      H<E3, MergedPath, I2>,
      H<E4, MergedPath, I3>,
      H<E5, MergedPath, I4>,
      H<E6, MergedPath, I5>,
      H<E7, MergedPath, I6>,
      H<E8, MergedPath, I7>,
      H<E9, MergedPath, I8>,
      H<E10, MergedPath, I9, R>,
    ]
  ): HonoBase<
    E,
    S & ToSchema<M, MergePath<BasePath, P>, I9, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string,
    MergedPath extends MergePath<BasePath, P> = MergePath<BasePath, P>,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
    I2 extends Input = I,
    I3 extends Input = I & I2,
    I4 extends Input = I & I2 & I3,
    I5 extends Input = I & I2 & I3 & I4,
    I6 extends Input = I & I2 & I3 & I4 & I5,
    I7 extends Input = I & I2 & I3 & I4 & I5 & I6,
    I8 extends Input = I & I2 & I3 & I4 & I5 & I6 & I7,
    I9 extends Input = I & I2 & I3 & I4 & I5 & I6 & I7 & I8,
    I10 extends Input = I & I2 & I3 & I4 & I5 & I6 & I7 & I8 & I9,
    E2 extends Env = E,
    E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
    E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>,
    E5 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4]>,
    E6 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5]>,
    E7 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6]>,
    E8 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7]>,
    E9 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8]>,
    E10 extends Env = IntersectNonAnyTypes<[E, E2, E3, E4, E5, E6, E7, E8, E9]>,
    E11 extends Env = IntersectNonAnyTypes<
      [E, E2, E3, E4, E5, E6, E7, E8, E9, E10]
    >,
  >(
    path: P,
    ...handlers: [
      H<E2, MergedPath, I>,
      H<E3, MergedPath, I2>,
      H<E4, MergedPath, I3>,
      H<E5, MergedPath, I4>,
      H<E6, MergedPath, I5>,
      H<E7, MergedPath, I6>,
      H<E8, MergedPath, I7>,
      H<E9, MergedPath, I8>,
      H<E10, MergedPath, I9>,
      H<E11, MergedPath, I10, R>,
    ]
  ): HonoBase<
    E,
    S & ToSchema<M, MergePath<BasePath, P>, I10, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string = ExtractStringKey<S> extends never
      ? BasePath
      : ExtractStringKey<S>,
    I extends Input = BlankInput,
    R extends HandlerResponse<any> = any,
  >(
    ...handlers: H<E, P, I, R>[]
  ): HonoBase<E, S & ToSchema<M, P, I, MergeTypedResponse<R>>, BasePath>
  <
    P extends string,
    I extends Input = BlankInput,
    R extends HandlerResponse<any> = any,
  >(
    path: P,
    ...handlers: H<E, MergePath<BasePath, P>, I, R>[]
  ): HonoBase<
    E,
    S & ToSchema<M, MergePath<BasePath, P>, I, MergeTypedResponse<R>>,
    BasePath
  >
  <
    P extends string,
    R extends HandlerResponse<any> = any,
    I extends Input = BlankInput,
  >(
    path: P,
  ): HonoBase<
    E,
    S & ToSchema<M, MergePath<BasePath, P>, I, MergeTypedResponse<R>>,
    BasePath
  >
}
