import fs from 'fs-extra'
import { manifest } from '../src/manifest'
import { outDir } from './tsup.shared'
import { pr } from './utils.mjs'

manifest.web_accessible_resources = [
  {
    resources: fs.readdirSync(pr(outDir)),
    matches: ['<all_urls>'],
  },
  {
    resources: ['assets/icon.png'],
    matches: ['<all_urls>'],
  },
]
fs.writeJSONSync(pr(outDir, './manifest.json'), manifest, { spaces: 2 })
