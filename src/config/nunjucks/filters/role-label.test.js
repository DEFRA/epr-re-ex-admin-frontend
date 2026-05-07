import { describe, test, expect } from 'vitest'

import { roleLabel } from './role-label.js'

describe('#roleLabel', () => {
  test.each([
    ['service_maintainer_write', 'Service maintainer (write)'],
    ['service_maintainer', 'Service maintainer'],
    ['support', 'Support']
  ])('maps %s to its tier label', (role, expected) => {
    expect(roleLabel(role)).toBe(expected)
  })

  test.each([null, undefined, 'unknown_role', ''])(
    'returns an empty string for an unknown or absent role (%s)',
    (input) => {
      expect(roleLabel(input)).toBe('')
    }
  )
})
