const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const { DefinePlugin } = webpack
const files = require('./files')
const { merge } = require('webpack-merge')
const webpackCommon = require('./webpack.common')

module.exports = merge(webpackCommon, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    ...files.WebpackPluginList,
    new CopyPlugin({
      patterns: [
        // { from: '../src/assets/**/*', to: '' },
        { from: '../src/lib/**/*', to: '' },
        {
          from: `../src/manifest.json`,
          to: `manifest.json`,
          transform(buffer) {
            let manifest = JSON.parse(buffer.toString())
            manifest.name = manifest.name + '----dev'
            return JSON.stringify(manifest)
          },
        },
      ],
    }),
    new DefinePlugin({
      'process.env.uiDev': `false`,
    }),
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/',
  },
})
