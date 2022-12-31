module.exports = {
  entry: './src/index.ts', // Replace with the path to your entry point file
  output: {
    filename: 'bundle.js',
    path: __dirname + '/dist' // Replace with the path where you want to output the bundle
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  devtool: 'inline-source-map',
};