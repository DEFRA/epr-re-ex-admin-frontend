import { vi, describe, test, expect } from 'vitest'

import signInRoute from './index.js'

describe('#signIn route', () => {
  test('Should have correct HTTP method', () => {
    expect(signInRoute.method).toBe('GET')
  })

  test('Should have correct path', () => {
    expect(signInRoute.path).toBe('/auth/sign-in')
  })

  test('Should use entra-id authentication strategy', () => {
    expect(signInRoute.options.auth).toBe('entra-id')
  })

  test('Should have handler function', () => {
    expect(typeof signInRoute.handler).toBe('function')
  })

  test('Should return unauthorised view', () => {
    const mockToolkit = {
      view: vi.fn().mockReturnValue('unauthorised-view-result')
    }

    const mockRequest = {}

    const result = signInRoute.handler(mockRequest, mockToolkit)

    expect(mockToolkit.view).toHaveBeenCalledWith('unauthorised')
    expect(result).toBe('unauthorised-view-result')
  })

  test('Should handle handler with different toolkit implementations', () => {
    const mockToolkit1 = {
      view: vi.fn().mockReturnValue('result1')
    }

    const mockToolkit2 = {
      view: vi.fn().mockReturnValue('result2')
    }

    const result1 = signInRoute.handler({}, mockToolkit1)
    const result2 = signInRoute.handler({}, mockToolkit2)

    expect(mockToolkit1.view).toHaveBeenCalledWith('unauthorised')
    expect(mockToolkit2.view).toHaveBeenCalledWith('unauthorised')
    expect(result1).toBe('result1')
    expect(result2).toBe('result2')
  })

  test('Should not use request parameter in handler', () => {
    const mockToolkit = {
      view: vi.fn().mockReturnValue('view-result')
    }

    const mockRequest = { someProperty: 'test' }

    signInRoute.handler(mockRequest, mockToolkit)

    expect(mockToolkit.view).toHaveBeenCalledWith('unauthorised')
  })

  test('Should have complete route structure', () => {
    expect(signInRoute).toHaveProperty('method')
    expect(signInRoute).toHaveProperty('path')
    expect(signInRoute).toHaveProperty('options')
    expect(signInRoute).toHaveProperty('handler')
    expect(signInRoute.options).toHaveProperty('auth')
  })

  test('Should handler accept exactly two parameters', () => {
    expect(signInRoute.handler.length).toBe(2)
  })

  test('Should maintain consistent route configuration', () => {
    const route = signInRoute

    expect(route.method).toBe('GET')
    expect(route.path).toBe('/auth/sign-in')
    expect(route.options.auth).toBe('entra-id')
    expect(typeof route.handler).toBe('function')
  })
})
