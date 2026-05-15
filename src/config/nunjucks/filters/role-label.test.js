import { describe, test, expect } from 'vitest'

import { roleLabel } from './role-label.js'

describe('#roleLabel', () => {
  test('write tier wins when admin.write is present', () => {
    expect(roleLabel(['admin.read', 'admin.write', 'admin.dlq.purge'])).toBe(
      'Service maintainer (write)'
    )
  })

  test('maintainer tier when admin.dlq.purge is present without admin.write', () => {
    expect(roleLabel(['admin.read', 'admin.dlq.purge'])).toBe(
      'Service maintainer'
    )
  })

  test('support tier when only admin.read is present', () => {
    expect(roleLabel(['admin.read'])).toBe('Support')
  })

  test.each([null, undefined, [], ['something.unrelated']])(
    'returns an empty string for an empty/unknown scope list (%s)',
    (input) => {
      expect(roleLabel(input)).toBe('')
    }
  )
})
