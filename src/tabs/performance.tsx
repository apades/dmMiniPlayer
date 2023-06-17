import { listen as portListen, getPort } from '@plasmohq/messaging/port'
// import { getPort } from '@plasmohq/messaging/background'
import { useOnce } from '@root/hook'
import { FC, useRef } from 'react'
import * as eCharts from 'echarts'
import { ECOption } from '@root/utils/echarts'

const Page_performance: FC = (props) => {
  const chartContainerRef = useRef<HTMLDivElement>()
  useOnce(async () => {
    let port = await getPort('page-performance')
    // 不支持往回传数据
    port.postMessage({ name: 'performance', body: '222' })
    console.log('port', port)
    port.onMessage.addListener((e) => {
      console.log('msg2', e)
    })
    // ----------
    // let port = await portListen('performance', (msg) => {
    //   console.log('msg1', msg)
    // })
    // port.port.onMessage.addListener((e) => {
    //   console.log('msg2', e)
    // })
  })

  useOnce(() => {
    const chart = eCharts.init(chartContainerRef.current)
    const option: ECOption = {
      title: {
        text: 'ECharts 入门示例',
      },
      tooltip: {},
      xAxis: {
        // data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子'],
        data: ['0', '1', '2', '3', '4', '5'],
      },
      yAxis: {},
      series: [
        {
          name: '无限制刷新率',
          type: 'line',
          data: [5, 20, 36, 10, 10, 20],
          smooth: true,
        },
        {
          name: '限制刷新率',
          type: 'line',
          data: [
            {
              value: 35,
              itemStyle: { color: 'red' },
              symbolSize: 8,
              symbol: 'circle',
            },
            { value: 35, itemStyle: { color: 'red' }, symbol: 'none' },
            { value: 20, itemStyle: { color: 'red' } },
            20,
            5,
            { value: 30, itemStyle: { color: 'red' } },
          ],
          smooth: true,
        },
      ],
    }

    chart.setOption(option)
    // chart.appendData({seriesIndex:})
    // console.log('chartContainerRef', chartContainerRef.current)
  })

  return (
    <div>
      <p>Page_performance</p>
      <div style={{ height: 300 }} ref={chartContainerRef}></div>
    </div>
  )
}

export default Page_performance
