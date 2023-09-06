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
   * *目前默认使用*
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
   *  */
  reactVP_webVideo = 'reactVP_webVideo',
}

export const docPIPConfig = {
  useDocPIP: config({
    defaultValue: !!window?.documentPictureInPicture,
    label: '使用新版画中画',
    desc: '如果浏览器支持新版画中画，这个默认为关闭',
  }),
  docPIP_renderType: config<DocPIPRenderType>({
    notRecommended: true,
    label: '新画中画模式',
    defaultValue: DocPIPRenderType.reactVP_webVideo,
    type: 'group',
    group: [
      DocPIPRenderType.reactVP_canvasCs,
      DocPIPRenderType.reactVP_cs,
      DocPIPRenderType.oVP_cs,
      DocPIPRenderType.reactVP_webVideo,
    ],
  }),
}
