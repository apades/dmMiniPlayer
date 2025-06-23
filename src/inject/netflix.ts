import { dq1, tryCatch } from '@root/utils'
import { Rec } from '@root/utils/typeUtils'

function main() {
  if (!location.href.startsWith('https://www.netflix.com/')) return

  let subCache = {} as Rec

  window.subCache = subCache

  function inject() {
    const MANIFEST_PATTERN = new RegExp('manifest|licensedManifest')
    const forceSubs = localStorage.getItem('NSD_force-all-lang') !== 'false'
    const prefLocale = localStorage.getItem('NSD_pref-locale') || ''

    // hide the menu when we go back to the browse list
    window.addEventListener('popstate', () => {
      const display =
        document.location.pathname.split('/')[1] === 'watch' ? '' : 'none'

      console.log('display', display)
    })

    // hijack JSON.parse and JSON.stringify functions
    ;((parse, stringify, open, realFetch) => {
      const SUB_TYPES = {
        subtitles: '',
        closedcaptions: '[cc]',
      } as Rec

      const WEBVTT = 'webvtt-lssdh-ios8'
      const DFXP = 'dfxp-ls-sdh'
      const SIMPLE = 'simplesdh'
      const IMSC1_1 = 'imsc1.1'
      const EXTENSIONS = {
        [WEBVTT]: 'vtt',
        [DFXP]: 'dfxp',
        [SIMPLE]: 'xml',
        [IMSC1_1]: 'xml',
      } as Rec

      const ALL_FORMATS = [IMSC1_1, DFXP, WEBVTT, SIMPLE]

      function resolveSubs(result: any) {
        console.log('resolveSubs')

        const tracks = result.timedtexttracks
        const subs = {} as Rec

        let reportError = true
        for (const track of tracks) {
          if (track.isNoneTrack) continue

          let type = SUB_TYPES[track.rawTrackType]
          if (typeof type === 'undefined') type = `[${track.rawTrackType}]`
          const variant =
            typeof track.trackVariant === 'undefined'
              ? ''
              : `-${track.trackVariant}`
          const lang =
            track.language +
            type +
            variant +
            (track.isForcedNarrative ? '-forced' : '')

          const formats = {} as Rec
          for (let format of ALL_FORMATS) {
            const downloadables = track.ttDownloadables[format]
            if (typeof downloadables !== 'undefined') {
              let urls
              if (typeof downloadables.downloadUrls !== 'undefined')
                urls = Object.values(downloadables.downloadUrls)
              else if (typeof downloadables.urls !== 'undefined')
                urls = downloadables.urls.map(({ url }: any) => url)
              else {
                console.log('processSubInfo:', lang, Object.keys(downloadables))
                if (reportError) {
                  reportError = false
                  alert(
                    "Can't find subtitle URL, check the console for more information!",
                  )
                }
                continue
              }
              formats[format] = [urls, EXTENSIONS[format]]
            }
          }

          if (Object.keys(formats).length > 0) {
            for (let i = 0; ; ++i) {
              const langKey = lang + (i == 0 ? '' : `-${i}`)
              if (typeof subs[langKey] === 'undefined') {
                subs[langKey] = formats
                break
              }
            }
          }
        }
        subCache[result.movieId] = subs
      }

      JSON.parse = function (text) {
        const data = parse(text)

        if (
          data &&
          data.result &&
          data.result.timedtexttracks &&
          data.result.movieId
        ) {
          const [err] = tryCatch(() => resolveSubs(data.result))
          if (err) {
            console.log('err', err)
          }
        }
        return data
      }

      JSON.stringify = function (data: Record<any, any>) {
        /*{
          let text = stringify(data);
          if (text.includes('dfxp-ls-sdh'))
            console.log(text, data);
        }*/

        if (
          data &&
          typeof data.url === 'string' &&
          data.url.search(MANIFEST_PATTERN) > -1
        ) {
          for (let v of Object.values(data)) {
            try {
              if (v.profiles) {
                for (const profile_name of ALL_FORMATS) {
                  if (!v.profiles.includes(profile_name)) {
                    v.profiles.unshift(profile_name)
                  }
                }
              }
              if (v.showAllSubDubTracks != null && forceSubs)
                v.showAllSubDubTracks = true
              if (prefLocale !== '') v.preferredTextLocale = prefLocale
            } catch (e) {
              if (e instanceof TypeError) continue
              else throw e
            }
          }
        }
        if (data && typeof data.movieId === 'number') {
          try {
            let videoId = data.params.sessionParams.uiplaycontext.video_id
            if (typeof videoId === 'number' && videoId !== data.movieId) {
              window.dispatchEvent(
                new CustomEvent('netflix_sub_downloader_data', {
                  detail: {
                    type: 'id_override',
                    data: [videoId, data.movieId],
                  },
                }),
              )
            }
          } catch (ignore) {}
        }
        return stringify(data)
      }

      XMLHttpRequest.prototype.open = function (this: any, ...args: any[]) {
        if (args[1] && args[1].toString().includes('/metadata?'))
          this.addEventListener(
            'load',
            async () => {
              let data = this.response
              if (data instanceof Blob) data = JSON.parse(await data.text())
              else if (typeof data === 'string') data = JSON.parse(data)

              window.dispatchEvent(
                new CustomEvent('netflix_sub_downloader_data', {
                  detail: { type: 'metadata', data: data },
                }),
              )
            },
            false,
          )
          // eslint-disable-next-line prefer-rest-params
        ;(open as any).apply(this, arguments)
      }

      window.fetch = async (...args) => {
        const response = realFetch(...args)
        if (args[0] && args[0].toString().includes('/metadata?')) {
          const copied = (await response).clone()
          const data = await copied.json()

          window.dispatchEvent(
            new CustomEvent('netflix_sub_downloader_data', {
              detail: { type: 'metadata', data: data },
            }),
          )
        }
        return response
      }
    })(JSON.parse, JSON.stringify, XMLHttpRequest.prototype.open, window.fetch)
  }

  inject()
}

main()
