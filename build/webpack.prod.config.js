'use strict';
/* eslint-disable */

/*
   production 环境下 webpack 配置文件，安装 plugins
*/
const webpack = require('webpack');
const merge = require('webpack-merge');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const baseWebpackConfig = require('./webpack.base.config');
const utils = require('./utils');
const config = require('../config/index');
const common = config.common;
const current = utils.getEnvAndConf(config);

// 打包信息展示插件
let reportPlugin = [];

if (current.conf.bundleAnalyzerReport) {
   const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

   reportPlugin.push(new BundleAnalyzerPlugin());
}

// workbox 插件
let workboxPlugin = [];

if (current.conf.needWorkboxSW) {
   const WorkboxPlugin = require('workbox-webpack-plugin');
   const defaultConfig = {
      cacheId: 'webpack-pwa',
      skipWaiting: true,
      clientsClaim: true,
      swDest: 'service-wroker.js',
      globPatterns: ['**/*.{html,js,css,png.jpg}'],
      globIgnores: [ 'service-wroker.js' ],
      runtimeCaching: [
         {
            urlPattern: /.*\.js/,
            handler: 'networkFirst', // 网络优先
         }
      ]
   };
   workboxPlugin.push(new WorkboxPlugin.GenerateSW(current.conf.workboxConfig || defaultConfig));
}

module.exports = merge(baseWebpackConfig, {
   devtool: current.conf.productionSourceMap ? '#source-map' : false,
   module: {
      rules: [
         {
            test: /\.(less|css)$/,
            include: common.sourceCode,
            use: ExtractTextPlugin.extract({
               fallback: 'style-loader',
               use: utils.computeStyleLoader(true, ['css-loader', 'postcss-loader', 'less-loader'])
            })
         },
        {
          test: /\.(less|css)$/,
          include: /node_modules/,
          use: [
            'style-loader',
            {loader: 'css-loader', options: {modules: false}},
            {loader: 'less-loader', options: {sourceMap: false, javascriptEnabled: true}}
          ],
        }
      ]
   },
   plugins: [
      new CleanWebpackPlugin(['dist'], { root: common.context }),
      new webpack.HashedModuleIdsPlugin(),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new webpack.DefinePlugin({ 'process.env.NODE_ENV': current.conf.env.NODE_ENV }),
      new ExtractTextPlugin({
         filename: utils.resolve(current.conf.assetsSubDirectory)('css/[name].[contenthash:10].css'),
         disable: false,
         allChunks: true
      }),
      new OptimizeCSSPlugin({ cssProcessorOptions: { safe: true } }),
      new webpack.optimize.UglifyJsPlugin({
         compress: {
            warnings: false,
            drop_debugger: true,
            drop_console: true
         },
         comments: false,
         space_colon: false
      }),
      new webpack.optimize.CommonsChunkPlugin({ name: 'vendor' }),
      new webpack.optimize.CommonsChunkPlugin({ name: 'runtime' }),
      new CopyWebpackPlugin([
         {
            from: 'src/manifest.json',
            to: 'manifest.json'
         },
         {
            from: 'src/icon.png',
            to: 'static/imgs/icon.png'
         }
      ]),
      ...workboxPlugin,
      ...reportPlugin
   ]
});
