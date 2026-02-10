import { sanitizeFormulaInjection } from './sanitize-formula-injection.js'

describe('sanitizeFormulaInjection', () => {
  test.each([
    ['=SUM(A1)', "'=SUM(A1)"],
    ['+cmd|', "'+cmd|"],
    ['-1+1', "'-1+1"],
    ['@SUM(A1)', "'@SUM(A1)"]
  ])('should prefix "%s" with an apostrophe', (input, expected) => {
    expect(sanitizeFormulaInjection(input)).toBe(expected)
  })

  test.each(['Acme Ltd', '12345678', 'normal text', ''])(
    'should return safe string "%s" unchanged',
    (input) => {
      expect(sanitizeFormulaInjection(input)).toBe(input)
    }
  )

  test.each([42, 0, null, undefined])(
    'should pass through non-string value %s unchanged',
    (input) => {
      expect(sanitizeFormulaInjection(input)).toBe(input)
    }
  )
})
