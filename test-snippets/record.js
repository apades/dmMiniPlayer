let stream = await navigator.mediaDevices.getDisplayMedia({
  preferCurrentTab: true,
})
let cropTarget = await CropTarget.fromElement(target)
console.log('cropTarget', cropTarget)

let [track] = stream.getVideoTracks()
await track.cropTo(cropTarget)

let videoEl = document.createElement('video')
videoEl.style =
  'position: fixed; top: 0; left: 0; width: 300px; height: 300px; z-index: 999999999;'
document.body.appendChild(videoEl)
videoEl.srcObject = stream
videoEl.play()

window.addEventListener('message', (e) => {
  console.log('message', e.data)
})

top.postMessage({ type: 'start' }, '*')
