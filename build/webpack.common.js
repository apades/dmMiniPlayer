const path = require('path')
const files = require('./files')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')

let pr = (..._path) => path.resolve(__dirname, ..._path)

/**@type {webpack.Configuration} */
let config = {
  entry: {
    ...files.entry,
    content: pr('../src/content.ts'),
    inject: pr('../src/inject/index.ts'),
    // background: pr('../src/background.ts'),
  },
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
          MiniCssExtractPlugin.loader,
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
          MiniCssExtractPlugin.loader,
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
        exclude: /initVideoFloatBtn/,
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
        include: /initVideoFloatBtn/,
      },
      {
        test: /\.(jpe?g|png|gif|ogg|mp3|mp4)$/,
        use: ['url-loader'],
      },
      {
        test: /\.(svg?)(\?[a-z0-9]+)?$/,
        use: ['url-loader'],
      },
      {
        test: /\.(mkv|ttf|woff2?)$/,
        use: ['url-loader'],
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
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/',
  },
}
module.exports = config
