// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config'
import prettierConfig from 'eslint-config-prettier'
import { flatConfigs as importFlatConfigs } from 'eslint-plugin-import-x'
import prettierRecommendConfig from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  globalIgnores(['**/dist/*', '**/lib/*', '**/build/*']),
  {
    files: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
    extends: [
      tseslint.configs.recommended,
      importFlatConfigs.recommended,
      prettierConfig,
      prettierRecommendConfig,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.commonjs,
        ...globals.es2025,
      },
    },
    rules: {
      'no-console': 'off',
      'prettier/prettier': 'error',
      'import-x/extensions': 'off',
      'import-x/no-unresolved': 'off',
      'import-x/named': 'off',
      'import-x/default': 'off',
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
      'no-plusplus': 'off',
      'require-await': 'off',
      'no-unused-vars': 'off',
      'no-useless-escape': 'off',
      'no-proto': 'off',
      // Short-circuit / optional chaining expressions
      'no-unused-expressions': 'off',
      camelcase: 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'prefer-const': 'off',
      // Temporary
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-extra-semi': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-var': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      'import-x/order': [
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
)
