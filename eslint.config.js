import neostandard from 'neostandard'

const neostandardConfig = neostandard({
  env: ['node', 'vitest'],
  ignores: [...neostandard.resolveIgnoresFromGitignore()],
  noJsx: true,
  noStyle: true
})

export default [
  ...neostandardConfig,
  {
    rules: {
      complexity: ['error', { max: 10 }]
    }
  }
]
