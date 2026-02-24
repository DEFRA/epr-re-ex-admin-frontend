import { parseValidationErrors } from './parse-validation-errors.js'

describe('parseValidationErrors', () => {
  test('Should parse registration field validation errors into friendly messages', () => {
    const message =
      'Invalid organisation data: registrations.1.registrationNumber: any.invalid; registrations.1.registrationNumber: string.base; registrations.1.validFrom: any.invalid; registrations.1.validFrom: string.base; registrations.1.validTo: any.invalid; registrations.1.validTo: string.base'

    const result = parseValidationErrors(message)

    expect(result).toEqual([
      { message: 'registrations[1].registrationNumber is required' },
      { message: 'registrations[1].validFrom is required' },
      { message: 'registrations[1].validTo is required' }
    ])
  })

  test('Should parse accreditation field validation errors', () => {
    const message =
      'Invalid organisation data: accreditations.0.accreditationNumber: any.invalid; accreditations.0.validFrom: string.base'

    const result = parseValidationErrors(message)

    expect(result).toEqual([
      { message: 'accreditations[0].accreditationNumber is required' },
      { message: 'accreditations[0].validFrom is required' }
    ])
  })

  test('Should deduplicate errors for the same field', () => {
    const message =
      'Invalid organisation data: registrations.0.registrationNumber: any.invalid; registrations.0.registrationNumber: string.base'

    const result = parseValidationErrors(message)

    expect(result).toEqual([
      { message: 'registrations[0].registrationNumber is required' }
    ])
  })

  test('Should return non-validation errors as-is', () => {
    const message =
      'Cannot transition registration/accreditation status from approved to cancelled'

    const result = parseValidationErrors(message)

    expect(result).toEqual([{ message }])
  })

  test('Should return simple error messages as-is', () => {
    const message = 'Conflict Error: Organisation version mismatch'

    const result = parseValidationErrors(message)

    expect(result).toEqual([{ message }])
  })

  test('Should handle null/undefined message', () => {
    expect(parseValidationErrors(null)).toEqual([
      { message: 'An unknown error occurred' }
    ])
    expect(parseValidationErrors(undefined)).toEqual([
      { message: 'An unknown error occurred' }
    ])
  })

  test('Should handle unknown field names', () => {
    const message =
      'Invalid organisation data: registrations.0.someUnknownField: any.invalid'

    const result = parseValidationErrors(message)

    expect(result).toEqual([
      { message: 'registrations[0].someUnknownField is required' }
    ])
  })

  test('Should handle simple names', () => {
    const message = 'Invalid organisation data: blah: any.invalid'

    const result = parseValidationErrors(message)

    expect(result).toEqual([{ message: 'blah is required' }])
  })

  test('Should fall back to raw message when entries have no valid colon-separated format', () => {
    const message =
      'Invalid organisation data: something-without-colon-separator'

    const result = parseValidationErrors(message)

    expect(result).toEqual([{ message }])
  })
})
