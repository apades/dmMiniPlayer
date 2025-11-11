import globals from 'globals'
import tsEslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'
import prettierRecommendConfig from 'eslint-plugin-prettier/recommended'
import importPlugin from 'eslint-plugin-import'

/**@type {import('eslint').Linter.Config} */
export default tsEslint.config(
  tsEslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    ignores: ['**/dist/*', '**/lib/*', '**/build/*'],
  },
  {
    languageOptions: {
      // parser,
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.commonjs,
        ...globals.es2025,
      },
    },
    // plugins: {
    //   tsEslintPlugin,
    // },
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
      '@typescript-eslint/no-empty-object-type': 0,
      '@typescript-eslint/no-unused-expressions': 0,
      '@typescript-eslint/no-require-imports': 0,
      '@typescript-eslint/no-this-alias': 0,
      'import/named': 0,
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: '@root/**',
              group: 'external',
              position: 'after',
            },
            {
              pattern: '@pkgs/**',
              group: 'external',
              position: 'after',
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
  prettierRecommendConfig,
)
