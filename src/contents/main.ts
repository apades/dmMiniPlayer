import isTop from '@root/shared/isTop'
import './floatButton'
import runOnAllIframeMain from './main/run-on-all-iframe'
import runOnTopMain from './main/run-on-top'

window.isCsEnv = true
// iframe里就不用运行了
if (isTop) {
  console.log('run in top window')
  runOnTopMain()
} else {
  runOnAllIframeMain()
}
