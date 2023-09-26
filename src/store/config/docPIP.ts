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
    desc: '默认的reactVP_webVideo是将网页的视频转移到画中画里，可以节省canvas性能。reactVP_canvasCs双视频模式是针对网页视频嵌在iframe里，采用canvas渲染视频，目前新的侧边栏**非SPA路由跳转视频**需要用该模式',
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
