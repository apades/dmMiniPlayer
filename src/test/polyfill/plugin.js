const path = require('node:path')

/**@type {import('esbuild').Plugin} */
const polyfillPlugin = {
  name: 'my-plugin',
  setup(build) {
    build.onResolve(
      {
        filter: /webextension-polyfill/,
      },
      (args) => {
        // console.log(path.resolve(__dirname, './browser/index.ts'))
        return {
          path: path.resolve(__dirname, './browser/index.ts'),
        }
      },
    )
  },
}

module.exports = {
  esbuild: polyfillPlugin,
}
