import { utcToday } from './utc-today.js'

describe('#utcToday', () => {
  test('is a calendar date', () => {
    expect(utcToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
