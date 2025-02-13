export enum DocPIPRenderType {
  /**
   * 使用video.captureStream()获取stream，然后附加到canvas上绘制，
   * 最后从canvas.captureStream()获取stream附加到video上播放
   *
   * 相比起 {@link DocPIPRenderType.capture_captureStream capture_captureStream} 模式，在高帧率视频下不会掉帧
   *
   * 该模式下，可以使用在目标video在同源的iframe中
   * */
  capture_captureStreamWithCanvas = 'reactVP_canvasCs',
  /**
   * 直接把网页的videoEl标签搬到播放器中，性能和效果最佳
   *
   * *目前默认使用*
   *
   * 该模式下没法使用在目标video在同源的iframe中，需要切换成其他模式
   *  */
  replaceVideoEl = 'reactVP_webVideo',

  /**
   * 使用video.captureStream()获取stream，然后附加到video上播放
   *
   * *之前发现该模式下存在掉帧问题，建议使用 {@link DocPIPRenderType.capture_captureStreamWithCanvas capture_captureStreamWithCanvas}*
   */
  capture_captureStream = 'capture_captureStream',
  /**
   * 在子iframe里获取video.captureStream()的stream，然后通过webRTC发送到主页面中
   *
   * 该模式是针对目标video不在同源iframe中设计的
   */
  capture_captureStreamWithWebRTC = 'capture_captureStreamWithWebRTC',
  /**
   * 使用 {@link navigator.mediaDevices.getDisplayMedia getDisplayMedia} + {@link window.CropTarget CropTarget} 来获取stream和剪切范围，
   * 这个需要chrome 104+才支持，其他浏览器都不支持
   *
   * *该模式有缺陷，因为是录制tab的，该tab就没法动了*
   *
   * 该模式是针对目标video不在同源iframe中设计的
   */
  capture_displayMediaWithCropTarget = 'capture_displayMedia',
  /**
   * 该模式需要`chrome://flags/#element-capture`开启，{@link https://developer.chrome.com/docs/web-platform/element-capture developer.chrome文章}
   *
   * 与 {@link DocPIPRenderType.capture_displayMediaWithCropTarget capture_displayMediaWithCropTarget} 类似，但裁剪方案由 {@link window.CropTarget CropTarget} 改成了 {@link window.RestrictionTarget RestrictionTarget}。这个不会录制到视频的其他元素，例如源播放器的控制器。但目前体验下来性能很差，且看上去不支持iframe中的视频
   *
   * 和 {@link DocPIPRenderType.capture_displayMediaWithCropTarget capture_displayMediaWithCropTarget} 一样，因为是录制tab的，该tab就没法动了
   */
  capture_displayMediaWithRestrictionTarget = 'capture_displayMediaWithRestrictionTarget',
  /**
   * TODO: 使用 {@link chrome.tabCapture.getMediaStreamId getMediaStreamId} 来获取stream，
   * 然后附加到canvas上绘制+裁剪位置，最后从canvas.captureStream()获取stream附加到video上播放
   *
   * *该模式有缺陷，因为是录制tab的，该tab就没法动了*
   *
   * 该模式是针对目标video不在同源iframe中设计的
   */
  capture_tabCapture = 'capture_tabCapture',
  /**
   * TODO: 注入MediaSource模式
   *
   * 该模式是针对目标video不在同源iframe中设计的
   */
  injectMediaSource = 'injectMediaSource',

  replaceWebVideoDom = 'replaceWebVideoDom',
}

export enum Position {
  default = 'default',
  topLeft = 'topLeft',
  topRight = 'topRight',
  bottomLeft = 'bottomLeft',
  bottomRight = 'bottomRight',
}
