module.exports = {
    plugins: [
      require('autoprefixer'),
      require('postcss-safe-parser'),
      require('postcss-preset-env')({
        features: {
          'nesting-rules': false
        }
      })
    ]
  };