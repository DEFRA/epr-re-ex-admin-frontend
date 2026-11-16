import Joi from 'joi'

/** A year as a natural-key address names it. */
export const yearSchema = Joi.string().pattern(/^\d{4}$/)

/** The params of a page addressed by an accreditation's natural keys. */
export const accreditationParams = Joi.object({
  organisationNumber: Joi.string().required(),
  registrationNumber: Joi.string().required(),
  year: yearSchema.required()
})
