import { config } from '@apad/setting-panel'

export enum DocPIPRenderType {
  /**
   * react播放器，对webVideo captureStream附加到reactVP的video中
   *
   * *目前有帧率对不上原视频的问题*
   * */
  reactVP_cs = 'reactVP_cs',
  /**
   * react播放器，但用的旧miniPlayer的canvasPlayer的captureStream到reactVP的video中
   *
   * */
  reactVP_canvasCs = 'reactVP_canvasCs',
  /**
   * 原生video，对webVideo captureStream附加到reactVP的video中
   *
   * *跟reactVP_cs一样的问题* 应该就是video captureStream才会出现的，很奇怪的就是canvas不会掉帧
   * */
  oVP_cs = 'oVP_cs',
  /**
   * react播放器，但里面的video标签替换成webVideo
   *
   * *目前默认使用*
   *  */
  reactVP_webVideo = 'reactVP_webVideo',
}

export const docPIPConfig = {
  useDocPIP: config({
    defaultValue: !!window?.documentPictureInPicture,
    label: '使用新版画中画',
    desc: '如果浏览器支持新版画中画，默认为开启',
  }),
  docPIP_renderType: config<DocPIPRenderType>({
    // notRecommended: true,
    label: '新版画中画播放模式',
    defaultValue: DocPIPRenderType.reactVP_webVideo,
    type: 'group',
    group: [
      {
        value: DocPIPRenderType.reactVP_webVideo,
        label: '转移网页视频标签到画中画',
        desc: '默认推荐使用',
      },
      {
        value: DocPIPRenderType.reactVP_canvasCs,
        label: '双视频模式',
        desc: '针对视频在iframe中的方案，把网页视频流放在canvas里绘制，与旧版画中画核心一致，比较消耗性能',
      },
      {
        value: DocPIPRenderType.reactVP_cs,
        label: '不经过canvas的双视频模式',
        desc: '有帧率不如[双视频模式]的问题，60fps视频很明显',
      },
      {
        value: DocPIPRenderType.oVP_cs,
        label: '不经过canvas的双视频模式到原始video',
      },
    ],
    relateBy: 'useDocPIP',
    relateByValue: true,
  }),
}
