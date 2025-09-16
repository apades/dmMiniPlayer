import { parse, stringify } from 'smol-toml'
import fs from 'fs-extra'
import { FileParserModule } from '../types'

const tomlParser: FileParserModule = {
  filter: 'toml',
  setup: () => {
    return [
      (file: string) => {
        return parse(fs.readFileSync(file, 'utf-8'))
      },
      (data: any) => {
        const str = stringify(data)
        return str
      },
    ]
  },
}

export default tomlParser
