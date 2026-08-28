import neostandard from 'neostandard'
import jsdoc from 'eslint-plugin-jsdoc'

export default [
  ...neostandard({
    env: ['node', 'vitest'],
    ignores: [
      ...neostandard.resolveIgnoresFromGitignore(),
      'src/server/common/schemas'
    ],
    noJsx: true,
    noStyle: true
  }),
  {
    plugins: { jsdoc },
    rules: {
      // Prefer `@import { X } from '...'` over inline `import('...').X` in types.
      // named-import avoids the fixer's mangled namespace output; do not rely on
      // --fix (wrong placement, no block merge) - hoist by hand when flagged.
      'jsdoc/prefer-import-tag': [
        'error',
        { outputType: 'named-import', exemptTypedefs: false }
      ]
    }
  },
  {
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_'
        }
      ]
    }
  }
]
