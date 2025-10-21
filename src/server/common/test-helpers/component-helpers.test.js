import { describe, expect, test } from 'vitest'
import { renderTestComponent } from './component-helpers.js'

describe('#renderTestComponent', () => {
  describe('callBlock parameter handling', () => {
    test('Should render component without callBlock using standard macro syntax', () => {
      const $ = renderTestComponent('service-header', {
        params: {
          serviceName: 'Test Service',
          serviceUrl: '/'
        }
      })

      expect($('[data-testid="app-service-header"]')).toHaveLength(1)
    })

    test('Should render component with callBlock using call block syntax', () => {
      const $ = renderTestComponent('service-header', {
        params: {
          serviceName: 'Test Service',
          serviceUrl: '/'
        },
        callBlock: ['<span>Additional content</span>']
      })

      expect($('[data-testid="app-service-header"]')).toHaveLength(1)
    })

    test('Should use standard macro syntax when callBlock is empty array', () => {
      const $ = renderTestComponent('service-header', {
        params: {
          serviceName: 'Test Service',
          serviceUrl: '/'
        },
        callBlock: []
      })

      expect($('[data-testid="app-service-header"]')).toHaveLength(1)
    })

    test('Should use standard macro syntax when callBlock is not an array', () => {
      const $ = renderTestComponent('service-header', {
        params: {
          serviceName: 'Test Service',
          serviceUrl: '/'
        },
        callBlock: null
      })

      expect($('[data-testid="app-service-header"]')).toHaveLength(1)
    })

    test('Should handle undefined options gracefully', () => {
      const $ = renderTestComponent('service-header')

      expect($('[data-testid="app-service-header"]')).toHaveLength(1)
    })
  })
})
