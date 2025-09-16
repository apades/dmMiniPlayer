import fs from 'fs-extra'
import { load as yamlLoad } from 'js-yaml'
import { EsbuildPlugin } from './types'

export const yamlLoader = (): EsbuildPlugin => {
  return {
    name: 'yaml-loader',
    setup(build) {
      build.onLoad({ filter: /\.ya?ml$/ }, async (args) => {
        const content = await fs.readFile(args.path, 'utf-8')

        if (args.path.includes('fr')) {
          console.log(`${content}`)
          console.log('fr', yamlLoad(content))
        }
        return {
          contents: JSON.stringify(yamlLoad(content)), // 将yaml转换为json
          loader: 'json',
        }
      })
    },
  }
}
