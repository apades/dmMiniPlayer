import fs from 'fs-extra'
import { FileParserModule } from '../types'

const parseJson: FileParserModule = {
  filter: 'json',
  setup() {
    return [fs.readJsonSync, (data: any) => JSON.stringify(data, null, 2)]
  },
}

export default parseJson
