module.exports = {
  root: true,
  env: {
    commonjs: true,
    es6: true,
    browser: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  // add your custom rules here
  rules: {
    'no-console': 'off',
    'prettier/prettier': 'error',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'no-plusplus': 'off',
    'require-await': 'off',
    'no-unused-vars': 'off',
    'no-useless-escape': 'off',
    'no-proto': 'off',
    // 链式判断
    'no-unused-expressions': 'off',
    'vue/no-v-html': 'off',
    camelcase: 0,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-unused-vars': 0,
    'prefer-const': 0,
    // 临时的
    '@typescript-eslint/no-explicit-any': 0,
    'react-hooks/exhaustive-deps': 0,
    '@typescript-eslint/no-extra-semi': 0,
    '@typescript-eslint/no-empty-function': 0,
    'no-var': 0,
    '@typescript-eslint/ban-types': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
  },
  ignorePatterns: ['**/dist/*', '**/lib/*', '**/build/*'],
}
