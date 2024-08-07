import { config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

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
    label: t('settingPanel.useDocPIP'),
    desc: t('settingPanel.useDocPIPDesc'),
    notRecommended: true,
  }),
  docPIP_renderType: config<DocPIPRenderType>({
    // notRecommended: true,
    label: t('settingPanel.docPIP_renderType'),
    defaultValue: DocPIPRenderType.reactVP_webVideo,
    type: 'group',
    group: [
      {
        value: DocPIPRenderType.reactVP_webVideo,
        label: t('settingPanel.reactVP_webVideo'),
        desc: t('settingPanel.reactVP_webVideoDesc'),
      },
      {
        value: DocPIPRenderType.reactVP_canvasCs,
        label: t('settingPanel.reactVP_canvasCs'),
        desc: t('settingPanel.reactVP_canvasCsDesc'),
      },
      {
        value: DocPIPRenderType.reactVP_cs,
        label: t('settingPanel.reactVP_cs'),
        desc: t('settingPanel.reactVP_csDesc'),
      },
      {
        value: DocPIPRenderType.oVP_cs,
        label: t('settingPanel.oVP_cs'),
      },
    ],
    relateBy: 'useDocPIP',
    relateByValue: true,
    notRecommended: true,
  }),
}
