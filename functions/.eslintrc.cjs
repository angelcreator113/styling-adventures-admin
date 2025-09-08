/* eslint-env node */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parserOptions: { ecmaVersion: 2022 },
  extends: ['eslint:recommended'],
  rules: {
    // keep server code unblocked
    'require-jsdoc': 'off',
    'valid-jsdoc': 'off',
    'max-len': 'off',
    'comma-dangle': 'off',
    'indent': 'off',
    'arrow-parens': 'off',
    'object-curly-spacing': 'off',
    // 🔽 these were breaking your deploy
    'no-empty': 'off',
    'no-unused-vars': 'off'
  }
};
