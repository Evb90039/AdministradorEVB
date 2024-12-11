module.exports = {
    plugins: [
      require('autoprefixer'),
      require('postcss-safe-parser'),
      {
        'postcss-preset-env': {
          features: {
            'nesting-rules': false
          }
        }
      }
    ]
  };