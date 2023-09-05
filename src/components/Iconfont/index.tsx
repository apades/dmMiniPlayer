import { memo, type CSSProperties, type FC, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

let div = document.createElement('div')
document.body.appendChild(div)

const svgMap = {
  iconicon_player_volume: (
    <svg id="iconicon_player_volume" viewBox="0 0 1024 1024">
      <path d="M470.016 34.176c56.768-45.696 100.928-21.184 100.928 52.288V887.04c0 70.272-44.16 91.52-94.592 45.76l-227.008-192.768H124.8c-70.976 0-124.544-58.816-124.544-129.088v-263.04C0.256 277.696 56.96 218.88 124.8 218.88h118.208L470.016 34.176z m231.744 660.032a36.16 36.16 0 0 1-29.952-14.72c-20.48-21.184-20.48-45.696 0-63.68 74.112-76.8 74.112-192.768 0-269.568-20.48-21.248-20.48-45.76 0-63.744 20.48-21.184 44.16-21.184 64.64 0 115.072 107.84 115.072 282.688 0 392.128-17.28 16.32-20.48 19.584-34.688 19.584z m124.544 73.536c-20.48-21.248-20.48-45.76 0-63.744a314.56 314.56 0 0 0 0-437.76c-20.48-21.312-20.48-45.824 0-63.744 20.48-21.248 44.16-21.248 64.64 0 74.112 76.8 118.272 174.784 118.272 276.096 0 101.248-44.16 205.824-118.272 276.096-6.272 6.528-20.48 14.72-29.952 14.72-14.208 9.792-26.816 1.6-34.688-1.664z"></path>
    </svg>
  ),
  iconicon_player_pause: (
    <svg id="iconicon_player_pause" viewBox="0 0 1024 1024">
      <path d="M253.44 984.96a120.064 120.064 0 0 1-119.808-119.68V158.72c0-65.792 53.952-119.68 119.808-119.68 65.92 0 119.808 53.888 119.808 119.68v706.56c0 65.792-53.888 119.68-119.808 119.68z m517.12 0a120.064 120.064 0 0 1-119.808-119.68V158.72c0-65.792 53.888-119.68 119.808-119.68 65.92 0 119.808 53.888 119.808 119.68v706.56c0 65.792-53.952 119.68-119.808 119.68z"></path>
    </svg>
  ),
  iconicon_player_play: (
    <svg id="iconicon_player_play" viewBox="0 0 1088 1024">
      <path d="M869.12 567.04l-592.576 378.24a93.888 93.888 0 0 1-131.072-31.168 99.072 99.072 0 0 1-14.4-51.52V161.408c0-53.76 42.624-97.408 95.168-97.408 17.792 0 35.2 5.12 50.304 14.72l592.64 378.24a65.792 65.792 0 0 1 0 110.08z"></path>
    </svg>
  ),
  iconMute1: (
    <svg id="iconMute1" viewBox="0 0 1024 1024">
      <path d="M570.88 86.464V887.04c0 70.272-44.096 91.52-94.528 45.76L249.344 740.032H124.8C53.824 740.032 0.256 681.216 0.256 610.944v-263.04C0.256 277.696 56.96 218.88 124.8 218.88h118.208L470.016 34.176c56.768-45.696 100.928-21.184 100.928 52.288z m391.424 107.52a57.6 57.6 0 0 1 27.904 76.544l-99.584 213.44 99.584 213.504a57.6 57.6 0 1 1-104.448 48.64l-58.688-125.888-58.688 125.952A57.6 57.6 0 0 1 664 697.536l99.52-213.568L664 270.528a57.6 57.6 0 1 1 104.384-48.64l58.688 125.824 58.688-125.888a57.6 57.6 0 0 1 76.544-27.84z"></path>
    </svg>
  ),
  input: (
    <svg id="input" viewBox="0 0 1024 1024">
      <path d="M341.333333 896v-85.333333h128V213.333333H341.333333V128h341.333334v85.333333h-128v597.333334h128v85.333333H341.333333zM770.133333 300.8L981.333333 512l-211.2 211.2-60.330666-60.330667L860.672 512l-150.869333-150.869333L770.133333 300.8z m-516.266666 0l60.330666 60.330667L163.328 512l150.869333 150.869333L253.866667 723.2 42.666667 512l211.2-211.2z"></path>
    </svg>
  ),
}

function withPortal<T>(
  Components: React.FC<T>
): React.FC<T & { container: Element }> {
  Components = memo(Components) as any
  return (props: T & { container: Element }) => {
    if (props.container) {
      return createPortal(<Components {...props} />, props.container)
    }

    return <Components {...props} />
  }
}
type Type = string
type Props = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLSpanElement>,
  HTMLSpanElement
> & {
  type: Type
  size?: CSSProperties['fontSize']
}

const Iconfont: FC<Props> = (props) => {
  return (
    <span
      {...props}
      className={`component-icon ${props.className ?? ''} ${props.type}`}
      style={{
        color: props.color,
        fontSize: props.size,
        lineHeight: 1,
        verticalAlign: 'middle',
        ...(props.style ?? {}),
      }}
    >
      <svg
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        {(svgMap as any)[props.type]}
      </svg>
    </span>
  )
}

export default Iconfont
