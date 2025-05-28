function search(obj, toSearch, keys = [], rs = []) {
  for (const key in obj) {
    const val = obj[key]
    if (typeof val === 'object') {
      search(val, toSearch, [...keys, key])
    }
    if (typeof val === 'string' || typeof val === 'number') {
      if ((val + '').includes(toSearch))
        console.log(`🔍 ${[...keys, key].join('.')}: ${val}`)
    }
  }
}

function get(tar, key, defaultVal) {
  const keyArr = key.split('.')
  let val = tar
  while (keyArr.length) {
    const key = keyArr.shift()
    if (typeof val[key] === 'undefined') return defaultVal
    val = val[key]
  }
  return val
}
