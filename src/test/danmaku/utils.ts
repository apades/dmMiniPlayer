import { DanmakuLiveEventEmitter } from '@root/danmaku/struct'
import { wait } from '@root/utils'
import { Constructor } from 'protobufjs'

globalThis.console.log = () => {}
const id = +process.argv[2]

export function pLog(str: string) {
  process.stdout.write(str + '\n')
}
export function pErr(str: string) {
  process.stderr.write(str + '\n')
}

export async function startTestLive(
  client: Constructor<DanmakuLiveEventEmitter>,
  // TODO
  getIsInLive?: (id: number) => Promise<boolean> | boolean
) {
  if (getIsInLive) {
    try {
      var isInLive = await getIsInLive(id)
    } catch (error) {
      pErr('检测是否在播方法出错')
      pErr(error.message)
      pErr(error.stack)
      return
    }
    if (!isInLive) return pLog(`${id}未上播`)
  }

  const c = new client(id)

  c.addEventListener('danmu', async (e) => {
    pLog('成功')
    process.exit(0)
  })
  setTimeout(async () => {
    pErr('失败')
    process.exit(0)
  }, 10 * 60 * 1000)
}
