const env = {
  upgrade_en: (process.env.upgrade_en ?? '').replace('\\n', '\n'),
  upgrade_zh: (process.env.upgrade_zh ?? '').replace('\\n', '\n'),
  version: process.env.version!,
}

export default env
