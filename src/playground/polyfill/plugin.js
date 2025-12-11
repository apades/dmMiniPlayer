import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**@type {import('esbuild').Plugin} */
const polyfillPlugin = {
  name: 'my-plugin',
  setup(build) {
    build.onResolve(
      {
        filter: /webextension-polyfill/,
      },
      function (args) {
        // console.log(path.resolve(__dirname, './browser/index.ts'))
        return {
          path: path.resolve(__dirname, './browser/index.ts'),
        }
      },
    )
  },
}

export default {
  esbuild: polyfillPlugin,
}
