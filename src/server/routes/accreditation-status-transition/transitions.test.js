import { accreditationStatusActions } from './transitions.js'

const baseUrl = '/organisations/org-1/registrations/reg-1/accreditations/acc-1'

const GREEN_BUTTON = 'govuk-button govuk-!-margin-bottom-0'
const RED_BUTTON = 'govuk-button govuk-button--warning govuk-!-margin-bottom-0'

describe('accreditationStatusActions', () => {
  it('offers Approve as a green CTA and Reject as a red CTA for a created accreditation', () => {
    expect(accreditationStatusActions('created', baseUrl)).toEqual([
      {
        href: `${baseUrl}/approve/confirm`,
        text: 'Approve',
        visuallyHiddenText: 'accreditation',
        classes: GREEN_BUTTON
      },
      {
        href: `${baseUrl}/reject/confirm`,
        text: 'Reject',
        visuallyHiddenText: 'accreditation',
        classes: RED_BUTTON
      }
    ])
  })

  it('offers Suspend as a red CTA for an approved accreditation', () => {
    expect(accreditationStatusActions('approved', baseUrl)).toEqual([
      {
        href: `${baseUrl}/suspend/confirm`,
        text: 'Suspend',
        visuallyHiddenText: 'accreditation',
        classes: RED_BUTTON
      }
    ])
  })

  it('offers Reapprove as a green CTA and Cancel as a red CTA for a suspended accreditation', () => {
    expect(accreditationStatusActions('suspended', baseUrl)).toEqual([
      {
        href: `${baseUrl}/reapprove/confirm`,
        text: 'Reapprove',
        visuallyHiddenText: 'accreditation',
        classes: GREEN_BUTTON
      },
      {
        href: `${baseUrl}/cancel/confirm`,
        text: 'Cancel',
        visuallyHiddenText: 'accreditation',
        classes: RED_BUTTON
      }
    ])
  })

  it('offers Reinstate as a green CTA for a cancelled accreditation', () => {
    expect(accreditationStatusActions('cancelled', baseUrl)).toEqual([
      {
        href: `${baseUrl}/reinstate/confirm`,
        text: 'Reinstate',
        visuallyHiddenText: 'accreditation',
        classes: GREEN_BUTTON
      }
    ])
  })

  it('offers Reopen as a green CTA for a rejected accreditation', () => {
    expect(accreditationStatusActions('rejected', baseUrl)).toEqual([
      {
        href: `${baseUrl}/reopen/confirm`,
        text: 'Reopen',
        visuallyHiddenText: 'accreditation',
        classes: GREEN_BUTTON
      }
    ])
  })

  it('offers no actions for a status with no transitions', () => {
    expect(accreditationStatusActions('nonsense', baseUrl)).toEqual([])
  })
})
