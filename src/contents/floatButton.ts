import { createElement, getTopWindow, throttle } from '@root/utils'
import type { PlasmoCSConfig } from 'plasmo'
import Browser from 'webextension-polyfill'
import './floatButton.less'

import { getTopParentsWithSameRect } from '@root/utils/dom'

export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
  run_at: 'document_end',
  all_frames: true,
}
const INIT_ATTR = 'rc-f-init'
function initVideoFloatBtn(
  container: HTMLElement,
  vel: HTMLVideoElement
): void {
  if (container.getAttribute(INIT_ATTR) === 'true') return
  let timmer: NodeJS.Timeout = null

  let floatBtn = createElement('div', {
    className: 'rc-float-btn f-i-center',
    innerHTML: `<div><img src="${Browser.runtime.getURL(
      '/assets/icon.png'
    )}"/></div>`,
    onclick: (e) => {
      e.stopPropagation()
      const videoEl =
        container instanceof HTMLVideoElement
          ? container
          : container.querySelector('video')

      console.log('videoEl', videoEl, container)
      const event = new CustomEvent('inject-response', {
        detail: {
          type: 'start-PIP',
          data: {
            videoEl,
          },
        },
      })
      getTopWindow().dispatchEvent(event)
    },
    onmouseenter: () => {
      timmer && clearTimeout(timmer)
      floatBtn.classList.remove('hidden')
    },
  })
  const settingBtn = createElement('div', {
    className: 'setting-btn',
    onclick: (e) => {
      e.preventDefault()
      e.stopPropagation()
      getTopWindow().openSettingPanel()
    },
    innerHTML:
      '<svg t="1693471248158" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2500" width="16" height="16"><path d="M508.472 383.852c67.346 0 122.15 54.805 122.15 122.15s-54.804 122.15-122.15 122.15-122.15-54.805-122.15-122.15 54.805-122.15 122.15-122.15m0-54.289c-97.448 0-176.439 78.99-176.439 176.44s78.99 176.438 176.44 176.438 176.438-78.99 176.438-176.439-78.99-176.439-176.439-176.439m436.186 284.16c7.758-33.082 11.71-67.147 11.71-101.722 0-34.575-3.952-68.64-11.71-101.722-3.425-14.602-18.038-23.664-32.64-20.24-14.603 3.425-23.665 18.039-20.24 32.641 6.806 29.024 10.276 58.927 10.276 89.321s-3.47 60.297-10.276 89.32c-3.425 14.603 5.637 29.217 20.24 32.641 14.602 3.425 29.215-5.637 32.64-20.24z m-32.086 20.848c1.718 0 3.155 0.026 4.466 0.083 14.985 0.652 27.66-10.967 28.312-25.952 0.651-14.984-10.968-27.66-25.952-28.311a155.244 155.244 0 0 0-6.826-0.134c-14.999 0-27.157 12.158-27.157 27.157 0 14.998 12.158 27.157 27.157 27.157z m-88.67 163.374c-11.086-17.03-17.072-36.87-17.072-57.632 0-58.4 47.342-105.742 105.742-105.742 14.998 0 27.157-12.159 27.157-27.157 0-14.999-12.159-27.158-27.157-27.158-88.397 0-160.057 71.66-160.057 160.057 0 31.37 9.088 61.489 25.87 87.265 8.183 12.57 25.006 16.126 37.576 7.942 12.57-8.183 16.125-25.006 7.942-37.575z m-183.785 139.66c67.576-20.297 129.146-56.495 179.854-105.271 10.809-10.398 11.143-27.59 0.745-38.4s-27.59-11.142-38.4-0.744c-44.525 42.83-98.555 74.595-157.823 92.395-14.364 4.314-22.512 19.457-18.197 33.821 4.314 14.365 19.456 22.512 33.821 18.198z m-223.82-14.449c17.308-36.785 54.332-60.762 95.704-60.762 41.38 0 78.426 23.984 95.731 60.762 6.386 13.572 22.564 19.397 36.135 13.012 13.572-6.386 19.397-22.564 13.012-36.135C630.696 844.386 574.615 808.08 512 808.08c-62.61 0-118.666 36.302-144.85 91.953-6.386 13.57-0.56 29.75 13.01 36.135 13.572 6.385 29.75 0.56 36.136-13.012zM205.25 833.495c50.49 48.178 111.615 83.952 178.655 104.107 14.364 4.318 29.508-3.825 33.826-18.189 4.319-14.363-3.825-29.508-18.188-33.826-58.81-17.68-112.458-49.078-156.796-91.387-10.851-10.354-28.041-9.952-38.396 0.9s-9.952 28.04 0.9 38.395zM113.276 634.57c58.4 0 105.742 47.342 105.742 105.742 0 21.123-6.193 41.291-17.634 58.497-8.304 12.49-4.912 29.347 7.577 37.652 12.49 8.304 29.347 4.912 37.652-7.577 17.32-26.047 26.72-56.662 26.72-88.572 0-88.397-71.66-160.056-160.057-160.056-14.998 0-27.157 12.159-27.157 27.157s12.159 27.157 27.157 27.157z m-5.974 0.15c1.83-0.101 3.809-0.15 5.974-0.15 14.999 0 27.158-12.159 27.158-27.157 0-14.999-12.16-27.158-27.158-27.158-3.112 0-6.073 0.073-8.954 0.231-14.976 0.823-26.45 13.63-25.627 28.607 0.823 14.976 13.63 26.45 28.607 25.626zM79.37 410.202c-7.77 33.163-11.736 67.251-11.736 101.798S71.6 580.636 79.37 613.8c3.422 14.603 18.034 23.667 32.637 20.246 14.603-3.422 23.667-18.034 20.246-32.637-6.822-29.115-10.305-59.046-10.305-89.407 0-30.361 3.483-60.292 10.305-89.407 3.422-14.603-5.643-29.215-20.246-32.637-14.603-3.421-29.215 5.643-32.637 20.246z m33.906-20.772c-2.165 0-4.144-0.049-5.974-0.15-14.977-0.822-27.784 10.651-28.607 25.627-0.823 14.976 10.65 27.784 25.627 28.607 2.88 0.158 5.842 0.23 8.954 0.23 14.999 0 27.158-12.158 27.158-27.157 0-14.998-12.16-27.157-27.158-27.157z m88.108-164.239c11.443 17.208 17.634 37.377 17.634 58.524 0 58.393-47.335 105.715-105.742 105.715-14.998 0-27.157 12.159-27.157 27.157 0 14.999 12.159 27.158 27.157 27.158 88.401 0 160.057-71.636 160.057-160.03 0-31.933-9.398-62.548-26.72-88.598-8.305-12.49-25.162-15.882-37.652-7.577s-15.881 25.162-7.577 37.651zM383.905 86.4c-67.04 20.155-128.166 55.93-178.655 104.107-10.85 10.355-11.253 27.545-0.899 38.396 10.355 10.851 27.545 11.254 38.396 0.9 44.338-42.31 97.986-73.708 156.796-91.388 14.363-4.318 22.507-19.463 18.188-33.826-4.318-14.364-19.462-22.507-33.826-18.189z m223.827 14.446c-17.303 36.775-54.348 60.762-95.704 60.762-41.396 0-78.421-23.974-95.73-60.762-6.386-13.572-22.565-19.397-36.136-13.011-13.571 6.385-19.397 22.564-13.01 36.135 26.186 55.654 82.244 91.952 144.877 91.952 62.59 0 118.67-36.31 144.85-91.952 6.385-13.572 0.56-29.75-13.011-36.135-13.572-6.386-29.75-0.56-36.136 13.01z m212.233 90.817c-50.705-48.745-112.27-84.94-179.838-105.262-14.363-4.32-29.508 3.822-33.828 18.185s3.822 29.508 18.185 33.828c59.273 17.827 113.31 49.596 157.839 92.404 10.812 10.395 28.004 10.056 38.399-0.757s10.055-28.004-0.757-38.398z m92.607 197.768c-58.407 0-105.742-47.322-105.742-105.715 0-20.786 5.985-40.627 17.073-57.658 8.183-12.57 4.627-29.393-7.942-37.576-12.57-8.184-29.393-4.628-37.576 7.942-16.784 25.78-25.87 55.9-25.87 87.292 0 88.394 71.656 160.03 160.057 160.03 14.998 0 27.157-12.159 27.157-27.158 0-14.998-12.159-27.157-27.157-27.157z m4.466-0.083c-1.31 0.057-2.748 0.083-4.466 0.083-14.999 0-27.157 12.159-27.157 27.158 0 14.998 12.158 27.157 27.157 27.157 2.451 0 4.652-0.04 6.825-0.134 14.985-0.652 26.604-13.327 25.952-28.312-0.651-14.984-13.326-26.603-28.31-25.952z" p-id="2501" fill="currentColor"></path></svg>',
  })
  floatBtn.appendChild(settingBtn)
  try {
    if (container == vel) container.parentElement.appendChild(floatBtn)
    else container.appendChild(floatBtn)
  } catch (error) {
    console.error('Wrong in append parent', error)
    return
  }
  container.setAttribute(INIT_ATTR, 'true')

  container.addEventListener('mousemove', () => {
    floatBtn.classList.remove('hidden')
    timmer && clearTimeout(timmer)
    timmer = setTimeout(() => {
      floatBtn.classList.add('hidden')
    }, 2000)
  })
  container.addEventListener('mouseleave', () => {
    floatBtn.classList.add('hidden')
    timmer && clearTimeout(timmer)
  })
}

let handleMousemove = throttle((e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target instanceof HTMLVideoElement)
    return initVideoFloatBtn(target, target)
  const topParents = getTopParentsWithSameRect(target)
  const topParentWithPosition =
    topParents.findLast(
      (el) => (el.computedStyleMap().get('position') as any).value != 'static'
    ) ?? topParents[topParents.length - 1]

  if (topParentWithPosition instanceof HTMLVideoElement)
    return initVideoFloatBtn(topParentWithPosition, topParentWithPosition)
  const video = topParentWithPosition?.querySelector?.('video')
  if (video) initVideoFloatBtn(topParentWithPosition, video)
}, 1000)
window.addEventListener('mousemove', handleMousemove)
