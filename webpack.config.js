const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './app/dispatcher.ts',
  devtool: 'inline-source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: './bundle.js', // <-- Important
    libraryTarget: 'umd' // <-- Important
  },
  target: 'node',
  module: {
    rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
              transpileOnly: true
          },
          exclude: /node_modules/
      },
      {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/
      }
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  externals: [
    nodeExternals(), // <-- Important,
    /api/
    
  ]
  
};