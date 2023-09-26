import DocMiniPlayer from '@root/core/DocMiniPlayer'
import VideoChanger from '@root/core/VideoChanger'
import type MiniPlayer from '@root/core/miniPlayer'
import { createElement, dq, dq1 } from '@root/utils'
import classNames from 'classnames'
import { useRef, useState } from 'react'
import WebProvider from '../webProvider'

// TODO agemys用的**iframe + 非同源url**作为播放器网页，docPIP只能在top请求，且top和iframe互相隔离，canvasPIP会黑屏，目前就只能用原生画中画功能
// 目前可能的就是通过tabs权限开一个iframe url的tab，后续操作都在这个tab里
// ? ext message能传htmlelment不?         感觉是大概率不行
// ? 无感打开tab然后requestDocPIP行不行?    感觉不行，这个需要信任点击才能触发，不知道插件主动开的tab算不算
export default class AgemysProvider extends WebProvider {
  iframe = createElement('iframe', {
    style: `position:fixed;width:${window.innerWidth}px;height:${window.innerHeight}px;top:0;left:0;visibility: hidden;`,
  })
  protected async initMiniPlayer(
    options?: Partial<{ videoEl: HTMLVideoElement }>
  ): Promise<MiniPlayer> {
    const miniPlayer = await super.initMiniPlayer(options)

    if (miniPlayer instanceof DocMiniPlayer) {
      this.initSideActionAreaRender(miniPlayer)
    }
    return miniPlayer
  }

  initSideActionAreaRender(miniPlayer: DocMiniPlayer) {
    const videoChanger = new VideoChanger(this)
    const videoPElList = dq('.tab-pane.active .video_detail_episode> li')
    const videoList: { el: HTMLElement; link: string; text: string }[] =
      videoPElList.map((el) => {
        const aEl = dq1('a', el)

        return {
          el,
          link: aEl.href,
          text: aEl.textContent,
        }
      })

    function Side() {
      let [active, setActive] = useState(
        videoPElList.findIndex((el) => dq1('.video_detail_spisode_playing', el))
      )
      const scrollContainerRef = useRef<HTMLDivElement>(),
        activeElRef = useRef<HTMLLIElement>()

      return (
        <div className="side-outer-container">
          {/* TODO 侧边栏提示 */}
          <div ref={scrollContainerRef} className="side-inner-container">
            {videoPElList.length && (
              <>
                <h3>视频分P</h3>
                <ul className="select-list">
                  {videoList.map((data, i) => (
                    <li
                      className={classNames('select', active == i && 'active')}
                      key={i}
                      onClick={() => {
                        videoChanger.changeVideo(data.link)
                        // data.link
                        setActive(i)
                      }}
                      ref={active == i ? activeElRef : undefined}
                    >
                      {data.text}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )
    }

    miniPlayer.renderSideActionArea = () => <Side />
  }
}
