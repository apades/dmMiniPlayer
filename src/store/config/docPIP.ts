import { config as _config } from '@apad/setting-panel'
import {
  Position,
  DocPIPRenderType,
  MovePIPAfterOpenType,
} from '@root/types/config'
import { t } from '@root/utils/i18n'

const category = t('settingPanel.pip')
const config: typeof _config = (props) => ({ ...props, category })

export const docPIPConfig = {
  autoPIP_inPageHide: config({
    label: t('settingPanel.autoPIPInPageHide'),
    defaultValue: false,
    desc: t('settingPanel.autoPIPInPageHideDesc'),
  }),
  autoPIP_inScrollToInvisible: config({
    label: t('settingPanel.autoPIPInScroll'),
    defaultValue: false,
    desc: t('settingPanel.autoPIPInScrollDesc'),
  }),
  autoPIP_closeInReturnToOriginPos: config({
    label: t('settingPanel.autoPIPCloseInReturnToOriginPos'),
    defaultValue: true,
    relateBy(settings) {
      return settings.autoPIP_inPageHide || settings.autoPIP_inScrollToInvisible
    },
  }),
  movePIPInOpen: config<MovePIPAfterOpenType>({
    label: t('settingPanel.movePIPInOpen'),
    type: 'group',
    group: [
      {
        value: MovePIPAfterOpenType.lastPos,
        label: t('settingPanel.movePIPInOpen_lastPos'),
      },
      {
        value: MovePIPAfterOpenType.custom,
        label: t('settingPanel.movePIPInOpen_custom'),
        desc: t('settingPanel.movePIPInOpen_customDesc'),
      },
    ],
    defaultValue: MovePIPAfterOpenType.lastPos,
  }),
  movePIPInOpen_basePos: config<Exclude<Position, Position.default>>({
    label: t('settingPanel.movePIPInOpen_basePos'),
    defaultValue: Position['bottomRight'],
    relateBy: 'movePIPInOpen',
    relateByValue: MovePIPAfterOpenType.custom,
    type: 'group',
    group: Object.values(Position)
      .filter((v) => v !== Position.default)
      .map((v) => ({
        value: v,
        label: t(`pos.${v}`),
      })),
  }),
  movePIPInOpen_offsetX: config({
    label: t('settingPanel.movePIPInOpen_offsetX'),
    defaultValue: 0,
    relateBy: 'movePIPInOpen',
    relateByValue: MovePIPAfterOpenType.custom,
  }),
  movePIPInOpen_offsetY: config({
    label: t('settingPanel.movePIPInOpen_offsetY'),
    defaultValue: 0,
    relateBy: 'movePIPInOpen',
    relateByValue: MovePIPAfterOpenType.custom,
  }),
  // ---
  quickHide_pos: config<Exclude<Position, Position.default>>({
    label: t('settingPanel.quickHide_pos'),
    defaultValue: Position['topLeft'],
    relateByValue: true,
    type: 'group',
    group: Object.values(Position)
      .filter((v) => v !== Position.default)
      .map((v) => ({
        value: v,
        label: t(`pos.${v}`),
      })),
  }),
  useDocPIP: config({
    defaultValue: !!window?.documentPictureInPicture,
    label: t('settingPanel.useDocPIP'),
    desc: t('settingPanel.useDocPIPDesc'),
  }),
  docPIP_renderType: config<DocPIPRenderType>({
    // notRecommended: true,
    label: t('settingPanel.docPIP_renderType'),
    defaultValue: DocPIPRenderType.replaceVideoEl,
    desc: t('settingPanel.forceModeToDebugger'),
    type: 'group',
    group: [
      {
        value: DocPIPRenderType.replaceVideoEl,
        label: t('settingPanel.reactVP_webVideo'),
        desc: t('settingPanel.reactVP_webVideoDesc'),
      },
      {
        value: DocPIPRenderType.capture_captureStreamWithCanvas,
        label: t('settingPanel.reactVP_canvasCs'),
        desc: t('settingPanel.reactVP_canvasCsDesc'),
      },
      {
        value: DocPIPRenderType.capture_captureStream,
        label: t('settingPanel.onlyCaptureStream'),
      },
      {
        value: DocPIPRenderType.capture_displayMediaWithCropTarget,
        label: t('settingPanel.displayMediaWithCropTarget'),
      },
      // DocPIPRenderType.capture_displayMediaWithRestrictionTarget,
      // DocPIPRenderType.capture_tabCapture,
      {
        value: DocPIPRenderType.capture_captureStreamWithWebRTC,
        label: t('settingPanel.captureStreamWithWebRTC'),
      },
      DocPIPRenderType.replaceWebVideoDom,
      // DocPIPRenderType.injectMediaSource,
    ],
    relateBy: 'useDocPIP',
    relateByValue: true,
  }),
  sameOriginIframeCaptureModePriority: config({
    label: t('settingPanel.sameOriginIframe'),
    defaultValue: DocPIPRenderType.capture_captureStream,
    type: 'group',
    group: [
      {
        value: DocPIPRenderType.capture_captureStreamWithCanvas,
        label: t('settingPanel.reactVP_canvasCs'),
      },
      {
        value: DocPIPRenderType.capture_captureStream,
        label: t('settingPanel.onlyCaptureStream'),
      },
    ],
  }),
  notSameOriginIframeCaptureModePriority: config({
    label: t('settingPanel.notSameOriginIframe'),
    defaultValue: DocPIPRenderType.capture_displayMediaWithCropTarget,
    type: 'group',
    group: [
      {
        label: t('settingPanel.displayMediaWithCropTarget'),
        value: DocPIPRenderType.capture_displayMediaWithCropTarget,
        desc: t('settingPanel.displayMediaWithCropTargetDesc'),
      },
      // {
      //   label: 'Use web improve record API',
      //   value: DocPIPRenderType.capture_displayMediaWithRestrictionTarget,
      //   desc: 'Better than `Use web record API`, but need to turn on feature in `chrome://flags/#element-capture`',
      // },
      // {
      //   label: 'Use chrome extension API',
      //   value: DocPIPRenderType.capture_tabCapture,
      //   desc: 'No browser sharing top bar, but performance is not good. Recommended to turn the web video into full screen before turning on this function.',
      // },
      {
        label: t('settingPanel.captureStreamWithWebRTC'),
        value: DocPIPRenderType.capture_captureStreamWithWebRTC,
        desc: t('settingPanel.captureStreamWithWebRTCDesc'),
      },
      // DocPIPRenderType.injectMediaSource,
    ],
  }),
  capture_tabCapture_FPS: config({
    label: t('settingPanel.recordFPS'),
    defaultValue: 30,
    desc: t('settingPanel.recordFPSDesc'),
    // relateBy: 'notSameOriginIframeCaptureModePriority',
    // relateByValue: DocPIPRenderType.capture_tabCapture,
    notRecommended: true,
  }),
  capture_tabCapture_clip: config({
    label: t('settingPanel.recordClip'),
    defaultValue: false,
    desc: t('settingPanel.recordClipDesc'),
    // relateBy: 'notSameOriginIframeCaptureModePriority',
    // relateByValue: DocPIPRenderType.capture_tabCapture,
    notRecommended: true,
  }),
  capture_captureStream_autoSetCrossOrigin: config({
    label: t('settingPanel.autoSetVideoCrossOrigin'),
    defaultValue: true,
    notRecommended: true,
  }),
  injectPIPFn: config({
    label: t('settingPanel.injectPIPFn'),
    // desc: t('settingPanel.injectPIPFnDesc'),
    defaultValue: true,
  }),
} as const
