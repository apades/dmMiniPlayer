import { minmax, formatTime } from '@root/utils'
import React, { type CSSProperties, type FC, useState } from 'react'

type Props = {
  pgBarRect: DOMRect
  mouseInLeft: number
  mouseInPercent: number
  duration: number

  isShowPreview: boolean
  setShowPreview: (value: React.SetStateAction<boolean>) => void

  clearPreviewTimeout: () => void
}
let VideoPreviewPannel: FC<Props> = (props) => {
  let {
    pgBarRect,
    mouseInLeft,
    mouseInPercent,
    duration,
    isShowPreview,
    setShowPreview,
    clearPreviewTimeout,
  } = props
  let [comment, setComment] = useState('')

  if (!pgBarRect) return <></>
  let style: CSSProperties = {}
  let leftInit = mouseInLeft
  if (leftInit >= pgBarRect.width / 2)
    style.right =
      minmax(pgBarRect.width - leftInit - 110, 0, pgBarRect.width) + 'px'
  else style.left = minmax(leftInit - 110, 0, pgBarRect.width) + 'px'

  return (
    <>
      <div
        className={`preview-pannel-cursor ${isShowPreview || 'hidden'}`}
        style={{
          left: `${mouseInPercent * 100}%`,
        }}
      ></div>
      <div
        className={`preview-pannel ${isShowPreview || 'hidden'}`}
        style={{
          ...style,
        }}
        onMouseEnter={clearPreviewTimeout}
        onMouseLeave={() => setShowPreview(false)}
      >
        <div className="img-container">
          <img
            crossOrigin="anonymous"
            src="https://media.istockphoto.com/photos/falling-autumn-leaves-before-sunset-picture-id1176602671?k=6&m=1176602671&s=612x612&w=0&h=96rbs5I3q9E6MKyfDaBm-hhYbzBcoc6G3ksEIlNIZ-Y="
            alt="prev"
          />
        </div>
        <div
          className="action f-i-center"
          style={{ justifyContent: 'space-between' }}
        >
          <div className="time">·{formatTime(mouseInPercent * duration)}</div>
          {['👍', '💖', '👏', '🤣', '😎', '😮', '👎'].map((d, i) => (
            <span
              className="emoji"
              key={i}
              onClick={() => setComment((comment) => comment + d)}
              style={{ cursor: 'pointer' }}
            >
              {d}
            </span>
          ))}
        </div>
        <input
          value={comment}
          onKeyDown={(e) => {
            let a = e.target as any
            if (e.code === 'Enter') {
              // props
              //   .sendComent(comment, mouseInPercent * duration)
              //   .then(() => setComment(''))
            }
          }}
          onChange={(e) => setComment(e.target.value)}
          placeholder="说说你的想法"
        />
      </div>
    </>
  )
}

export default VideoPreviewPannel
