/**@deprecated */
import API_bilibili from '@root/api/bilibili'
import type { BiliLiteItem } from '@root/api/bilibili/type'
import { useOnce } from '@root/hook'
import { useState, type FC } from 'react'

type Props = {
  onClick: (url: string) => void
}
const Follows: FC<Props> = (props) => {
  const [liteItems, setLiteItems] = useState<BiliLiteItem[]>([])
  useOnce(async () => {
    setLiteItems(await API_bilibili.getMomentsVideos())
  })
  return (
    <div className="follows">
      <h3>关注列表</h3>
      <ul>
        {liteItems.map((item) => {
          return (
            <li
              className="select"
              key={item.bid}
              onClick={() => {
                props.onClick(`/video/${item.bid}`)
              }}
            >
              <div className="img-container">
                <img src={item.cover} />
              </div>
              <div className="right">
                <div className="title" title={item.title}>
                  {item.title}
                </div>
                <div className="name">{item.user}</div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default Follows
