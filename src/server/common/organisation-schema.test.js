// @ts-expect-error -- generated ajv file is @ts-nocheck; it exports a ValidateFunction
import validate from '#server/common/schemas/organisation.ajv.js'

/**
 * Runs the compiled validator and returns any `enum`-keyword errors reported
 * at exactly the given JSON pointer. An empty array means the value at that
 * path was an accepted enum member.
 * @param {unknown} payload
 * @param {string} instancePath
 * @returns {Array<{ keyword: string, instancePath: string }>}
 */
function enumErrorsAt(payload, instancePath) {
  validate(payload)
  const errors = validate.errors ?? []
  return errors.filter(
    (error) => error.keyword === 'enum' && error.instancePath === instancePath
  )
}

describe('#organisation schema — suspended is a registration-invalid, accreditation-valid status (PAE-1705)', () => {
  test('Should reject a suspended registration status', () => {
    const errors = enumErrorsAt(
      { registrations: [{ status: 'suspended' }] },
      '/registrations/0/status'
    )

    expect(errors).not.toHaveLength(0)
  })

  test('Should reject a suspended registration statusHistory entry', () => {
    const errors = enumErrorsAt(
      { registrations: [{ statusHistory: [{ status: 'suspended' }] }] },
      '/registrations/0/statusHistory/0/status'
    )

    expect(errors).not.toHaveLength(0)
  })

  test('Should accept a suspended accreditation status', () => {
    const errors = enumErrorsAt(
      { accreditations: [{ status: 'suspended' }] },
      '/accreditations/0/status'
    )

    expect(errors).toHaveLength(0)
  })

  test('Should accept a suspended accreditation statusHistory entry', () => {
    const errors = enumErrorsAt(
      { accreditations: [{ statusHistory: [{ status: 'suspended' }] }] },
      '/accreditations/0/statusHistory/0/status'
    )

    expect(errors).toHaveLength(0)
  })
})
