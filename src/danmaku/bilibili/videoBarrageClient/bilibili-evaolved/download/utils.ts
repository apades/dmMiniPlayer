// import { loadDanmakuSettingsPanel } from '@/core/utils/lazy-panel'
// import { getFriendlyTitle } from '@/core/utils/title'
import { ascendingSort, clamp, dq1, get, omit } from '@root/utils'
import {
  type DanmakuConverterConfig,
  DanmakuConverter,
} from '../converter/danmaku-converter'
import { DanmakuType } from '../converter/danmaku-type'
import { XmlDanmaku } from '../converter/xml-danmaku'
import {
  decodeDanmakuSegment,
  decodeDanmakuView,
} from '../converter/danmaku-segment'
import DanmakuFilter from '../converter/danmaku-filter'

export class JsonDanmaku {
  // static SegmentSize = 6 * 60
  public jsonDanmakus: {
    id: number
    idStr: string
    progress: number
    mode: number
    fontsize: number
    color: number
    midHash: string
    content: string
    ctime: number
    weight: number
    action: string
    pool: number
    attr: number
  }[] = []
  constructor(
    public aid: number | string,
    public cid: number | string,
  ) {}
  // get segmentCount() {
  //   return Math.ceil(this.duration / JsonDanmaku.SegmentSize)
  // }
  get xmlDanmakus() {
    return this.jsonDanmakus.map((json) => ({
      content: json.content,
      time: json.progress ? (json.progress / 1000).toString() : '0',
      type: json.mode?.toString() ?? '1',
      fontSize: json.fontsize?.toString() ?? '25',
      color: json.color?.toString() ?? '16777215',
      timeStamp: json.ctime?.toString() ?? '0',
      pool: json.pool?.toString() ?? '0',
      userHash: json.midHash ?? '0',
      rowId: json.idStr ?? '0',
    }))
  }
  async fetchInfo() {
    // 这里为了兼容 pakku, 只能用 fetch https://github.com/xmcp/pakku.js/issues/153
    const fetchBlob = async (url: string) => {
      const response = await fetch(url)
      return response.blob()
    }
    const viewBlob = await fetchBlob(
      `https://api.bilibili.com/x/v2/dm/web/view?type=1&oid=${this.cid}&pid=${this.aid}`,
    )
    if (!viewBlob) {
      throw new Error('获取弹幕信息失败')
    }
    const view = await decodeDanmakuView(viewBlob)
    const { total } = view.dmSge
    if (total === undefined) {
      throw new Error(
        `获取弹幕分页数失败: ${JSON.stringify(omit(view, ['flag']))}`,
      )
    }
    // console.log('segment count =', total)
    const segments = await Promise.all(
      new Array(total).fill(0).map(async (_, index) => {
        const blob = await fetchBlob(
          `https://api.bilibili.com/x/v2/dm/web/seg.so?type=1&oid=${
            this.cid
          }&pid=${this.aid}&segment_index=${index + 1}`,
        )
        if (!blob) {
          throw new Error(`弹幕片段${index + 1}下载失败`)
        }
        // console.log(`received blob for segment ${index + 1}`, blob)
        const result = await decodeDanmakuSegment(blob)
        return result.elems ?? []
      }),
    )
    this.jsonDanmakus = segments
      .flat()
      .sort(ascendingSort((it) => it.progress ?? 0))
    return this
  }
}
export type DanmakuDownloadType = 'json' | 'xml' | 'ass' | 'originJson'
export const getUserDanmakuConfig = async () => {
  const title = 'test'
  const defaultConfig: Omit<DanmakuConverterConfig, 'title'> = {
    font: '微软雅黑',
    alpha: 0.4,
    duration: (danmaku: { type: number }) => {
      switch (danmaku.type) {
        case 4:
        case 5:
          return 4
        default:
          return 6
      }
    },
    blockTypes: [7, 8],
    resolution: {
      x: 1920,
      y: 1080,
    },
    bottomMarginPercent: 0.15,
    bold: false,
  }
  let config = { ...defaultConfig, title } as DanmakuConverterConfig
  try {
    // await loadDanmakuSettingsPanel()
    const playerSettingsJson = localStorage.getItem('bilibili_player_settings')

    // console.log('playerSettingsJson', playerSettingsJson)
    if (playerSettingsJson) {
      const playerSettings = JSON.parse(playerSettingsJson)
      const getConfig = <T>(prop: string, defaultValue?: T): T =>
        get(playerSettings, `setting_config.${prop}`, defaultValue)
      // 屏蔽类型
      config.blockTypes = (() => {
        const result: (DanmakuType | 'color')[] = []
        const blockValues = {
          scroll: [1, 2, 3],
          top: [5],
          bottom: [4],
          color: ['color'],
        }

        for (const [type, value] of Object.entries(blockValues)) {
          if (
            get<boolean>(playerSettings, `block.type_${type}`, true) === false
          ) {
            result.push(...(value as (DanmakuType | 'color')[]))
          }
        }
        return result.concat(7, 8) // 高级弹幕不做转换
      })()

      // 加粗
      config.bold = getConfig('bold', false)

      // 透明度
      config.alpha = clamp(1 - parseFloat(getConfig('opacity', '0.4')), 0, 1)

      // 分辨率
      const resolutionFactor = 1.4 - 0.4 * getConfig('fontsize', 1)
      config.resolution = {
        x: Math.round(1920 * resolutionFactor),
        y: Math.round(1080 * resolutionFactor),
      }

      // 弹幕持续时长
      config.duration = (() => {
        const scrollDuration = 18 - 3 * getConfig('speedplus', 0)
        return (danmaku: { type: number }) => {
          switch (danmaku.type) {
            case 4:
            case 5:
              return 4 // stickyDuration
            default:
              return scrollDuration
          }
        }
      })()

      // 底部间距
      const bottomMargin = getConfig('danmakuArea', 0)
      config.bottomMarginPercent = bottomMargin >= 100 ? 0 : bottomMargin / 100
      // 无显示区域限制时要检查是否开启防挡字幕
      if (
        config.bottomMarginPercent === 0 &&
        getConfig('preventshade', false)
      ) {
        config.bottomMarginPercent = 0.15
      }

      // 用户屏蔽词
      const blockSettings = get(playerSettings, 'block.list', []) as {
        /** 类型 */
        t: 'keyword' | 'regexp' | 'user'
        /** 内容 */
        v: string
        /** 是否开启 */
        s: boolean
        id: number
      }[]
      config.blockFilter = (danmaku) => {
        for (const b of blockSettings) {
          if (!b.s) {
            continue
          }
          switch (b.t) {
            default:
              return true
            case 'keyword': {
              if (danmaku.content.includes(b.v)) {
                return false
              }
              break
            }
            case 'regexp': {
              if (new RegExp(b.v).test(danmaku.content)) {
                return false
              }
              break
            }
            case 'user': {
              if (danmaku.userHash === b.v) {
                return false
              }
              break
            }
          }
        }
        return true
      }
    } else {
      console.warn('[弹幕转换] 未找到播放器设置')
      config = {
        ...config,
        ...defaultConfig,
      }
    }

    // 字体直接从 HTML 里取了, localStorage 里是 font-family 解析更麻烦些
    config.font = (
      dq1(
        ':is(.bilibili-player-video-danmaku-setting-right-font, .bpx-player-dm-setting-right-font-content-fontfamily) .bui-select-result',
      ) as HTMLElement
    ).innerText
  } catch (error) {
    // The default config
    // logError(error)
    // throw error
    config = {
      ...config,
      ...defaultConfig,
    }
  }
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined || value === null) {
      console.warn('danmaku config invalid for key', key, ', value =', value)
      ;(config as any)[key] = (defaultConfig as any)[value]
    }
  }
  // console.log(config)
  return config
}
export const convertToAss = async (xml: string) => {
  const converter = new DanmakuConverter(await getUserDanmakuConfig())
  const assDocument = converter.xmlStringToAssDocument(xml)
  return assDocument.generateAss()
}
export const convertToAssFromJson = async (danmaku: JsonDanmaku) => {
  const converter = new DanmakuConverter(await getUserDanmakuConfig())
  const assDocument = converter.xmlDanmakuToAssDocument(
    danmaku.xmlDanmakus.map((x) => new XmlDanmaku(x)),
  )
  return assDocument.generateAss()
}
export const convertToJsonFromOriginJson = async (danmaku: JsonDanmaku) => {
  const converter = new DanmakuFilter(await getUserDanmakuConfig())
  return JSON.stringify(danmaku.jsonDanmakus)
}

export const convertToXmlFromJson = (danmaku: JsonDanmaku) => {
  const xmlText = `
<?xml version="1.0" encoding="UTF-8"?><i><chatserver>chat.bilibili.com</chatserver><chatid>${
    danmaku.cid
  }</chatid><mission>0</mission><maxlimit>${
    danmaku.xmlDanmakus.length
  }</maxlimit><state>0</state><real_name>0</real_name><source>k-v</source>
${danmaku.xmlDanmakus.map((x) => `  ${new XmlDanmaku(x).text()}`).join('\n')}
</i>
  `.trim()
  return xmlText
}

export const getTextByType = async (
  type: DanmakuDownloadType,
  input: {
    aid: string
    cid: string
  },
) => {
  const { aid, cid } = input
  const danmaku = await new JsonDanmaku(aid, cid).fetchInfo()
  switch (type) {
    case 'xml': {
      return convertToXmlFromJson(danmaku)
    }
    default:
    case 'json': {
      return convertToJsonFromOriginJson(danmaku)
    }
    /**这里是返回完全没处理过的全部json弹幕 */
    case 'originJson': {
      return JSON.stringify(danmaku.jsonDanmakus, undefined, 2)
    }
    case 'ass': {
      return await convertToAssFromJson(danmaku)
    }
  }
}
