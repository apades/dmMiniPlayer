import { WebSocketServer } from 'ws'
import { tryCatch } from '@root/utils'
import Events2 from '@root/utils/Events2'
import chalk from 'chalk'
import { NEED_EXT_RELOAD, NEED_PAGE_RELOAD, WS_PORT } from '../shared'
import { EsbuildPlugin } from './types'

const ws = new WebSocketServer({
  port: WS_PORT,
})

const eventBus = new Events2<{ extReload: void; pageReload: void }>()

ws.on('connection', function (ws) {
  // TODO 不知道为什么bg会间隔中断ws然后重连，是没保活sw的原因？
  console.log(`[outputListener] ${chalk.green('Extension ws connected')}`)
  // ws.send('pageReload')

  eventBus.on('extReload', () => {
    ws.send('extReload')
  })
  eventBus.on('pageReload', () => {
    ws.send('pageReload')
  })

  ws.on('message', function (_str) {
    const str = _str.toString()
    switch (str) {
      case 'ping':
        ws.send('pong')
        break
    }
  })
})

const lastFileCache = new Map<string, string>()
export const outputListener = (): EsbuildPlugin => {
  return {
    name: 'outputListener',
    setup(build) {
      build.onEnd((rs) => {
        let extReload = false,
          pageReload = false

        tryCatch(() => {
          rs.outputFiles?.find((file) => {
            if (file.path.endsWith('.map')) return
            const lastContent = lastFileCache.get(file.path),
              nowContent = file.contents.toString()

            lastFileCache.set(file.path, nowContent)
            if (!lastContent) {
              return
            }

            if (lastContent === nowContent) return

            NEED_EXT_RELOAD.find((name) => {
              if (file.path.includes(name + '.js')) {
                extReload = true
                throw ''
              }
            })

            NEED_PAGE_RELOAD.find((name) => {
              if (file.path.includes(name + '.js')) {
                pageReload = true
                throw ''
              }
            })
          })
        })

        if (extReload) {
          eventBus.emit('extReload')
        }

        if (pageReload) {
          eventBus.emit('pageReload')
        }
      })
    },
  }
}
