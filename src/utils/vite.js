export function plasmoUrlReplace() {
  const virtualModuleId = /import (.*?) from "url\:(.*)"/g

  return {
    name: 'plasmo url replace', // required, will show up in warnings and errors
    transform(text = '', id) {
      const matches = [...text.matchAll(virtualModuleId)]
      for (const match of matches) {
        text = text.replace(
          match[0],
          `import ${match[1]} from "${match[2]}?url"`,
        )
      }
      return text
    },
  }
}

export function plasmoDataTextReplace() {
  const virtualModuleId = /import (.*?) from "data-text\:(.*)"/g

  return {
    name: 'plasmo url replace', // required, will show up in warnings and errors
    transform(text = '', id) {
      const matches = [...text.matchAll(virtualModuleId)]
      for (const match of matches) {
        text = text.replace(
          match[0],
          `import ${match[1]} from "${match[2]}?row"`,
        )
      }
      return text
    },
  }
}
