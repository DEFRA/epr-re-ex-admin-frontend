import { accreditationStatusActions } from './transitions.js'

const baseUrl = '/organisations/org-1/registrations/reg-1/accreditations/acc-1'

describe('accreditationStatusActions', () => {
  it('offers Approve and Reject links for a created accreditation', () => {
    expect(accreditationStatusActions('created', baseUrl)).toEqual([
      {
        href: `${baseUrl}/approve/confirm`,
        text: 'Approve',
        visuallyHiddenText: 'accreditation'
      },
      {
        href: `${baseUrl}/reject/confirm`,
        text: 'Reject',
        visuallyHiddenText: 'accreditation'
      }
    ])
  })

  it('offers a Suspend link for an approved accreditation', () => {
    expect(accreditationStatusActions('approved', baseUrl)).toEqual([
      {
        href: `${baseUrl}/suspend/confirm`,
        text: 'Suspend',
        visuallyHiddenText: 'accreditation'
      }
    ])
  })

  it('offers Reapprove and Cancel links for a suspended accreditation', () => {
    expect(accreditationStatusActions('suspended', baseUrl)).toEqual([
      {
        href: `${baseUrl}/reapprove/confirm`,
        text: 'Reapprove',
        visuallyHiddenText: 'accreditation'
      },
      {
        href: `${baseUrl}/cancel/confirm`,
        text: 'Cancel',
        visuallyHiddenText: 'accreditation'
      }
    ])
  })

  it('offers a Reinstate link for a cancelled accreditation', () => {
    expect(accreditationStatusActions('cancelled', baseUrl)).toEqual([
      {
        href: `${baseUrl}/reinstate/confirm`,
        text: 'Reinstate',
        visuallyHiddenText: 'accreditation'
      }
    ])
  })

  it('offers a Reopen link for a rejected accreditation', () => {
    expect(accreditationStatusActions('rejected', baseUrl)).toEqual([
      {
        href: `${baseUrl}/reopen/confirm`,
        text: 'Reopen',
        visuallyHiddenText: 'accreditation'
      }
    ])
  })

  it('offers no actions for a status with no transitions', () => {
    expect(accreditationStatusActions('nonsense', baseUrl)).toEqual([])
  })
})
