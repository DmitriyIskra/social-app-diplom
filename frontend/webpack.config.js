const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  devServer: {
    port: 8000,
  },
  devtool: 'source-map',
  // entry: {
  //   entry: {
  //     index: './index',  // на случай если 2 точки входа (файла js) и нужно сделать их раздельными
  //     shop: './shop'
  //   }
  // },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[hash].js',
    assetModuleFilename: "img/[hash][ext][query]", // [name] или [hash], путь куда сохранять изображения
    clean: true, // очищает папку dist
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: false,  // отключаем минификацию html
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, 'css-loader',
        ],
      },
      {
        test: /\.(png|jpg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.svg$/i,
        type: 'asset/resource',
        generator: {
          filename: 'svg/[hash][ext]',  // указываем путь сборки
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',  // указываем путь сборки
        }
      },

    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: './src/index.html',
      filename: './index.html',
      minify: false,
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[hash].css',
      chunkFilename: '[id].css',
    }),
  ],
};
