/* eslint-disable @typescript-eslint/ban-types */
// eslint-disable-next-line prettier/prettier
export type RequiredLiteralKeys<T> = keyof { [K in keyof T as string extends K ? never : number extends K ? never :
    {} extends Pick<T, K> ? never : K]: 0 }

export type OptionalLiteralKeys<T> = keyof { [K in keyof T as string extends K ? never : number extends K ? never :
    {} extends Pick<T, K> ? K : never]: 0 }

export type IndexKeys<T> = string extends keyof T ? string : number extends keyof T ? number : never; 

export type KeyOfType<T, V> = keyof {
    [P in keyof T as T[P] extends V ? P : never]: any
  }