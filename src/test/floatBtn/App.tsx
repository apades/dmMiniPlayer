import '@root/contents/floatButton'

export default function App() {
  return (
    <div>
      <button>asdf</button>
      <video
        id="my-video"
        className="video-js"
        controls
        preload="auto"
        width="640"
        height="264"
        data-setup="{}"
      >
        <source src="../sample-mp4-file.mp4" type="video/mp4" />
        <p className="vjs-no-js">
          To view this video please enable JavaScript, and consider upgrading to
          a web browser that
          <a href="https://videojs.com/html5-video-support/" target="_blank">
            supports HTML5 video
          </a>
        </p>
      </video>

      <div className="mt-8">
        <video src="../sample-mp4-file.mp4" />
      </div>
    </div>
  )
}
