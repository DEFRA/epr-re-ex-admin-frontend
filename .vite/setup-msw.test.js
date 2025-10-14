import { describe, test, expect } from 'vitest'
import { server, http, HttpResponse } from './setup-msw.js'

describe('MSW Setup', () => {
  test('can mock HTTP requests', async () => {
    server.use(
      http.get('https://api.example.com/test', () => {
        return HttpResponse.json({ message: 'mocked response' })
      })
    )

    const response = await fetch('https://api.example.com/test')
    const data = await response.json()

    expect(data.message).toBe('mocked response')
  })

  test('resets handlers between tests', async () => {
    server.use(
      http.get('https://api.example.com/test', () => {
        return HttpResponse.json({ message: 'different response' })
      })
    )

    const response = await fetch('https://api.example.com/test')
    const data = await response.json()

    expect(data.message).toBe('different response')
  })
})
