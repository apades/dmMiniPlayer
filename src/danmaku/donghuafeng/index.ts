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
      } as DanType)
  )
}
