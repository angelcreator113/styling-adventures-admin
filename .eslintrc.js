/* eslint-env node */
module.exports = {
  settings: {
    'import/resolver': {
      alias: {
        map: [['@', './src']],               // matches your Vite alias
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
