import neostandard from 'neostandard'

export default neostandard({
  env: ['node', 'vitest'],
  ignores: [
    ...neostandard.resolveIgnoresFromGitignore(),
    'src/server/common/schemas'
  ],
  noJsx: true,
  noStyle: true
})
