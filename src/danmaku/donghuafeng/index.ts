import { VideoBarrageClient } from '@root/core/danmaku/BarrageClient'
import type { DanType } from '..'

export async function getDonghuafengDanmu(id: string): Promise<DanType[]> {
  const form = new FormData()
  form.append('sn', id)
  const res = await fetch('https://ani.gamer.com.tw/ajax/danmuGet.php', {
    method: 'post',
    body: form,
  }).then((res) => res.json())
  return res.map(
    (r: any) =>
      ({
        color: r.color,
        text: r.text,
        time: r.time / 10,
        type: r.position == 0 ? 'right' : 'top',
        uname: r.userid,
        uid: r.sn + '',
      } as DanType)
  )
}

export class DonghuafengBarrageClient extends VideoBarrageClient {
  getId() {
    const id = new URLSearchParams(location.search).get('sn')
    return id
  }
  protected async onInit() {
    const danmakus = await getDonghuafengDanmu(this.getId())
    this.emit('allDanmaku', danmakus)
  }
}
