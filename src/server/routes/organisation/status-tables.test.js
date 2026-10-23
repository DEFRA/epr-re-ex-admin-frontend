import {
  NOT_LINKED,
  REGISTRATION_NOT_APPROVED,
  toStatusTables
} from './status-tables.js'

const base = '/organisations/org-1/registrations'

describe('toStatusTables', () => {
  test('lists a registration with its number, its linked accreditation number and its status changes', () => {
    const { registrationRows } = toStatusTables({
      id: 'org-1',
      registrations: [
        {
          id: 'reg-1',
          registrationNumber: 'R26ER1',
          status: 'approved',
          accreditationId: 'acc-1'
        }
      ],
      accreditations: [
        { id: 'acc-1', accreditationNumber: 'A26ER1', status: 'suspended' }
      ]
    })

    expect(registrationRows).toEqual([
      {
        id: 'reg-1',
        number: 'R26ER1',
        linkedNumber: 'A26ER1',
        status: 'approved',
        actions: [
          {
            href: `${base}/reg-1/cancel/confirm`,
            text: 'Cancel',
            visuallyHiddenText: 'registration'
          }
        ],
        notes: []
      }
    ])
  })

  test('lists an accreditation with its number, its linked registration number and its status changes', () => {
    const { accreditationRows } = toStatusTables({
      id: 'org-1',
      registrations: [
        {
          id: 'reg-1',
          registrationNumber: 'R26ER1',
          status: 'approved',
          accreditationId: 'acc-1'
        }
      ],
      accreditations: [
        { id: 'acc-1', accreditationNumber: 'A26ER1', status: 'suspended' }
      ]
    })

    expect(accreditationRows).toEqual([
      {
        id: 'acc-1',
        number: 'A26ER1',
        linkedNumber: 'R26ER1',
        status: 'suspended',
        actions: [
          {
            href: `${base}/reg-1/accreditations/acc-1/reapprove/confirm`,
            text: 'Reapprove',
            visuallyHiddenText: 'accreditation'
          },
          {
            href: `${base}/reg-1/accreditations/acc-1/cancel/confirm`,
            text: 'Cancel',
            visuallyHiddenText: 'accreditation'
          }
        ],
        notes: []
      }
    ])
  })

  test('leaves the numbers blank for unapproved records and still offers their status changes', () => {
    const { registrationRows, accreditationRows } = toStatusTables({
      id: 'org-1',
      registrations: [
        { id: 'reg-1', status: 'created', accreditationId: 'acc-1' }
      ],
      accreditations: [{ id: 'acc-1', status: 'created' }]
    })

    expect(registrationRows[0]).toMatchObject({
      number: '',
      linkedNumber: '',
      actions: [
        expect.objectContaining({ text: 'Approve' }),
        expect.objectContaining({ text: 'Reject' })
      ]
    })
    // Approving an accreditation needs an approved registration (PAE-1800).
    expect(accreditationRows[0]).toMatchObject({
      number: '',
      linkedNumber: '',
      actions: [expect.objectContaining({ text: 'Reject' })],
      notes: [REGISTRATION_NOT_APPROVED]
    })
  })

  test('says why a cancelled accreditation cannot be reinstated while its registration is cancelled', () => {
    const { accreditationRows } = toStatusTables({
      id: 'org-1',
      registrations: [
        { id: 'reg-1', status: 'cancelled', accreditationId: 'acc-1' }
      ],
      accreditations: [{ id: 'acc-1', status: 'cancelled' }]
    })

    expect(accreditationRows[0]).toMatchObject({
      actions: [],
      notes: [REGISTRATION_NOT_APPROVED]
    })
  })

  test('says nothing when no status change is held back by the registration', () => {
    const { accreditationRows } = toStatusTables({
      id: 'org-1',
      registrations: [
        { id: 'reg-1', status: 'cancelled', accreditationId: 'acc-1' }
      ],
      accreditations: [{ id: 'acc-1', status: 'suspended' }]
    })

    expect(accreditationRows[0].notes).toEqual([])
  })

  test('offers no status changes for an accreditation no registration links to', () => {
    const { registrationRows, accreditationRows } = toStatusTables({
      id: 'org-1',
      registrations: [{ id: 'reg-1', status: 'approved' }],
      accreditations: [
        { id: 'acc-9', accreditationNumber: 'A26ER9', status: 'approved' }
      ]
    })

    expect(registrationRows[0].linkedNumber).toBe('')
    expect(accreditationRows[0]).toMatchObject({
      number: 'A26ER9',
      linkedNumber: '',
      actions: [],
      notes: [NOT_LINKED]
    })
  })
})
