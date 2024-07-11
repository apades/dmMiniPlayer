export const manifest: chrome.runtime.ManifestV3 = {
  name: '__MSG_appName__',
  description: '__MSG_appDesc__',
  author: 'apades',
  manifest_version: 3,
  version: '0.4.6',
  icons: {
    '16': 'assets/icon16.png',
    '32': 'assets/icon32.png',
    '48': 'assets/icon48.png',
    '64': 'assets/icon64.png',
    '128': 'assets/icon128.png',
  },
  action: {
    default_icon: {
      '16': 'assets/icon16.png',
      '32': 'assets/icon32.png',
      '48': 'assets/icon48.png',
      '64': 'assets/icon64.png',
      '128': 'assets/icon128.png',
    },
    default_popup: 'popup.html',
  },
  host_permissions: ['<all_urls>'],
  permissions: ['storage', 'scripting'],
  background: {
    service_worker: 'background.mjs',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['assets/lib/entry-all-frames.mjs'],
      run_at: 'document_end',
      all_frames: true,
    },
    {
      matches: ['<all_urls>'],
      js: ['assets/lib/entry-main.mjs'],
      run_at: 'document_end',
    },
  ],
  default_locale: 'en',
  web_accessible_resources: [
    {
      resources: ['assets/**/*'],
      matches: ['<all_urls>'],
    },
    {
      resources: ['assets/*'],
      matches: ['<all_urls>'],
    },
  ],
  commands: {
    back: {
      suggested_key: {
        default: 'Alt+Shift+Comma',
        windows: 'Alt+Shift+Comma',
        mac: 'Command+Shift+Left',
      },
      description: '__MSG_back__',
    },
    forward: {
      suggested_key: {
        default: 'Alt+Shift+Period',
        windows: 'Alt+Shift+Period',
        mac: 'Command+Shift+Right',
      },
      description: '__MSG_forward__',
    },
    'pause/play': {
      suggested_key: {
        default: 'Alt+Shift+M',
        windows: 'Alt+Shift+M',
        mac: 'Command+Shift+Space',
      },
      description: '__MSG_playOrPause__',
    },
    hide: {
      suggested_key: {
        default: 'Alt+Shift+H',
        windows: 'Alt+Shift+H',
        mac: 'Command+Shift+H',
      },
      description: '__MSG_hide__',
    },
    playbackRate: {
      description: '__MSG_playbackRate__',
    },
  },
}
