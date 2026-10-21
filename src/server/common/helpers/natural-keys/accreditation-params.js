import Joi from 'joi'

/** The params of a page addressed by an accreditation's natural keys. */
export const accreditationParams = Joi.object({
  organisationNumber: Joi.string().required(),
  registrationNumber: Joi.string().required(),
  year: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
})
