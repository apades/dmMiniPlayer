const path = require('path')
const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const { DefinePlugin } = webpack
const allConfig = require('./webpack.ui.dev.config')

let pr = (..._path) => path.resolve(__dirname, ..._path)

let devPage = process.env.page || 'main',
  /**@type {allConfig['main']} */
  devConfig = allConfig[devPage]
if (!devConfig) {
  devConfig = allConfig['main']
}
const PORT = devConfig.port
const _HOST = '0.0.0.0'
const HOST = `http://${_HOST}`
const URL = `${HOST}:${PORT}`

// let pagesSrc = fs.readdirSync(pr('../src/pages/popup/'))

module.exports = {
  entry: [
    `webpack-dev-server/client?${URL}`,
    'webpack/hot/only-dev-server',
    devConfig.entry,
  ],
  devServer: {
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
      clientLogLevel: 'silent',
    },
    hot: true,
    compress: true,
    contentBase: path.resolve(__dirname, '../src'),
    port: PORT,
    host: _HOST,
    publicPath: URL,
    historyApiFallback: true,
    // before: function (app, server, compiler) {
    //   app.get('*', (req, res) => {
    //     let file = decodeURIComponent(
    //       path.resolve(__dirname, `../dist${req.path}`)
    //     )
    //     if (fs.existsSync(file)) return res.sendFile(file)
    //     res.sendFile(path.resolve(__dirname, devConfig.html))
    //   })
    // },
  },
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['babel-loader?cacheDirectory'],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                mode: 'global',
                localIdentName: '[name]__[local]--[hash:base64:5]',
              },
              importLoaders: 2,
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.less$/i,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'less-loader',
          {
            loader: 'style-resources-loader',
            options: {
              patterns: path.resolve(__dirname, '../src/style/mixin.less'),
            },
          },
        ],
      },
      {
        test: /\.text/i,
        use: ['text-loader'],
      },
      {
        test: /\.(jpe?g|png|gif|ogg|mp3|mp4)$/,
        use: ['file-loader'],
      },
      {
        test: /\.(svg?)(\?[a-z0-9]+)?$/,
        use: ['file-loader'],
      },
    ],
  },
  cache: {
    type: 'memory',
  },
  context: path.resolve(__dirname, '../src'),
  resolve: {
    alias: {
      '@root': path.resolve(__dirname, '../src'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    new ReactRefreshWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: devConfig.html,
      filename: 'index.html',
    }),
    new CopyPlugin({
      patterns: [
        { from: '../src/assets/**/*', to: '' },
        // { from: '../src/lib/**/*', to: '' },
      ],
    }),
    new DefinePlugin({
      'process.env.buildVer': `"v3"`,
      'process.env.uiDev': `true`,
    }),
  ],
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, '../dist_ui'),
    publicPath: '/',
  },
}
