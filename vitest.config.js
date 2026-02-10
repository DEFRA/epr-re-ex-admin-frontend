import { readFileSync } from 'node:fs'
import { defineConfig, configDefaults } from 'vitest/config'
import parse from 'parse-gitignore'

const preferIstanbul = process.env?.PREFER_ISTANBUL_COVERAGE === 'true'
const parsedGitignore =
  parse(readFileSync('.gitignore', 'utf-8')).patterns || []

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    reporters: process.env.CI
      ? ['default', ['json', { outputFile: 'coverage/test-results.json' }]]
      : ['default'],
    setupFiles: [
      '.vite/setup-auditing.js',
      '.vite/setup-files.js',
      '.vite/setup-msw.js'
    ],
    hookTimeout: 60000,
    fileParallelism: true,
    coverage: {
      provider: preferIstanbul ? 'istanbul' : 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**'],
      exclude: [
        ...configDefaults.exclude,
        ...parsedGitignore,
        '.gitkeep',
        '.server',
        '**/*.md',
        'src/**/*.njk', // Vitest can't parse them anyway
        'src/**/*.scss',
        'src/server/common/schemas/**',
        'src/server/common/test-helpers',
        'src/server/components/icons'
      ],
      thresholds: {
        lines: 100,
        statements: 100,
        branches: 100,
        functions: 100
      }
    }
  }
})
