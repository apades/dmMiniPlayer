// 主窗口WebRtc_呼叫
class CallWindowWebRtc {
  // 广播通道
  curBroadcas: BroadcastChannel
  // webRtc点对点连接
  peerConnection: RTCPeerConnection
  // 广播通道
  constructor({ broadcastChannelName = 'yyh_text' }) {
    this.curBroadcas = CreateBroadcastChannel(broadcastChannelName)
    this.curBroadcas.onmessage = (event) => this.onMessage(event)
    // 处理页面刷新和关闭方法
    this.handlePageRefreshClose()
  }

  // 接收消息
  onMessage(event: any) {
    const msg = event.data

    // 收到远端接听消息
    if (msg.type === 'answer') {
      this.handleSedRemoteSDP(msg)
    }
    if (msg.type === 'hangup') {
      this.hangup()
    }
  }
  // 发送消息_方法
  postMessage(msg: any) {
    this.curBroadcas.postMessage(msg)
  }
  // 处理页面刷新和关闭方法
  handlePageRefreshClose() {
    window.addEventListener('beforeunload', () => {
      this.postMessage({
        data: { event: 'mainPageRefresh', eventName: '主页面刷新了' },
      })
    })
    window.addEventListener('beforeunload', () => {
      this.postMessage({
        data: { event: 'mainPageClose', eventName: '主页面关闭了' },
      })
    })
  }
  // 处理媒体停止
  handleStreamStop() {
    if (!this.peerConnection) {
      return
    }
    let localStream = this.peerConnection.getSenders()
    localStream.forEach((item: any) => {
      item.track.stop()
    })
  }
  // 卸载
  unmount() {
    if (this.peerConnection) {
      let localStream = this.peerConnection.getSenders()
      localStream.forEach((item: any) => {
        item.track.stop()
      })
      this.peerConnection.close()
      this.peerConnection.onicecandidate = null
      this.peerConnection.ontrack = null
      this.peerConnection.oniceconnectionstatechange = null
      this.peerConnection = null
    }
    if (this.curBroadcas) {
      this.curBroadcas.onmessage = null
      this.curBroadcas = null
    }
  }
  // ICE连接状态回调
  handleOniceconnectionstatechange(event) {
    // 1.检查网络配置
    if (this.peerConnection.iceConnectionState === 'checking') {
      // 发送订阅消息_给外部
      this.onSubscriptionMsg({
        event: 'iceConnectionState',
        code: 'checking',
        eventName: '检查网络配置',
      })
      // 2.ICE候选者被交换并成功建立了数据传输通道
    } else if (this.peerConnection.iceConnectionState === 'connected') {
      // 发送订阅消息_给外部
      this.onSubscriptionMsg({
        event: 'iceConnectionState',
        code: 'connected',
        eventName: 'ICE候选者被交换并成功建立了数据传输通道',
      })
      // 3.当连接被关闭或由于某种原因（如网络故障、对端关闭连接等）中断时
    } else if (this.peerConnection.iceConnectionState === 'disconnected') {
      this.hangup()
      this.onSubscriptionMsg({
        event: 'iceConnectionState',
        code: 'connected',
        eventName: 'ICE接被关闭或由于某种原因断开',
      })
    }
  }
  // 发送订阅消息给外部
  onSubscriptionMsg(msg: {}) {}
  // 创建全新的 RTCPeerConnection
  handleCreateNewPerrc() {
    // 停止媒体
    this.handleStreamStop()
    // 最好每一次通话都单独创建一个RTCPeerConnection对象,防止复用导致ICE候选的收集受到之前连接的影响,导致画面延迟加载,或其它异常问题无法排查处理;
    this.peerConnection = new RTCPeerConnection()
    this.peerConnection.onicecandidate = (event) => this.onIcecandidate(event)
    this.peerConnection.ontrack = (event) => this.handleOnTrack(event)
    this.peerConnection.oniceconnectionstatechange = (event) =>
      this.handleOniceconnectionstatechange(event)
  }
  // 呼叫
  call(stream?: MediaStream) {
    return new Promise((resolve, reject) => {
      this.handleCreateNewPerrc()
      this.handleStreamAddPeerConnection(stream)
      this.handleCreateOffer()
        .then((offer) => {
          // 存入本地offer
          this.handleLocalDes(offer)
            .then(() => {
              // 给远端发sdp
              this.handleSendSDP()
              resolve({ code: 1, message: '发送sdp给远端' })
            })
            .catch(() => {
              reject({ code: 0, message: '存入本地offer失败' })
            })
        })
        .catch(() => {
          reject({ code: 0, message: '创建offer失败' })
        })
    })
  }
  // 挂断
  hangup() {
    if (!this.peerConnection) {
      return
    }
    if (this.peerConnection.signalingState === 'closed') {
      return
    }
    this.postMessage({ type: 'hangup' })
    // 停止媒体流
    let localStream = this.peerConnection.getSenders()
    localStream.forEach((item: any) => {
      item.track.stop()
    })
    // 关闭peerConection
    this.peerConnection.close()
  }
  // 1.获取本地媒体流
  getUserMediaToStream(audio: true, video: true) {
    return navigator.mediaDevices.getUserMedia({ audio, video })
  }
  // 2.把媒体流轨道添加到 this.peerConnection 中
  handleStreamAddPeerConnection(stream?: MediaStream) {
    if (!stream) {
      stream = new MediaStream()
    }
    const tmpStream = new MediaStream()
    const audioTracks = stream.getAudioTracks()
    const videoTracks = stream.getVideoTracks()
    if (audioTracks.length) {
      tmpStream.addTrack(audioTracks[0])
      this.peerConnection.addTrack(tmpStream.getAudioTracks()[0], tmpStream)
    }
    if (videoTracks.length) {
      tmpStream.addTrack(videoTracks[0])
      this.peerConnection.addTrack(tmpStream.getVideoTracks()[0], tmpStream)
    }
  }
  // 3.创建createOffer
  handleCreateOffer() {
    return this.peerConnection.createOffer()
  }
  // 4.设置本地SDP描述
  handleLocalDes(offer) {
    return this.peerConnection.setLocalDescription(offer)
  }
  // 5.发送SDP消息给远端
  handleSendSDP() {
    if (this.peerConnection.signalingState === 'have-local-offer') {
      // 使用某种方式将offer传递给窗口B
      const answerData = {
        type: this.peerConnection.localDescription.type,
        sdp: this.peerConnection.localDescription.sdp,
      }
      this.curBroadcas.postMessage(answerData)
    }
  }
  // 6.收到远端接听_存远端SDP
  handleSedRemoteSDP(msg: any) {
    // if (this.peerConnection.signalingState === 'stable') { return; }
    const answerData = msg
    const answer = new RTCSessionDescription(answerData)
    return this.peerConnection.setRemoteDescription(answer)
  }
  // 7.用于处理ICE
  onIcecandidate(event) {
    // 如果event.candidate存在，说明有一个新的ICE候选地址产生了
    if (event.candidate) {
      // 将ICE候选地址, 通常需要通过信令服务器发送给对端
      this.curBroadcas.postMessage({
        type: 'candidate',
        candidate: JSON.stringify(event.candidate),
      })
    } else {
      // 如果event.candidate不存在，则表示所有候选地址都已经收集完毕
      // 在某些情况下，这可能意味着ICE候选过程已完成，但并非总是如此
      // 因为在某些情况下，会有多轮ICE候选生成
    }
  }
  // 8.监听轨道赋值给video标签onTrack
  handleOnTrack(event: any) {
    let remoteStream = event.streams[0]
    // 发送订阅消息_给外部
    this.onSubscriptionMsg({
      event: 'remoteStreams',
      eventName: '远端视频准备好了',
      remoteStream,
    })
  }
}
