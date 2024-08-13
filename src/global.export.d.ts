declare module 'react' {
  interface CSSProperties {
    [CSSCustomPropertiesKey: `--${string}`]: string | number
  }
}

export {}
