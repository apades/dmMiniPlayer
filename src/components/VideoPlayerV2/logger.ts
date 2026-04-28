import logger from '@pkgs/logger/ext'

export const videoPlayerLogger = logger.namespace('video-player')

export function logVideoPlayerAction(...parts: unknown[]) {
  logger.userAction('video-player', ...parts)
}
