import isTop from '@root/shared/isTop'
import './floatButton'
import logger from '@pkgs/logger/ext'
import runOnAllIframeMain from './main/run-on-all-iframe'
import runOnTopMain from './main/run-on-top'

window.isCsEnv = true
// iframe里就不用运行了
if (isTop) {
  // logger.log('run in top window')

  // const logger2 = logger.namespace('test')
  // logger2.log('run in top window namespace')
  runOnTopMain()
} else {
  runOnAllIframeMain()
}
