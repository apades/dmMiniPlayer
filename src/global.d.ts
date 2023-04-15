interface Window {
  [k: string]: any
}

type dykey<T = any> = {
  [key: string]: T
}

declare module 'ass-parser' {
  const assParser: (text: string, option?: any) => any[]
  export default assParser
}
