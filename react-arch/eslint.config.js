import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      boundaries
    },
    settings: {
      'boundaries/elements': [
        {
          type: 'app',
          pattern: 'src/app/**'
        },
        {
          type: 'features',
          pattern: 'src/features/**',
          capture: ['feature']
        },
        {
          type: 'shared',
          pattern: 'src/shared/**'
        },
        {
          type: 'infrastructure',
          pattern: 'src/infrastructure/**'
        },
        {
          type: 'pages',
          pattern: 'src/pages/**'
        }
      ]
    },
    rules: {
      'boundaries/element-types': [2, {
        default: 'disallow',
        rules: [
          {
            from: ['features'],
            allow: ['shared', 'infrastructure']
          },
          {
            from: ['app'],
            allow: ['features', 'shared', 'infrastructure', 'pages']
          },
          {
            from: ['pages'],
            allow: ['features', 'shared', 'infrastructure', 'app']
          },
          {
            from: ['shared'],
            allow: ['infrastructure']
          },
          {
            from: ['infrastructure'],
            allow: []
          }
        ]
      }]
    }
  },
])
