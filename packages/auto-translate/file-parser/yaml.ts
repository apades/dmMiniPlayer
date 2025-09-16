import { load as yamlLoad, dump as yamlDump } from 'js-yaml'
import fs from 'fs-extra'
import { FileParserModule } from '../types'

const yamlParser: FileParserModule = {
  filter: ['yaml', 'yml'],
  setup: () => {
    return [
      (file: string) => {
        return yamlLoad(fs.readFileSync(file, 'utf-8'))
      },
      (data: any) => yamlDump(data),
    ]
  },
}

export default yamlParser
