import { accreditationStatusActions } from './transitions.js'

const baseUrl = '/organisations/org-1/registrations/reg-1/accreditations/acc-1'

describe('accreditationStatusActions', () => {
  it('offers Approve and Reject links for a created accreditation when the registration is approved', () => {
    expect(
      accreditationStatusActions('created', baseUrl, 'approved', 'A26ER1')
    ).toEqual([
      {
        href: `${baseUrl}/approve/confirm`,
        text: 'Approve',
        visuallyHiddenText: 'accreditation A26ER1'
      },
      {
        href: `${baseUrl}/reject/confirm`,
        text: 'Reject',
        visuallyHiddenText: 'accreditation A26ER1'
      }
    ])
  })

  it('offers only Reject for a created accreditation when the registration is not approved', () => {
    expect(
      accreditationStatusActions('created', baseUrl, 'created', 'A26ER1')
    ).toEqual([
      {
        href: `${baseUrl}/reject/confirm`,
        text: 'Reject',
        visuallyHiddenText: 'accreditation A26ER1'
      }
    ])
  })

  it('offers a Suspend link for an approved accreditation', () => {
    expect(
      accreditationStatusActions('approved', baseUrl, 'cancelled', 'A26ER1')
    ).toEqual([
      {
        href: `${baseUrl}/suspend/confirm`,
        text: 'Suspend',
        visuallyHiddenText: 'accreditation A26ER1'
      }
    ])
  })

  it('offers Reapprove and Cancel links for a suspended accreditation', () => {
    expect(
      accreditationStatusActions('suspended', baseUrl, 'approved', 'A26ER1')
    ).toEqual([
      {
        href: `${baseUrl}/reapprove/confirm`,
        text: 'Reapprove',
        visuallyHiddenText: 'accreditation A26ER1'
      },
      {
        href: `${baseUrl}/cancel/confirm`,
        text: 'Cancel',
        visuallyHiddenText: 'accreditation A26ER1'
      }
    ])
  })

  it('offers a Reinstate link for a cancelled accreditation when the registration is approved', () => {
    expect(
      accreditationStatusActions('cancelled', baseUrl, 'approved', 'A26ER1')
    ).toEqual([
      {
        href: `${baseUrl}/reinstate/confirm`,
        text: 'Reinstate',
        visuallyHiddenText: 'accreditation A26ER1'
      }
    ])
  })

  it('offers no Reinstate link for a cancelled accreditation when the registration is not approved', () => {
    expect(
      accreditationStatusActions('cancelled', baseUrl, 'cancelled', 'A26ER1')
    ).toEqual([])
  })

  it('offers a Reopen link for a rejected accreditation', () => {
    expect(
      accreditationStatusActions('rejected', baseUrl, 'approved', 'A26ER1')
    ).toEqual([
      {
        href: `${baseUrl}/reopen/confirm`,
        text: 'Reopen',
        visuallyHiddenText: 'accreditation A26ER1'
      }
    ])
  })

  it('offers no actions for a status with no transitions', () => {
    expect(
      accreditationStatusActions('nonsense', baseUrl, 'approved', 'A26ER1')
    ).toEqual([])
  })
})
