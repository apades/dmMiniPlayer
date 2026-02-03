/**
 * DOM-based subtitle manager for YouTube
 * Migrates YouTube's native caption container to PiP window
 * Based on 1.0.6_0 extension implementation
 */

const YOUTUBE_CAPTION_SELECTOR = '.ytp-caption-window-container'
const YOUTUBE_PLAYER_SELECTOR = '.html5-video-player'

/**
 * CSS styles for YouTube captions in PiP window
 */
const PIP_CAPTION_STYLES = `
  .ytp-caption-window-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    pointer-events: none;
  }

  .caption-window {
    position: absolute;
    line-height: normal;
    z-index: 40;
    pointer-events: auto;
    cursor: move;
    cursor: -webkit-grab;
    cursor: grab;
    -moz-user-select: none;
    -ms-user-select: none;
    -webkit-user-select: none;
  }

  body:hover .caption-window.ytp-caption-window-bottom {
    margin-bottom: 49px;
    overflow-wrap: normal;
    display: block;
  }

  .ytp-caption-segment {
    font-size: max(3.2vw, 13px) !important;
  }
`

export class DomSubtitleManager {
    private captionContainer: HTMLElement | null = null
    private originalParent: HTMLElement | null = null
    private styleElement: HTMLStyleElement | null = null
    private isActive = false

    /**
     * Initialize the DOM subtitle manager
     */
    init() {
        this.captionContainer = null
        this.originalParent = null
        this.isActive = false
    }

    /**
     * Enter PiP mode - move caption container to PiP window
     */
    enterPiP(pipWindow: Window, pipContainer: HTMLElement) {
        if (this.isActive) return

        // Find YouTube caption container
        this.captionContainer = document.querySelector(YOUTUBE_CAPTION_SELECTOR)
        if (!this.captionContainer) {
            console.log('[DomSubtitleManager] No caption container found')
            return
        }

        // Store original parent for restoration
        this.originalParent = this.captionContainer.parentElement

        // Add styles to PiP window
        this.styleElement = pipWindow.document.createElement('style')
        this.styleElement.textContent = PIP_CAPTION_STYLES
        pipWindow.document.head.appendChild(this.styleElement)

        // Move caption container to PiP
        pipContainer.appendChild(this.captionContainer)
        this.isActive = true

        console.log('[DomSubtitleManager] Caption container moved to PiP')
    }

    /**
     * Exit PiP mode - restore caption container to original position
     */
    exitPiP() {
        if (!this.isActive || !this.captionContainer) return

        // Restore caption container to original parent
        if (this.originalParent) {
            this.originalParent.appendChild(this.captionContainer)
        } else {
            // Fallback: find YouTube player and append there
            const player = document.querySelector(YOUTUBE_PLAYER_SELECTOR)
            if (player) {
                player.appendChild(this.captionContainer)
            }
        }

        // Clean up style element
        if (this.styleElement) {
            this.styleElement.remove()
            this.styleElement = null
        }

        this.isActive = false
        this.captionContainer = null
        this.originalParent = null

        console.log('[DomSubtitleManager] Caption container restored')
    }

    /**
     * Check if DOM subtitle mode is active
     */
    getIsActive() {
        return this.isActive
    }

    /**
     * Unload and cleanup
     */
    unload() {
        this.exitPiP()
    }
}

export default DomSubtitleManager
