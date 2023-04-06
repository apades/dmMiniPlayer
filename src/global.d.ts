interface Window {
  [k: string]: any
}

type dykey<T = any> = {
  [key: string]: T
}
