export interface Line {
  id: string
  startTime: string
  startSeconds: number
  endTime: string
  endSeconds: number
  text: string
}

class Parser {
  seperator = ','

  timestampToSeconds(srtTimestamp: string) {
    const [rest, millisecondsString] = srtTimestamp.split(',')
    const milliseconds = parseInt(millisecondsString)
    const [hours, minutes, seconds] = rest.split(':').map((x) => parseInt(x))
    const result = milliseconds * 0.001 + seconds + 60 * minutes + 3600 * hours

    // fix odd JS roundings, e.g. timestamp '00:01:20,460' result is 80.46000000000001
    return Math.round(result * 1000) / 1000
  }

  correctFormat(time: string) {
    // Fix the format if the format is wrong
    // 00:00:28.9670 Become 00:00:28,967
    // 00:00:28.967  Become 00:00:28,967
    // 00:00:28.96   Become 00:00:28,960
    // 00:00:28.9    Become 00:00:28,900

    // 00:00:28,96   Become 00:00:28,960
    // 00:00:28,9    Become 00:00:28,900
    // 00:00:28,0    Become 00:00:28,000
    // 00:00:28,01   Become 00:00:28,010
    // 0:00:10,500   Become 00:00:10,500
    let str = time.replace('.', ',')

    var hour = null
    var minute = null
    var second = null
    var millisecond = null

    // Handle millisecond
    var [front, ms] = str.split(',')
    millisecond = this.fixed_str_digit(3, ms)

    // Handle hour
    var [a_hour, a_minute, a_second] = front.split(':')
    hour = this.fixed_str_digit(2, a_hour, false)
    minute = this.fixed_str_digit(2, a_minute, false)
    second = this.fixed_str_digit(2, a_second, false)

    return `${hour}:${minute}:${second},${millisecond}`
  }

  /*
    // make sure string is 'how_many_digit' long
    // if str is shorter than how_many_digit, pad with 0
    // if str is longer than how_many_digit, slice from the beginning
    // Example:
  
    Input: fixed_str_digit(3, '100')
    Output: 100
    Explain: unchanged, because "100" is 3 digit
  
    Input: fixed_str_digit(3, '50')
    Output: 500
    Explain: pad end with 0
  
    Input: fixed_str_digit(3, '50', false)
    Output: 050
    Explain: pad start with 0
  
    Input: fixed_str_digit(3, '7771')
    Output: 777
    Explain: slice from beginning
    */
  private fixed_str_digit(how_many_digit: number, str: string, padEnd = true) {
    if (str.length == how_many_digit) {
      return str
    }
    if (str.length > how_many_digit) {
      return str.slice(0, how_many_digit)
    }
    if (str.length < how_many_digit) {
      if (padEnd) {
        return str.padEnd(how_many_digit, '0')
      } else {
        return str.padStart(how_many_digit, '0')
      }
    }
  }

  private tryComma(data: string) {
    data = data.replace(/\r/g, '')
    var regex =
      /(\d+)\n(\d{1,2}:\d{2}:\d{2},\d{1,3}) --> (\d{1,2}:\d{2}:\d{2},\d{1,3})/g
    let data_array = data.split(regex)
    data_array.shift() // remove first '' in array
    return data_array
  }

  private tryDot(data: string) {
    data = data.replace(/\r/g, '')
    var regex =
      /(\d+)\n(\d{1,2}:\d{2}:\d{2}\.\d{1,3}) --> (\d{1,2}:\d{2}:\d{2}\.\d{1,3})/g
    let data_array = data.split(regex)
    data_array.shift() // remove first '' in array
    this.seperator = '.'
    return data_array
  }

  fromSrt(data: string) {
    var originalData = data
    var data_array = this.tryComma(originalData)
    if (data_array.length == 0) {
      data_array = this.tryDot(originalData)
    }

    var items = []
    for (var i = 0; i < data_array.length; i += 4) {
      const startTime = this.correctFormat(data_array[i + 1].trim())
      const endTime = this.correctFormat(data_array[i + 2].trim())
      var new_line = {
        id: data_array[i].trim(),
        startTime,
        startSeconds: this.timestampToSeconds(startTime),
        endTime,
        endSeconds: this.timestampToSeconds(endTime),
        text: data_array[i + 3].trim(),
      }
      items.push(new_line)
    }

    return items
  }

  toSrt(data: Array<Line>) {
    var res = ''

    const end_of_line = '\r\n'
    for (var i = 0; i < data.length; i++) {
      var s = data[i]
      res += s.id + end_of_line
      res += s.startTime + ' --> ' + s.endTime + end_of_line
      res += s.text.replace('\n', end_of_line) + end_of_line + end_of_line
    }

    return res
  }
}

export default Parser
