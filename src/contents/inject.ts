import { PlasmoCSConfig } from 'plasmo'
import '../inject'

export const config: PlasmoCSConfig = {
  matches: ['https://www.bilibili.com/*'],
  world: 'MAIN',
  run_at: 'document_start',
  all_frames: true,
}
