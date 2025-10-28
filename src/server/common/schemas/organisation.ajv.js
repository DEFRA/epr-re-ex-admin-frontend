'use strict'
module.exports = validate20
module.exports.default = validate20
var schema38 = {
  type: 'object',
  properties: {
    id: { not: {} },
    orgId: { type: 'number' },
    statusHistory: { not: {} },
    status: {
      type: 'string',
      enum: ['created', 'approved', 'rejected', 'suspended', 'archived']
    },
    schemaVersion: { not: {} },
    version: { not: {} },
    wasteProcessingTypes: {
      type: 'array',
      minItems: 1,
      items: { type: 'string', enum: ['reprocessor', 'exporter'] }
    },
    reprocessingNations: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        enum: ['england', 'wales', 'scotland', 'northern_ireland']
      }
    },
    businessType: {
      type: 'string',
      enum: ['individual', 'unincorporated', 'partnership']
    },
    companyDetails: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        tradingName: { type: 'string' },
        registrationNumber: { type: 'string', pattern: '^[A-Z0-9]{8}$' },
        registeredAddress: {
          type: 'object',
          properties: {
            line1: { type: 'string' },
            line2: { type: 'string' },
            town: { type: 'string' },
            county: { type: 'string' },
            country: { type: 'string' },
            postcode: { type: 'string' },
            region: { type: 'string' },
            fullAddress: { type: 'string' },
            line2ToCounty: { type: 'string' }
          },
          additionalProperties: false
        }
      },
      required: ['name'],
      additionalProperties: false
    },
    partnership: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['ltd', 'ltd_liability'] },
        partners: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['company', 'individual'] }
            },
            required: ['name', 'type'],
            additionalProperties: false
          }
        }
      },
      required: ['type'],
      additionalProperties: false
    },
    submitterContactDetails: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        role: { type: 'string' },
        title: { type: 'string' }
      },
      required: ['fullName', 'email', 'phone'],
      additionalProperties: false,
      anyOf: [{ required: ['role'] }, { required: ['title'] }]
    },
    managementContactDetails: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        role: { type: 'string' },
        title: { type: 'string' }
      },
      required: ['fullName', 'email', 'phone'],
      additionalProperties: false,
      anyOf: [{ required: ['role'] }, { required: ['title'] }]
    },
    formSubmissionTime: { type: 'string', format: 'date-time' },
    submittedToRegulator: {
      type: 'string',
      enum: ['ea', 'nrw', 'sepa', 'niea']
    },
    registrations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', readOnly: true },
          statusHistory: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: [
                    'created',
                    'approved',
                    'rejected',
                    'suspended',
                    'archived'
                  ]
                },
                updatedAt: { type: 'string', format: 'date-time' },
                updatedBy: { type: 'string', readOnly: true }
              },
              required: ['status', 'updatedAt'],
              additionalProperties: false
            }
          },
          status: {
            type: 'string',
            enum: ['created', 'approved', 'rejected', 'suspended', 'archived']
          },
          formSubmissionTime: { type: 'string', format: 'date-time' },
          submittedToRegulator: {
            type: 'string',
            enum: ['ea', 'nrw', 'sepa', 'niea']
          },
          orgName: { type: 'string' },
          site: {
            type: 'object',
            properties: {
              address: {
                type: 'object',
                properties: {
                  line1: { type: 'string' },
                  line2: { type: 'string' },
                  town: { type: 'string' },
                  county: { type: 'string' },
                  country: { type: 'string' },
                  postcode: { type: 'string' },
                  region: { type: 'string' },
                  fullAddress: { type: 'string' },
                  line2ToCounty: { type: 'string' }
                },
                additionalProperties: false
              },
              gridReference: { type: 'string' },
              siteCapacity: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    material: {
                      type: 'string',
                      enum: [
                        'aluminium',
                        'fibre',
                        'glass',
                        'paper',
                        'plastic',
                        'steel',
                        'wood'
                      ]
                    },
                    siteCapacityWeight: { type: 'string' },
                    siteCapacityTimescale: {
                      type: 'string',
                      enum: ['weekly', 'monthly', 'yearly']
                    }
                  },
                  required: ['material'],
                  additionalProperties: false
                }
              }
            },
            required: ['address'],
            additionalProperties: false
          },
          material: {
            type: 'string',
            enum: [
              'aluminium',
              'fibre',
              'glass',
              'paper',
              'plastic',
              'steel',
              'wood'
            ]
          },
          wasteProcessingType: {
            type: 'string',
            enum: ['reprocessor', 'exporter']
          },
          accreditationId: { type: 'string', readOnly: true },
          recyclingProcess: {
            type: 'array',
            items: { type: 'string', enum: ['glass_re_melt', 'glass_other'] }
          },
          noticeAddress: {
            type: 'object',
            properties: {
              line1: { type: 'string' },
              line2: { type: 'string' },
              town: { type: 'string' },
              county: { type: 'string' },
              country: { type: 'string' },
              postcode: { type: 'string' },
              region: { type: 'string' },
              fullAddress: { type: 'string' },
              line2ToCounty: { type: 'string' }
            },
            additionalProperties: false
          },
          wasteRegistrationNumber: { type: 'string' },
          wasteManagementPermits: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['wml', 'ppc', 'waste_exemption']
                },
                permitNumber: { type: 'string' },
                exemptions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      reference: { type: 'string' },
                      exemptionCode: { type: 'string' }
                    },
                    required: ['reference', 'exemptionCode'],
                    additionalProperties: false
                  }
                },
                authorisedMaterials: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      material: {
                        type: 'string',
                        enum: [
                          'aluminium',
                          'fibre',
                          'glass',
                          'paper',
                          'plastic',
                          'steel',
                          'wood'
                        ]
                      },
                      authorisedWeight: { type: 'string' },
                      timeScale: {
                        type: 'string',
                        enum: ['weekly', 'monthly', 'yearly']
                      }
                    },
                    required: ['material'],
                    additionalProperties: false
                  }
                }
              },
              required: ['type'],
              additionalProperties: false
            }
          },
          approvedPersons: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fullName: { type: 'string' },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string' },
                role: { type: 'string' },
                title: { type: 'string' }
              },
              required: ['fullName', 'email', 'phone'],
              additionalProperties: false,
              anyOf: [{ required: ['role'] }, { required: ['title'] }]
            }
          },
          suppliers: { type: 'string' },
          exportPorts: { type: 'array', items: { type: 'string' } },
          yearlyMetrics: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                year: { type: 'string' },
                input: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['actual', 'estimated'] },
                    ukPackagingWaste: { type: 'string' },
                    nonUkPackagingWaste: { type: 'string' },
                    nonPackagingWaste: { type: 'string' }
                  },
                  additionalProperties: false
                },
                rawMaterialInputs: {
                  type: 'object',
                  properties: {
                    material: { type: 'string' },
                    tonnage: { type: 'string' }
                  },
                  additionalProperties: false
                },
                output: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['actual', 'estimated'] },
                    sentToAnotherSite: { type: 'string' },
                    contaminants: { type: 'string' },
                    processLoss: { type: 'string' }
                  },
                  additionalProperties: false
                },
                productsMadeFromRecycling: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      weight: { type: 'string' }
                    },
                    additionalProperties: false
                  }
                }
              },
              required: ['year'],
              additionalProperties: false
            }
          },
          plantEquipmentDetails: { type: 'string' },
          submitterContactDetails: {
            type: 'object',
            properties: {
              fullName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              role: { type: 'string' },
              title: { type: 'string' }
            },
            required: ['fullName', 'email', 'phone'],
            additionalProperties: false,
            anyOf: [{ required: ['role'] }, { required: ['title'] }]
          },
          samplingInspectionPlanFileUploads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                defraFormUploadedFileId: { type: 'string' },
                defraFormUserDownloadLink: { type: 'string', format: 'uri' },
                s3Uri: { type: 'string' }
              },
              required: [
                'defraFormUploadedFileId',
                'defraFormUserDownloadLink'
              ],
              additionalProperties: false
            }
          },
          orsFileUploads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                defraFormUploadedFileId: { type: 'string' },
                defraFormUserDownloadLink: { type: 'string', format: 'uri' },
                s3Uri: { type: 'string' }
              },
              required: [
                'defraFormUploadedFileId',
                'defraFormUserDownloadLink'
              ],
              additionalProperties: false
            }
          }
        },
        required: [
          'id',
          'formSubmissionTime',
          'submittedToRegulator',
          'material',
          'wasteProcessingType'
        ],
        additionalProperties: false
      }
    },
    accreditations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', readOnly: true },
          accreditationNumber: { type: 'number' },
          statusHistory: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: [
                    'created',
                    'approved',
                    'rejected',
                    'suspended',
                    'archived'
                  ]
                },
                updatedAt: { type: 'string', format: 'date-time' },
                updatedBy: { type: 'string', readOnly: true }
              },
              required: ['status', 'updatedAt'],
              additionalProperties: false
            }
          },
          status: {
            type: 'string',
            enum: ['created', 'approved', 'rejected', 'suspended', 'archived']
          },
          formSubmissionTime: { type: 'string', format: 'date-time' },
          submittedToRegulator: {
            type: 'string',
            enum: ['ea', 'nrw', 'sepa', 'niea']
          },
          orgName: { type: 'string' },
          site: {
            type: 'object',
            properties: {
              address: {
                type: 'object',
                properties: {
                  line1: { type: 'string' },
                  line2: { type: 'string' },
                  town: { type: 'string' },
                  county: { type: 'string' },
                  country: { type: 'string' },
                  postcode: { type: 'string' },
                  region: { type: 'string' },
                  fullAddress: { type: 'string' },
                  line2ToCounty: { type: 'string' }
                },
                additionalProperties: false
              },
              gridReference: { type: 'string' },
              siteCapacity: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    material: {
                      type: 'string',
                      enum: [
                        'aluminium',
                        'fibre',
                        'glass',
                        'paper',
                        'plastic',
                        'steel',
                        'wood'
                      ]
                    },
                    siteCapacityWeight: { type: 'string' },
                    siteCapacityTimescale: {
                      type: 'string',
                      enum: ['weekly', 'monthly', 'yearly']
                    }
                  },
                  required: ['material'],
                  additionalProperties: false
                }
              }
            },
            required: ['address'],
            additionalProperties: false
          },
          material: {
            type: 'string',
            enum: [
              'aluminium',
              'fibre',
              'glass',
              'paper',
              'plastic',
              'steel',
              'wood'
            ]
          },
          wasteProcessingType: {
            type: 'string',
            enum: ['reprocessor', 'exporter']
          },
          prnIssuance: {
            type: 'object',
            properties: {
              tonnageBand: {
                type: 'string',
                enum: ['up_to_500', 'up_to_5000', 'up_to_10000', 'over_10000']
              },
              signatories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    fullName: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    role: { type: 'string' },
                    title: { type: 'string' }
                  },
                  required: ['fullName', 'email', 'phone'],
                  additionalProperties: false,
                  anyOf: [{ required: ['role'] }, { required: ['title'] }]
                }
              },
              prnIncomeBusinessPlan: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    percentIncomeSpent: { type: 'number' },
                    usageDescription: { type: 'string' },
                    detailedExplanation: { type: 'string' }
                  },
                  additionalProperties: false
                }
              }
            },
            additionalProperties: false
          },
          pernIssuance: {
            type: 'object',
            properties: {
              tonnageBand: {
                type: 'string',
                enum: ['up_to_500', 'up_to_5000', 'up_to_10000', 'over_10000']
              },
              signatories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    fullName: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    role: { type: 'string' },
                    title: { type: 'string' }
                  },
                  required: ['fullName', 'email', 'phone'],
                  additionalProperties: false,
                  anyOf: [{ required: ['role'] }, { required: ['title'] }]
                }
              },
              pernIncomeBusinessPlan: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    percentIncomeSpent: { type: 'number' },
                    usageDescription: { type: 'string' },
                    detailedExplanation: { type: 'string' }
                  },
                  additionalProperties: false
                }
              }
            },
            additionalProperties: false
          },
          businessPlan: {
            type: 'array',
            items: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          },
          noticeAddress: {
            type: 'object',
            properties: {
              line1: { type: 'string' },
              line2: { type: 'string' },
              town: { type: 'string' },
              county: { type: 'string' },
              country: { type: 'string' },
              postcode: { type: 'string' },
              region: { type: 'string' },
              fullAddress: { type: 'string' },
              line2ToCounty: { type: 'string' }
            },
            additionalProperties: false
          },
          submitterContactDetails: {
            type: 'object',
            properties: {
              fullName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              role: { type: 'string' },
              title: { type: 'string' }
            },
            required: ['fullName', 'email', 'phone'],
            additionalProperties: false,
            anyOf: [{ required: ['role'] }, { required: ['title'] }]
          },
          samplingInspectionPlanFileUploads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                defraFormUploadedFileId: { type: 'string' },
                defraFormUserDownloadLink: { type: 'string', format: 'uri' },
                s3Uri: { type: 'string' }
              },
              required: [
                'defraFormUploadedFileId',
                'defraFormUserDownloadLink'
              ],
              additionalProperties: false
            }
          },
          orsFileUploads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                defraFormUploadedFileId: { type: 'string' },
                defraFormUserDownloadLink: { type: 'string', format: 'uri' },
                s3Uri: { type: 'string' }
              },
              required: [
                'defraFormUploadedFileId',
                'defraFormUserDownloadLink'
              ],
              additionalProperties: false
            }
          }
        },
        required: [
          'id',
          'formSubmissionTime',
          'submittedToRegulator',
          'material',
          'wasteProcessingType'
        ],
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
}
var func4 = Object.prototype.hasOwnProperty
var pattern0 = new RegExp('^[A-Z0-9]{8}$', 'u')
var formats0 =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i
var formats4 = require('ajv-formats/dist/formats').fullFormats['date-time']
var formats14 = require('ajv-formats/dist/formats').fullFormats.uri
function validate20(data, valCxt) {
  'use strict'
  if (valCxt) {
    var instancePath = valCxt.instancePath
    var parentData = valCxt.parentData
    var parentDataProperty = valCxt.parentDataProperty
    var rootData = valCxt.rootData
  } else {
    var instancePath = ''
    var parentData = undefined
    var parentDataProperty = undefined
    var rootData = data
  }
  var vErrors = null
  var errors = 0
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    for (var key0 in data) {
      if (!func4.call(schema38.properties, key0)) {
        var err0 = {
          instancePath: instancePath,
          schemaPath: '#/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
          schema: false,
          parentSchema: schema38,
          data: data
        }
        if (vErrors === null) {
          vErrors = [err0]
        } else {
          vErrors.push(err0)
        }
        errors++
      }
    }
    if (data.id !== undefined) {
      var err1 = {
        instancePath: instancePath + '/id',
        schemaPath: '#/properties/id/not',
        keyword: 'not',
        params: {},
        message: 'must NOT be valid',
        schema: schema38.properties.id.not,
        parentSchema: schema38.properties.id,
        data: data.id
      }
      if (vErrors === null) {
        vErrors = [err1]
      } else {
        vErrors.push(err1)
      }
      errors++
    }
    if (data.orgId !== undefined) {
      var data1 = data.orgId
      if (!(typeof data1 == 'number' && isFinite(data1))) {
        var err2 = {
          instancePath: instancePath + '/orgId',
          schemaPath: '#/properties/orgId/type',
          keyword: 'type',
          params: { type: 'number' },
          message: 'must be number',
          schema: schema38.properties.orgId.type,
          parentSchema: schema38.properties.orgId,
          data: data1
        }
        if (vErrors === null) {
          vErrors = [err2]
        } else {
          vErrors.push(err2)
        }
        errors++
      }
    }
    if (data.statusHistory !== undefined) {
      var err3 = {
        instancePath: instancePath + '/statusHistory',
        schemaPath: '#/properties/statusHistory/not',
        keyword: 'not',
        params: {},
        message: 'must NOT be valid',
        schema: schema38.properties.statusHistory.not,
        parentSchema: schema38.properties.statusHistory,
        data: data.statusHistory
      }
      if (vErrors === null) {
        vErrors = [err3]
      } else {
        vErrors.push(err3)
      }
      errors++
    }
    if (data.status !== undefined) {
      var data3 = data.status
      if (typeof data3 !== 'string') {
        var err4 = {
          instancePath: instancePath + '/status',
          schemaPath: '#/properties/status/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
          schema: schema38.properties.status.type,
          parentSchema: schema38.properties.status,
          data: data3
        }
        if (vErrors === null) {
          vErrors = [err4]
        } else {
          vErrors.push(err4)
        }
        errors++
      }
      if (
        !(
          data3 === 'created' ||
          data3 === 'approved' ||
          data3 === 'rejected' ||
          data3 === 'suspended' ||
          data3 === 'archived'
        )
      ) {
        var err5 = {
          instancePath: instancePath + '/status',
          schemaPath: '#/properties/status/enum',
          keyword: 'enum',
          params: { allowedValues: schema38.properties.status.enum },
          message: 'must be equal to one of the allowed values',
          schema: schema38.properties.status.enum,
          parentSchema: schema38.properties.status,
          data: data3
        }
        if (vErrors === null) {
          vErrors = [err5]
        } else {
          vErrors.push(err5)
        }
        errors++
      }
    }
    if (data.schemaVersion !== undefined) {
      var err6 = {
        instancePath: instancePath + '/schemaVersion',
        schemaPath: '#/properties/schemaVersion/not',
        keyword: 'not',
        params: {},
        message: 'must NOT be valid',
        schema: schema38.properties.schemaVersion.not,
        parentSchema: schema38.properties.schemaVersion,
        data: data.schemaVersion
      }
      if (vErrors === null) {
        vErrors = [err6]
      } else {
        vErrors.push(err6)
      }
      errors++
    }
    if (data.version !== undefined) {
      var err7 = {
        instancePath: instancePath + '/version',
        schemaPath: '#/properties/version/not',
        keyword: 'not',
        params: {},
        message: 'must NOT be valid',
        schema: schema38.properties.version.not,
        parentSchema: schema38.properties.version,
        data: data.version
      }
      if (vErrors === null) {
        vErrors = [err7]
      } else {
        vErrors.push(err7)
      }
      errors++
    }
    if (data.wasteProcessingTypes !== undefined) {
      var data6 = data.wasteProcessingTypes
      if (Array.isArray(data6)) {
        if (data6.length < 1) {
          var err8 = {
            instancePath: instancePath + '/wasteProcessingTypes',
            schemaPath: '#/properties/wasteProcessingTypes/minItems',
            keyword: 'minItems',
            params: { limit: 1 },
            message: 'must NOT have fewer than 1 items',
            schema: 1,
            parentSchema: schema38.properties.wasteProcessingTypes,
            data: data6
          }
          if (vErrors === null) {
            vErrors = [err8]
          } else {
            vErrors.push(err8)
          }
          errors++
        }
        var len0 = data6.length
        for (var i0 = 0; i0 < len0; i0++) {
          var data7 = data6[i0]
          if (typeof data7 !== 'string') {
            var err9 = {
              instancePath: instancePath + '/wasteProcessingTypes/' + i0,
              schemaPath: '#/properties/wasteProcessingTypes/items/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema: schema38.properties.wasteProcessingTypes.items.type,
              parentSchema: schema38.properties.wasteProcessingTypes.items,
              data: data7
            }
            if (vErrors === null) {
              vErrors = [err9]
            } else {
              vErrors.push(err9)
            }
            errors++
          }
          if (!(data7 === 'reprocessor' || data7 === 'exporter')) {
            var err10 = {
              instancePath: instancePath + '/wasteProcessingTypes/' + i0,
              schemaPath: '#/properties/wasteProcessingTypes/items/enum',
              keyword: 'enum',
              params: {
                allowedValues:
                  schema38.properties.wasteProcessingTypes.items.enum
              },
              message: 'must be equal to one of the allowed values',
              schema: schema38.properties.wasteProcessingTypes.items.enum,
              parentSchema: schema38.properties.wasteProcessingTypes.items,
              data: data7
            }
            if (vErrors === null) {
              vErrors = [err10]
            } else {
              vErrors.push(err10)
            }
            errors++
          }
        }
      } else {
        var err11 = {
          instancePath: instancePath + '/wasteProcessingTypes',
          schemaPath: '#/properties/wasteProcessingTypes/type',
          keyword: 'type',
          params: { type: 'array' },
          message: 'must be array',
          schema: schema38.properties.wasteProcessingTypes.type,
          parentSchema: schema38.properties.wasteProcessingTypes,
          data: data6
        }
        if (vErrors === null) {
          vErrors = [err11]
        } else {
          vErrors.push(err11)
        }
        errors++
      }
    }
    if (data.reprocessingNations !== undefined) {
      var data8 = data.reprocessingNations
      if (Array.isArray(data8)) {
        if (data8.length < 1) {
          var err12 = {
            instancePath: instancePath + '/reprocessingNations',
            schemaPath: '#/properties/reprocessingNations/minItems',
            keyword: 'minItems',
            params: { limit: 1 },
            message: 'must NOT have fewer than 1 items',
            schema: 1,
            parentSchema: schema38.properties.reprocessingNations,
            data: data8
          }
          if (vErrors === null) {
            vErrors = [err12]
          } else {
            vErrors.push(err12)
          }
          errors++
        }
        var len1 = data8.length
        for (var i1 = 0; i1 < len1; i1++) {
          var data9 = data8[i1]
          if (typeof data9 !== 'string') {
            var err13 = {
              instancePath: instancePath + '/reprocessingNations/' + i1,
              schemaPath: '#/properties/reprocessingNations/items/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema: schema38.properties.reprocessingNations.items.type,
              parentSchema: schema38.properties.reprocessingNations.items,
              data: data9
            }
            if (vErrors === null) {
              vErrors = [err13]
            } else {
              vErrors.push(err13)
            }
            errors++
          }
          if (
            !(
              data9 === 'england' ||
              data9 === 'wales' ||
              data9 === 'scotland' ||
              data9 === 'northern_ireland'
            )
          ) {
            var err14 = {
              instancePath: instancePath + '/reprocessingNations/' + i1,
              schemaPath: '#/properties/reprocessingNations/items/enum',
              keyword: 'enum',
              params: {
                allowedValues:
                  schema38.properties.reprocessingNations.items.enum
              },
              message: 'must be equal to one of the allowed values',
              schema: schema38.properties.reprocessingNations.items.enum,
              parentSchema: schema38.properties.reprocessingNations.items,
              data: data9
            }
            if (vErrors === null) {
              vErrors = [err14]
            } else {
              vErrors.push(err14)
            }
            errors++
          }
        }
      } else {
        var err15 = {
          instancePath: instancePath + '/reprocessingNations',
          schemaPath: '#/properties/reprocessingNations/type',
          keyword: 'type',
          params: { type: 'array' },
          message: 'must be array',
          schema: schema38.properties.reprocessingNations.type,
          parentSchema: schema38.properties.reprocessingNations,
          data: data8
        }
        if (vErrors === null) {
          vErrors = [err15]
        } else {
          vErrors.push(err15)
        }
        errors++
      }
    }
    if (data.businessType !== undefined) {
      var data10 = data.businessType
      if (typeof data10 !== 'string') {
        var err16 = {
          instancePath: instancePath + '/businessType',
          schemaPath: '#/properties/businessType/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
          schema: schema38.properties.businessType.type,
          parentSchema: schema38.properties.businessType,
          data: data10
        }
        if (vErrors === null) {
          vErrors = [err16]
        } else {
          vErrors.push(err16)
        }
        errors++
      }
      if (
        !(
          data10 === 'individual' ||
          data10 === 'unincorporated' ||
          data10 === 'partnership'
        )
      ) {
        var err17 = {
          instancePath: instancePath + '/businessType',
          schemaPath: '#/properties/businessType/enum',
          keyword: 'enum',
          params: { allowedValues: schema38.properties.businessType.enum },
          message: 'must be equal to one of the allowed values',
          schema: schema38.properties.businessType.enum,
          parentSchema: schema38.properties.businessType,
          data: data10
        }
        if (vErrors === null) {
          vErrors = [err17]
        } else {
          vErrors.push(err17)
        }
        errors++
      }
    }
    if (data.companyDetails !== undefined) {
      var data11 = data.companyDetails
      if (data11 && typeof data11 == 'object' && !Array.isArray(data11)) {
        if (data11.name === undefined) {
          var err18 = {
            instancePath: instancePath + '/companyDetails',
            schemaPath: '#/properties/companyDetails/required',
            keyword: 'required',
            params: { missingProperty: 'name' },
            message: "must have required property '" + 'name' + "'",
            schema: schema38.properties.companyDetails.required,
            parentSchema: schema38.properties.companyDetails,
            data: data11
          }
          if (vErrors === null) {
            vErrors = [err18]
          } else {
            vErrors.push(err18)
          }
          errors++
        }
        for (var key1 in data11) {
          if (
            !(
              key1 === 'name' ||
              key1 === 'tradingName' ||
              key1 === 'registrationNumber' ||
              key1 === 'registeredAddress'
            )
          ) {
            var err19 = {
              instancePath: instancePath + '/companyDetails',
              schemaPath: '#/properties/companyDetails/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
              schema: false,
              parentSchema: schema38.properties.companyDetails,
              data: data11
            }
            if (vErrors === null) {
              vErrors = [err19]
            } else {
              vErrors.push(err19)
            }
            errors++
          }
        }
        if (data11.name !== undefined) {
          var data12 = data11.name
          if (typeof data12 !== 'string') {
            var err20 = {
              instancePath: instancePath + '/companyDetails/name',
              schemaPath: '#/properties/companyDetails/properties/name/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema: schema38.properties.companyDetails.properties.name.type,
              parentSchema: schema38.properties.companyDetails.properties.name,
              data: data12
            }
            if (vErrors === null) {
              vErrors = [err20]
            } else {
              vErrors.push(err20)
            }
            errors++
          }
        }
        if (data11.tradingName !== undefined) {
          var data13 = data11.tradingName
          if (typeof data13 !== 'string') {
            var err21 = {
              instancePath: instancePath + '/companyDetails/tradingName',
              schemaPath:
                '#/properties/companyDetails/properties/tradingName/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema:
                schema38.properties.companyDetails.properties.tradingName.type,
              parentSchema:
                schema38.properties.companyDetails.properties.tradingName,
              data: data13
            }
            if (vErrors === null) {
              vErrors = [err21]
            } else {
              vErrors.push(err21)
            }
            errors++
          }
        }
        if (data11.registrationNumber !== undefined) {
          var data14 = data11.registrationNumber
          if (typeof data14 === 'string') {
            if (!pattern0.test(data14)) {
              var err22 = {
                instancePath:
                  instancePath + '/companyDetails/registrationNumber',
                schemaPath:
                  '#/properties/companyDetails/properties/registrationNumber/pattern',
                keyword: 'pattern',
                params: { pattern: '^[A-Z0-9]{8}$' },
                message: 'must match pattern "' + '^[A-Z0-9]{8}$' + '"',
                schema: '^[A-Z0-9]{8}$',
                parentSchema:
                  schema38.properties.companyDetails.properties
                    .registrationNumber,
                data: data14
              }
              if (vErrors === null) {
                vErrors = [err22]
              } else {
                vErrors.push(err22)
              }
              errors++
            }
          } else {
            var err23 = {
              instancePath: instancePath + '/companyDetails/registrationNumber',
              schemaPath:
                '#/properties/companyDetails/properties/registrationNumber/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema:
                schema38.properties.companyDetails.properties.registrationNumber
                  .type,
              parentSchema:
                schema38.properties.companyDetails.properties
                  .registrationNumber,
              data: data14
            }
            if (vErrors === null) {
              vErrors = [err23]
            } else {
              vErrors.push(err23)
            }
            errors++
          }
        }
        if (data11.registeredAddress !== undefined) {
          var data15 = data11.registeredAddress
          if (data15 && typeof data15 == 'object' && !Array.isArray(data15)) {
            for (var key2 in data15) {
              if (
                !func4.call(
                  schema38.properties.companyDetails.properties
                    .registeredAddress.properties,
                  key2
                )
              ) {
                var err24 = {
                  instancePath:
                    instancePath + '/companyDetails/registeredAddress',
                  schemaPath:
                    '#/properties/companyDetails/properties/registeredAddress/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key2 },
                  message: 'must NOT have additional properties',
                  schema: false,
                  parentSchema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress,
                  data: data15
                }
                if (vErrors === null) {
                  vErrors = [err24]
                } else {
                  vErrors.push(err24)
                }
                errors++
              }
            }
            if (data15.line1 !== undefined) {
              var data16 = data15.line1
              if (typeof data16 !== 'string') {
                var err25 = {
                  instancePath:
                    instancePath + '/companyDetails/registeredAddress/line1',
                  schemaPath:
                    '#/properties/companyDetails/properties/registeredAddress/properties/line1/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.line1.type,
                  parentSchema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.line1,
                  data: data16
                }
                if (vErrors === null) {
                  vErrors = [err25]
                } else {
                  vErrors.push(err25)
                }
                errors++
              }
            }
            if (data15.line2 !== undefined) {
              var data17 = data15.line2
              if (typeof data17 !== 'string') {
                var err26 = {
                  instancePath:
                    instancePath + '/companyDetails/registeredAddress/line2',
                  schemaPath:
                    '#/properties/companyDetails/properties/registeredAddress/properties/line2/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.line2.type,
                  parentSchema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.line2,
                  data: data17
                }
                if (vErrors === null) {
                  vErrors = [err26]
                } else {
                  vErrors.push(err26)
                }
                errors++
              }
            }
            if (data15.town !== undefined) {
              var data18 = data15.town
              if (typeof data18 !== 'string') {
                var err27 = {
                  instancePath:
                    instancePath + '/companyDetails/registeredAddress/town',
                  schemaPath:
                    '#/properties/companyDetails/properties/registeredAddress/properties/town/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.town.type,
                  parentSchema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.town,
                  data: data18
                }
                if (vErrors === null) {
                  vErrors = [err27]
                } else {
                  vErrors.push(err27)
                }
                errors++
              }
            }
            if (data15.county !== undefined) {
              var data19 = data15.county
              if (typeof data19 !== 'string') {
                var err28 = {
                  instancePath:
                    instancePath + '/companyDetails/registeredAddress/county',
                  schemaPath:
                    '#/properties/companyDetails/properties/registeredAddress/properties/county/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.county.type,
                  parentSchema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.county,
                  data: data19
                }
                if (vErrors === null) {
                  vErrors = [err28]
                } else {
                  vErrors.push(err28)
                }
                errors++
              }
            }
            if (data15.country !== undefined) {
              var data20 = data15.country
              if (typeof data20 !== 'string') {
                var err29 = {
                  instancePath:
                    instancePath + '/companyDetails/registeredAddress/country',
                  schemaPath:
                    '#/properties/companyDetails/properties/registeredAddress/properties/country/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.country.type,
                  parentSchema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.country,
                  data: data20
                }
                if (vErrors === null) {
                  vErrors = [err29]
                } else {
                  vErrors.push(err29)
                }
                errors++
              }
            }
            if (data15.postcode !== undefined) {
              var data21 = data15.postcode
              if (typeof data21 !== 'string') {
                var err30 = {
                  instancePath:
                    instancePath + '/companyDetails/registeredAddress/postcode',
                  schemaPath:
                    '#/properties/companyDetails/properties/registeredAddress/properties/postcode/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.postcode.type,
                  parentSchema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.postcode,
                  data: data21
                }
                if (vErrors === null) {
                  vErrors = [err30]
                } else {
                  vErrors.push(err30)
                }
                errors++
              }
            }
            if (data15.region !== undefined) {
              var data22 = data15.region
              if (typeof data22 !== 'string') {
                var err31 = {
                  instancePath:
                    instancePath + '/companyDetails/registeredAddress/region',
                  schemaPath:
                    '#/properties/companyDetails/properties/registeredAddress/properties/region/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.region.type,
                  parentSchema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.region,
                  data: data22
                }
                if (vErrors === null) {
                  vErrors = [err31]
                } else {
                  vErrors.push(err31)
                }
                errors++
              }
            }
            if (data15.fullAddress !== undefined) {
              var data23 = data15.fullAddress
              if (typeof data23 !== 'string') {
                var err32 = {
                  instancePath:
                    instancePath +
                    '/companyDetails/registeredAddress/fullAddress',
                  schemaPath:
                    '#/properties/companyDetails/properties/registeredAddress/properties/fullAddress/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.fullAddress.type,
                  parentSchema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.fullAddress,
                  data: data23
                }
                if (vErrors === null) {
                  vErrors = [err32]
                } else {
                  vErrors.push(err32)
                }
                errors++
              }
            }
            if (data15.line2ToCounty !== undefined) {
              var data24 = data15.line2ToCounty
              if (typeof data24 !== 'string') {
                var err33 = {
                  instancePath:
                    instancePath +
                    '/companyDetails/registeredAddress/line2ToCounty',
                  schemaPath:
                    '#/properties/companyDetails/properties/registeredAddress/properties/line2ToCounty/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.line2ToCounty.type,
                  parentSchema:
                    schema38.properties.companyDetails.properties
                      .registeredAddress.properties.line2ToCounty,
                  data: data24
                }
                if (vErrors === null) {
                  vErrors = [err33]
                } else {
                  vErrors.push(err33)
                }
                errors++
              }
            }
          } else {
            var err34 = {
              instancePath: instancePath + '/companyDetails/registeredAddress',
              schemaPath:
                '#/properties/companyDetails/properties/registeredAddress/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
              schema:
                schema38.properties.companyDetails.properties.registeredAddress
                  .type,
              parentSchema:
                schema38.properties.companyDetails.properties.registeredAddress,
              data: data15
            }
            if (vErrors === null) {
              vErrors = [err34]
            } else {
              vErrors.push(err34)
            }
            errors++
          }
        }
      } else {
        var err35 = {
          instancePath: instancePath + '/companyDetails',
          schemaPath: '#/properties/companyDetails/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
          schema: schema38.properties.companyDetails.type,
          parentSchema: schema38.properties.companyDetails,
          data: data11
        }
        if (vErrors === null) {
          vErrors = [err35]
        } else {
          vErrors.push(err35)
        }
        errors++
      }
    }
    if (data.partnership !== undefined) {
      var data25 = data.partnership
      if (data25 && typeof data25 == 'object' && !Array.isArray(data25)) {
        if (data25.type === undefined) {
          var err36 = {
            instancePath: instancePath + '/partnership',
            schemaPath: '#/properties/partnership/required',
            keyword: 'required',
            params: { missingProperty: 'type' },
            message: "must have required property '" + 'type' + "'",
            schema: schema38.properties.partnership.required,
            parentSchema: schema38.properties.partnership,
            data: data25
          }
          if (vErrors === null) {
            vErrors = [err36]
          } else {
            vErrors.push(err36)
          }
          errors++
        }
        for (var key3 in data25) {
          if (!(key3 === 'type' || key3 === 'partners')) {
            var err37 = {
              instancePath: instancePath + '/partnership',
              schemaPath: '#/properties/partnership/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key3 },
              message: 'must NOT have additional properties',
              schema: false,
              parentSchema: schema38.properties.partnership,
              data: data25
            }
            if (vErrors === null) {
              vErrors = [err37]
            } else {
              vErrors.push(err37)
            }
            errors++
          }
        }
        if (data25.type !== undefined) {
          var data26 = data25.type
          if (typeof data26 !== 'string') {
            var err38 = {
              instancePath: instancePath + '/partnership/type',
              schemaPath: '#/properties/partnership/properties/type/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema: schema38.properties.partnership.properties.type.type,
              parentSchema: schema38.properties.partnership.properties.type,
              data: data26
            }
            if (vErrors === null) {
              vErrors = [err38]
            } else {
              vErrors.push(err38)
            }
            errors++
          }
          if (!(data26 === 'ltd' || data26 === 'ltd_liability')) {
            var err39 = {
              instancePath: instancePath + '/partnership/type',
              schemaPath: '#/properties/partnership/properties/type/enum',
              keyword: 'enum',
              params: {
                allowedValues:
                  schema38.properties.partnership.properties.type.enum
              },
              message: 'must be equal to one of the allowed values',
              schema: schema38.properties.partnership.properties.type.enum,
              parentSchema: schema38.properties.partnership.properties.type,
              data: data26
            }
            if (vErrors === null) {
              vErrors = [err39]
            } else {
              vErrors.push(err39)
            }
            errors++
          }
        }
        if (data25.partners !== undefined) {
          var data27 = data25.partners
          if (Array.isArray(data27)) {
            var len2 = data27.length
            for (var i2 = 0; i2 < len2; i2++) {
              var data28 = data27[i2]
              if (
                data28 &&
                typeof data28 == 'object' &&
                !Array.isArray(data28)
              ) {
                if (data28.name === undefined) {
                  var err40 = {
                    instancePath: instancePath + '/partnership/partners/' + i2,
                    schemaPath:
                      '#/properties/partnership/properties/partners/items/required',
                    keyword: 'required',
                    params: { missingProperty: 'name' },
                    message: "must have required property '" + 'name' + "'",
                    schema:
                      schema38.properties.partnership.properties.partners.items
                        .required,
                    parentSchema:
                      schema38.properties.partnership.properties.partners.items,
                    data: data28
                  }
                  if (vErrors === null) {
                    vErrors = [err40]
                  } else {
                    vErrors.push(err40)
                  }
                  errors++
                }
                if (data28.type === undefined) {
                  var err41 = {
                    instancePath: instancePath + '/partnership/partners/' + i2,
                    schemaPath:
                      '#/properties/partnership/properties/partners/items/required',
                    keyword: 'required',
                    params: { missingProperty: 'type' },
                    message: "must have required property '" + 'type' + "'",
                    schema:
                      schema38.properties.partnership.properties.partners.items
                        .required,
                    parentSchema:
                      schema38.properties.partnership.properties.partners.items,
                    data: data28
                  }
                  if (vErrors === null) {
                    vErrors = [err41]
                  } else {
                    vErrors.push(err41)
                  }
                  errors++
                }
                for (var key4 in data28) {
                  if (!(key4 === 'name' || key4 === 'type')) {
                    var err42 = {
                      instancePath:
                        instancePath + '/partnership/partners/' + i2,
                      schemaPath:
                        '#/properties/partnership/properties/partners/items/additionalProperties',
                      keyword: 'additionalProperties',
                      params: { additionalProperty: key4 },
                      message: 'must NOT have additional properties',
                      schema: false,
                      parentSchema:
                        schema38.properties.partnership.properties.partners
                          .items,
                      data: data28
                    }
                    if (vErrors === null) {
                      vErrors = [err42]
                    } else {
                      vErrors.push(err42)
                    }
                    errors++
                  }
                }
                if (data28.name !== undefined) {
                  var data29 = data28.name
                  if (typeof data29 !== 'string') {
                    var err43 = {
                      instancePath:
                        instancePath + '/partnership/partners/' + i2 + '/name',
                      schemaPath:
                        '#/properties/partnership/properties/partners/items/properties/name/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.partnership.properties.partners
                          .items.properties.name.type,
                      parentSchema:
                        schema38.properties.partnership.properties.partners
                          .items.properties.name,
                      data: data29
                    }
                    if (vErrors === null) {
                      vErrors = [err43]
                    } else {
                      vErrors.push(err43)
                    }
                    errors++
                  }
                }
                if (data28.type !== undefined) {
                  var data30 = data28.type
                  if (typeof data30 !== 'string') {
                    var err44 = {
                      instancePath:
                        instancePath + '/partnership/partners/' + i2 + '/type',
                      schemaPath:
                        '#/properties/partnership/properties/partners/items/properties/type/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.partnership.properties.partners
                          .items.properties.type.type,
                      parentSchema:
                        schema38.properties.partnership.properties.partners
                          .items.properties.type,
                      data: data30
                    }
                    if (vErrors === null) {
                      vErrors = [err44]
                    } else {
                      vErrors.push(err44)
                    }
                    errors++
                  }
                  if (!(data30 === 'company' || data30 === 'individual')) {
                    var err45 = {
                      instancePath:
                        instancePath + '/partnership/partners/' + i2 + '/type',
                      schemaPath:
                        '#/properties/partnership/properties/partners/items/properties/type/enum',
                      keyword: 'enum',
                      params: {
                        allowedValues:
                          schema38.properties.partnership.properties.partners
                            .items.properties.type.enum
                      },
                      message: 'must be equal to one of the allowed values',
                      schema:
                        schema38.properties.partnership.properties.partners
                          .items.properties.type.enum,
                      parentSchema:
                        schema38.properties.partnership.properties.partners
                          .items.properties.type,
                      data: data30
                    }
                    if (vErrors === null) {
                      vErrors = [err45]
                    } else {
                      vErrors.push(err45)
                    }
                    errors++
                  }
                }
              } else {
                var err46 = {
                  instancePath: instancePath + '/partnership/partners/' + i2,
                  schemaPath:
                    '#/properties/partnership/properties/partners/items/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                  schema:
                    schema38.properties.partnership.properties.partners.items
                      .type,
                  parentSchema:
                    schema38.properties.partnership.properties.partners.items,
                  data: data28
                }
                if (vErrors === null) {
                  vErrors = [err46]
                } else {
                  vErrors.push(err46)
                }
                errors++
              }
            }
          } else {
            var err47 = {
              instancePath: instancePath + '/partnership/partners',
              schemaPath: '#/properties/partnership/properties/partners/type',
              keyword: 'type',
              params: { type: 'array' },
              message: 'must be array',
              schema: schema38.properties.partnership.properties.partners.type,
              parentSchema: schema38.properties.partnership.properties.partners,
              data: data27
            }
            if (vErrors === null) {
              vErrors = [err47]
            } else {
              vErrors.push(err47)
            }
            errors++
          }
        }
      } else {
        var err48 = {
          instancePath: instancePath + '/partnership',
          schemaPath: '#/properties/partnership/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
          schema: schema38.properties.partnership.type,
          parentSchema: schema38.properties.partnership,
          data: data25
        }
        if (vErrors === null) {
          vErrors = [err48]
        } else {
          vErrors.push(err48)
        }
        errors++
      }
    }
    if (data.submitterContactDetails !== undefined) {
      var data31 = data.submitterContactDetails
      var _errs70 = errors
      var valid11 = false
      var _errs71 = errors
      if (data31 && typeof data31 == 'object' && !Array.isArray(data31)) {
        if (data31.role === undefined) {
          var err49 = {
            instancePath: instancePath + '/submitterContactDetails',
            schemaPath: '#/properties/submitterContactDetails/anyOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'role' },
            message: "must have required property '" + 'role' + "'",
            schema:
              schema38.properties.submitterContactDetails.anyOf[0].required,
            parentSchema: schema38.properties.submitterContactDetails.anyOf[0],
            data: data31
          }
          if (vErrors === null) {
            vErrors = [err49]
          } else {
            vErrors.push(err49)
          }
          errors++
        }
      }
      var _valid0 = _errs71 === errors
      valid11 = valid11 || _valid0
      if (!valid11) {
        var _errs72 = errors
        if (data31 && typeof data31 == 'object' && !Array.isArray(data31)) {
          if (data31.title === undefined) {
            var err50 = {
              instancePath: instancePath + '/submitterContactDetails',
              schemaPath:
                '#/properties/submitterContactDetails/anyOf/1/required',
              keyword: 'required',
              params: { missingProperty: 'title' },
              message: "must have required property '" + 'title' + "'",
              schema:
                schema38.properties.submitterContactDetails.anyOf[1].required,
              parentSchema:
                schema38.properties.submitterContactDetails.anyOf[1],
              data: data31
            }
            if (vErrors === null) {
              vErrors = [err50]
            } else {
              vErrors.push(err50)
            }
            errors++
          }
        }
        var _valid0 = _errs72 === errors
        valid11 = valid11 || _valid0
      }
      if (!valid11) {
        var err51 = {
          instancePath: instancePath + '/submitterContactDetails',
          schemaPath: '#/properties/submitterContactDetails/anyOf',
          keyword: 'anyOf',
          params: {},
          message: 'must match a schema in anyOf',
          schema: schema38.properties.submitterContactDetails.anyOf,
          parentSchema: schema38.properties.submitterContactDetails,
          data: data31
        }
        if (vErrors === null) {
          vErrors = [err51]
        } else {
          vErrors.push(err51)
        }
        errors++
      } else {
        errors = _errs70
        if (vErrors !== null) {
          if (_errs70) {
            vErrors.length = _errs70
          } else {
            vErrors = null
          }
        }
      }
      if (data31 && typeof data31 == 'object' && !Array.isArray(data31)) {
        if (data31.fullName === undefined) {
          var err52 = {
            instancePath: instancePath + '/submitterContactDetails',
            schemaPath: '#/properties/submitterContactDetails/required',
            keyword: 'required',
            params: { missingProperty: 'fullName' },
            message: "must have required property '" + 'fullName' + "'",
            schema: schema38.properties.submitterContactDetails.required,
            parentSchema: schema38.properties.submitterContactDetails,
            data: data31
          }
          if (vErrors === null) {
            vErrors = [err52]
          } else {
            vErrors.push(err52)
          }
          errors++
        }
        if (data31.email === undefined) {
          var err53 = {
            instancePath: instancePath + '/submitterContactDetails',
            schemaPath: '#/properties/submitterContactDetails/required',
            keyword: 'required',
            params: { missingProperty: 'email' },
            message: "must have required property '" + 'email' + "'",
            schema: schema38.properties.submitterContactDetails.required,
            parentSchema: schema38.properties.submitterContactDetails,
            data: data31
          }
          if (vErrors === null) {
            vErrors = [err53]
          } else {
            vErrors.push(err53)
          }
          errors++
        }
        if (data31.phone === undefined) {
          var err54 = {
            instancePath: instancePath + '/submitterContactDetails',
            schemaPath: '#/properties/submitterContactDetails/required',
            keyword: 'required',
            params: { missingProperty: 'phone' },
            message: "must have required property '" + 'phone' + "'",
            schema: schema38.properties.submitterContactDetails.required,
            parentSchema: schema38.properties.submitterContactDetails,
            data: data31
          }
          if (vErrors === null) {
            vErrors = [err54]
          } else {
            vErrors.push(err54)
          }
          errors++
        }
        for (var key5 in data31) {
          if (
            !(
              key5 === 'fullName' ||
              key5 === 'email' ||
              key5 === 'phone' ||
              key5 === 'role' ||
              key5 === 'title'
            )
          ) {
            var err55 = {
              instancePath: instancePath + '/submitterContactDetails',
              schemaPath:
                '#/properties/submitterContactDetails/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key5 },
              message: 'must NOT have additional properties',
              schema: false,
              parentSchema: schema38.properties.submitterContactDetails,
              data: data31
            }
            if (vErrors === null) {
              vErrors = [err55]
            } else {
              vErrors.push(err55)
            }
            errors++
          }
        }
        if (data31.fullName !== undefined) {
          var data32 = data31.fullName
          if (typeof data32 !== 'string') {
            var err56 = {
              instancePath: instancePath + '/submitterContactDetails/fullName',
              schemaPath:
                '#/properties/submitterContactDetails/properties/fullName/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema:
                schema38.properties.submitterContactDetails.properties.fullName
                  .type,
              parentSchema:
                schema38.properties.submitterContactDetails.properties.fullName,
              data: data32
            }
            if (vErrors === null) {
              vErrors = [err56]
            } else {
              vErrors.push(err56)
            }
            errors++
          }
        }
        if (data31.email !== undefined) {
          var data33 = data31.email
          if (typeof data33 === 'string') {
            if (!formats0.test(data33)) {
              var err57 = {
                instancePath: instancePath + '/submitterContactDetails/email',
                schemaPath:
                  '#/properties/submitterContactDetails/properties/email/format',
                keyword: 'format',
                params: { format: 'email' },
                message: 'must match format "' + 'email' + '"',
                schema: 'email',
                parentSchema:
                  schema38.properties.submitterContactDetails.properties.email,
                data: data33
              }
              if (vErrors === null) {
                vErrors = [err57]
              } else {
                vErrors.push(err57)
              }
              errors++
            }
          } else {
            var err58 = {
              instancePath: instancePath + '/submitterContactDetails/email',
              schemaPath:
                '#/properties/submitterContactDetails/properties/email/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema:
                schema38.properties.submitterContactDetails.properties.email
                  .type,
              parentSchema:
                schema38.properties.submitterContactDetails.properties.email,
              data: data33
            }
            if (vErrors === null) {
              vErrors = [err58]
            } else {
              vErrors.push(err58)
            }
            errors++
          }
        }
        if (data31.phone !== undefined) {
          var data34 = data31.phone
          if (typeof data34 !== 'string') {
            var err59 = {
              instancePath: instancePath + '/submitterContactDetails/phone',
              schemaPath:
                '#/properties/submitterContactDetails/properties/phone/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema:
                schema38.properties.submitterContactDetails.properties.phone
                  .type,
              parentSchema:
                schema38.properties.submitterContactDetails.properties.phone,
              data: data34
            }
            if (vErrors === null) {
              vErrors = [err59]
            } else {
              vErrors.push(err59)
            }
            errors++
          }
        }
        if (data31.role !== undefined) {
          var data35 = data31.role
          if (typeof data35 !== 'string') {
            var err60 = {
              instancePath: instancePath + '/submitterContactDetails/role',
              schemaPath:
                '#/properties/submitterContactDetails/properties/role/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema:
                schema38.properties.submitterContactDetails.properties.role
                  .type,
              parentSchema:
                schema38.properties.submitterContactDetails.properties.role,
              data: data35
            }
            if (vErrors === null) {
              vErrors = [err60]
            } else {
              vErrors.push(err60)
            }
            errors++
          }
        }
        if (data31.title !== undefined) {
          var data36 = data31.title
          if (typeof data36 !== 'string') {
            var err61 = {
              instancePath: instancePath + '/submitterContactDetails/title',
              schemaPath:
                '#/properties/submitterContactDetails/properties/title/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema:
                schema38.properties.submitterContactDetails.properties.title
                  .type,
              parentSchema:
                schema38.properties.submitterContactDetails.properties.title,
              data: data36
            }
            if (vErrors === null) {
              vErrors = [err61]
            } else {
              vErrors.push(err61)
            }
            errors++
          }
        }
      } else {
        var err62 = {
          instancePath: instancePath + '/submitterContactDetails',
          schemaPath: '#/properties/submitterContactDetails/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
          schema: schema38.properties.submitterContactDetails.type,
          parentSchema: schema38.properties.submitterContactDetails,
          data: data31
        }
        if (vErrors === null) {
          vErrors = [err62]
        } else {
          vErrors.push(err62)
        }
        errors++
      }
    }
    if (data.managementContactDetails !== undefined) {
      var data37 = data.managementContactDetails
      var _errs86 = errors
      var valid13 = false
      var _errs87 = errors
      if (data37 && typeof data37 == 'object' && !Array.isArray(data37)) {
        if (data37.role === undefined) {
          var err63 = {
            instancePath: instancePath + '/managementContactDetails',
            schemaPath:
              '#/properties/managementContactDetails/anyOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'role' },
            message: "must have required property '" + 'role' + "'",
            schema:
              schema38.properties.managementContactDetails.anyOf[0].required,
            parentSchema: schema38.properties.managementContactDetails.anyOf[0],
            data: data37
          }
          if (vErrors === null) {
            vErrors = [err63]
          } else {
            vErrors.push(err63)
          }
          errors++
        }
      }
      var _valid1 = _errs87 === errors
      valid13 = valid13 || _valid1
      if (!valid13) {
        var _errs88 = errors
        if (data37 && typeof data37 == 'object' && !Array.isArray(data37)) {
          if (data37.title === undefined) {
            var err64 = {
              instancePath: instancePath + '/managementContactDetails',
              schemaPath:
                '#/properties/managementContactDetails/anyOf/1/required',
              keyword: 'required',
              params: { missingProperty: 'title' },
              message: "must have required property '" + 'title' + "'",
              schema:
                schema38.properties.managementContactDetails.anyOf[1].required,
              parentSchema:
                schema38.properties.managementContactDetails.anyOf[1],
              data: data37
            }
            if (vErrors === null) {
              vErrors = [err64]
            } else {
              vErrors.push(err64)
            }
            errors++
          }
        }
        var _valid1 = _errs88 === errors
        valid13 = valid13 || _valid1
      }
      if (!valid13) {
        var err65 = {
          instancePath: instancePath + '/managementContactDetails',
          schemaPath: '#/properties/managementContactDetails/anyOf',
          keyword: 'anyOf',
          params: {},
          message: 'must match a schema in anyOf',
          schema: schema38.properties.managementContactDetails.anyOf,
          parentSchema: schema38.properties.managementContactDetails,
          data: data37
        }
        if (vErrors === null) {
          vErrors = [err65]
        } else {
          vErrors.push(err65)
        }
        errors++
      } else {
        errors = _errs86
        if (vErrors !== null) {
          if (_errs86) {
            vErrors.length = _errs86
          } else {
            vErrors = null
          }
        }
      }
      if (data37 && typeof data37 == 'object' && !Array.isArray(data37)) {
        if (data37.fullName === undefined) {
          var err66 = {
            instancePath: instancePath + '/managementContactDetails',
            schemaPath: '#/properties/managementContactDetails/required',
            keyword: 'required',
            params: { missingProperty: 'fullName' },
            message: "must have required property '" + 'fullName' + "'",
            schema: schema38.properties.managementContactDetails.required,
            parentSchema: schema38.properties.managementContactDetails,
            data: data37
          }
          if (vErrors === null) {
            vErrors = [err66]
          } else {
            vErrors.push(err66)
          }
          errors++
        }
        if (data37.email === undefined) {
          var err67 = {
            instancePath: instancePath + '/managementContactDetails',
            schemaPath: '#/properties/managementContactDetails/required',
            keyword: 'required',
            params: { missingProperty: 'email' },
            message: "must have required property '" + 'email' + "'",
            schema: schema38.properties.managementContactDetails.required,
            parentSchema: schema38.properties.managementContactDetails,
            data: data37
          }
          if (vErrors === null) {
            vErrors = [err67]
          } else {
            vErrors.push(err67)
          }
          errors++
        }
        if (data37.phone === undefined) {
          var err68 = {
            instancePath: instancePath + '/managementContactDetails',
            schemaPath: '#/properties/managementContactDetails/required',
            keyword: 'required',
            params: { missingProperty: 'phone' },
            message: "must have required property '" + 'phone' + "'",
            schema: schema38.properties.managementContactDetails.required,
            parentSchema: schema38.properties.managementContactDetails,
            data: data37
          }
          if (vErrors === null) {
            vErrors = [err68]
          } else {
            vErrors.push(err68)
          }
          errors++
        }
        for (var key6 in data37) {
          if (
            !(
              key6 === 'fullName' ||
              key6 === 'email' ||
              key6 === 'phone' ||
              key6 === 'role' ||
              key6 === 'title'
            )
          ) {
            var err69 = {
              instancePath: instancePath + '/managementContactDetails',
              schemaPath:
                '#/properties/managementContactDetails/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key6 },
              message: 'must NOT have additional properties',
              schema: false,
              parentSchema: schema38.properties.managementContactDetails,
              data: data37
            }
            if (vErrors === null) {
              vErrors = [err69]
            } else {
              vErrors.push(err69)
            }
            errors++
          }
        }
        if (data37.fullName !== undefined) {
          var data38 = data37.fullName
          if (typeof data38 !== 'string') {
            var err70 = {
              instancePath: instancePath + '/managementContactDetails/fullName',
              schemaPath:
                '#/properties/managementContactDetails/properties/fullName/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema:
                schema38.properties.managementContactDetails.properties.fullName
                  .type,
              parentSchema:
                schema38.properties.managementContactDetails.properties
                  .fullName,
              data: data38
            }
            if (vErrors === null) {
              vErrors = [err70]
            } else {
              vErrors.push(err70)
            }
            errors++
          }
        }
        if (data37.email !== undefined) {
          var data39 = data37.email
          if (typeof data39 === 'string') {
            if (!formats0.test(data39)) {
              var err71 = {
                instancePath: instancePath + '/managementContactDetails/email',
                schemaPath:
                  '#/properties/managementContactDetails/properties/email/format',
                keyword: 'format',
                params: { format: 'email' },
                message: 'must match format "' + 'email' + '"',
                schema: 'email',
                parentSchema:
                  schema38.properties.managementContactDetails.properties.email,
                data: data39
              }
              if (vErrors === null) {
                vErrors = [err71]
              } else {
                vErrors.push(err71)
              }
              errors++
            }
          } else {
            var err72 = {
              instancePath: instancePath + '/managementContactDetails/email',
              schemaPath:
                '#/properties/managementContactDetails/properties/email/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema:
                schema38.properties.managementContactDetails.properties.email
                  .type,
              parentSchema:
                schema38.properties.managementContactDetails.properties.email,
              data: data39
            }
            if (vErrors === null) {
              vErrors = [err72]
            } else {
              vErrors.push(err72)
            }
            errors++
          }
        }
        if (data37.phone !== undefined) {
          var data40 = data37.phone
          if (typeof data40 !== 'string') {
            var err73 = {
              instancePath: instancePath + '/managementContactDetails/phone',
              schemaPath:
                '#/properties/managementContactDetails/properties/phone/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema:
                schema38.properties.managementContactDetails.properties.phone
                  .type,
              parentSchema:
                schema38.properties.managementContactDetails.properties.phone,
              data: data40
            }
            if (vErrors === null) {
              vErrors = [err73]
            } else {
              vErrors.push(err73)
            }
            errors++
          }
        }
        if (data37.role !== undefined) {
          var data41 = data37.role
          if (typeof data41 !== 'string') {
            var err74 = {
              instancePath: instancePath + '/managementContactDetails/role',
              schemaPath:
                '#/properties/managementContactDetails/properties/role/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema:
                schema38.properties.managementContactDetails.properties.role
                  .type,
              parentSchema:
                schema38.properties.managementContactDetails.properties.role,
              data: data41
            }
            if (vErrors === null) {
              vErrors = [err74]
            } else {
              vErrors.push(err74)
            }
            errors++
          }
        }
        if (data37.title !== undefined) {
          var data42 = data37.title
          if (typeof data42 !== 'string') {
            var err75 = {
              instancePath: instancePath + '/managementContactDetails/title',
              schemaPath:
                '#/properties/managementContactDetails/properties/title/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
              schema:
                schema38.properties.managementContactDetails.properties.title
                  .type,
              parentSchema:
                schema38.properties.managementContactDetails.properties.title,
              data: data42
            }
            if (vErrors === null) {
              vErrors = [err75]
            } else {
              vErrors.push(err75)
            }
            errors++
          }
        }
      } else {
        var err76 = {
          instancePath: instancePath + '/managementContactDetails',
          schemaPath: '#/properties/managementContactDetails/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
          schema: schema38.properties.managementContactDetails.type,
          parentSchema: schema38.properties.managementContactDetails,
          data: data37
        }
        if (vErrors === null) {
          vErrors = [err76]
        } else {
          vErrors.push(err76)
        }
        errors++
      }
    }
    if (data.formSubmissionTime !== undefined) {
      var data43 = data.formSubmissionTime
      if (typeof data43 === 'string') {
        if (!formats4.validate(data43)) {
          var err77 = {
            instancePath: instancePath + '/formSubmissionTime',
            schemaPath: '#/properties/formSubmissionTime/format',
            keyword: 'format',
            params: { format: 'date-time' },
            message: 'must match format "' + 'date-time' + '"',
            schema: 'date-time',
            parentSchema: schema38.properties.formSubmissionTime,
            data: data43
          }
          if (vErrors === null) {
            vErrors = [err77]
          } else {
            vErrors.push(err77)
          }
          errors++
        }
      } else {
        var err78 = {
          instancePath: instancePath + '/formSubmissionTime',
          schemaPath: '#/properties/formSubmissionTime/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
          schema: schema38.properties.formSubmissionTime.type,
          parentSchema: schema38.properties.formSubmissionTime,
          data: data43
        }
        if (vErrors === null) {
          vErrors = [err78]
        } else {
          vErrors.push(err78)
        }
        errors++
      }
    }
    if (data.submittedToRegulator !== undefined) {
      var data44 = data.submittedToRegulator
      if (typeof data44 !== 'string') {
        var err79 = {
          instancePath: instancePath + '/submittedToRegulator',
          schemaPath: '#/properties/submittedToRegulator/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
          schema: schema38.properties.submittedToRegulator.type,
          parentSchema: schema38.properties.submittedToRegulator,
          data: data44
        }
        if (vErrors === null) {
          vErrors = [err79]
        } else {
          vErrors.push(err79)
        }
        errors++
      }
      if (
        !(
          data44 === 'ea' ||
          data44 === 'nrw' ||
          data44 === 'sepa' ||
          data44 === 'niea'
        )
      ) {
        var err80 = {
          instancePath: instancePath + '/submittedToRegulator',
          schemaPath: '#/properties/submittedToRegulator/enum',
          keyword: 'enum',
          params: {
            allowedValues: schema38.properties.submittedToRegulator.enum
          },
          message: 'must be equal to one of the allowed values',
          schema: schema38.properties.submittedToRegulator.enum,
          parentSchema: schema38.properties.submittedToRegulator,
          data: data44
        }
        if (vErrors === null) {
          vErrors = [err80]
        } else {
          vErrors.push(err80)
        }
        errors++
      }
    }
    if (data.registrations !== undefined) {
      var data45 = data.registrations
      if (Array.isArray(data45)) {
        var len3 = data45.length
        for (var i3 = 0; i3 < len3; i3++) {
          var data46 = data45[i3]
          if (data46 && typeof data46 == 'object' && !Array.isArray(data46)) {
            if (data46.id === undefined) {
              var err81 = {
                instancePath: instancePath + '/registrations/' + i3,
                schemaPath: '#/properties/registrations/items/required',
                keyword: 'required',
                params: { missingProperty: 'id' },
                message: "must have required property '" + 'id' + "'",
                schema: schema38.properties.registrations.items.required,
                parentSchema: schema38.properties.registrations.items,
                data: data46
              }
              if (vErrors === null) {
                vErrors = [err81]
              } else {
                vErrors.push(err81)
              }
              errors++
            }
            if (data46.formSubmissionTime === undefined) {
              var err82 = {
                instancePath: instancePath + '/registrations/' + i3,
                schemaPath: '#/properties/registrations/items/required',
                keyword: 'required',
                params: { missingProperty: 'formSubmissionTime' },
                message:
                  "must have required property '" + 'formSubmissionTime' + "'",
                schema: schema38.properties.registrations.items.required,
                parentSchema: schema38.properties.registrations.items,
                data: data46
              }
              if (vErrors === null) {
                vErrors = [err82]
              } else {
                vErrors.push(err82)
              }
              errors++
            }
            if (data46.submittedToRegulator === undefined) {
              var err83 = {
                instancePath: instancePath + '/registrations/' + i3,
                schemaPath: '#/properties/registrations/items/required',
                keyword: 'required',
                params: { missingProperty: 'submittedToRegulator' },
                message:
                  "must have required property '" +
                  'submittedToRegulator' +
                  "'",
                schema: schema38.properties.registrations.items.required,
                parentSchema: schema38.properties.registrations.items,
                data: data46
              }
              if (vErrors === null) {
                vErrors = [err83]
              } else {
                vErrors.push(err83)
              }
              errors++
            }
            if (data46.material === undefined) {
              var err84 = {
                instancePath: instancePath + '/registrations/' + i3,
                schemaPath: '#/properties/registrations/items/required',
                keyword: 'required',
                params: { missingProperty: 'material' },
                message: "must have required property '" + 'material' + "'",
                schema: schema38.properties.registrations.items.required,
                parentSchema: schema38.properties.registrations.items,
                data: data46
              }
              if (vErrors === null) {
                vErrors = [err84]
              } else {
                vErrors.push(err84)
              }
              errors++
            }
            if (data46.wasteProcessingType === undefined) {
              var err85 = {
                instancePath: instancePath + '/registrations/' + i3,
                schemaPath: '#/properties/registrations/items/required',
                keyword: 'required',
                params: { missingProperty: 'wasteProcessingType' },
                message:
                  "must have required property '" + 'wasteProcessingType' + "'",
                schema: schema38.properties.registrations.items.required,
                parentSchema: schema38.properties.registrations.items,
                data: data46
              }
              if (vErrors === null) {
                vErrors = [err85]
              } else {
                vErrors.push(err85)
              }
              errors++
            }
            for (var key7 in data46) {
              if (
                !func4.call(
                  schema38.properties.registrations.items.properties,
                  key7
                )
              ) {
                var err86 = {
                  instancePath: instancePath + '/registrations/' + i3,
                  schemaPath:
                    '#/properties/registrations/items/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key7 },
                  message: 'must NOT have additional properties',
                  schema: false,
                  parentSchema: schema38.properties.registrations.items,
                  data: data46
                }
                if (vErrors === null) {
                  vErrors = [err86]
                } else {
                  vErrors.push(err86)
                }
                errors++
              }
            }
            if (data46.id !== undefined) {
              var data47 = data46.id
              if (typeof data47 !== 'string') {
                var err87 = {
                  instancePath: instancePath + '/registrations/' + i3 + '/id',
                  schemaPath:
                    '#/properties/registrations/items/properties/id/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.registrations.items.properties.id.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties.id,
                  data: data47
                }
                if (vErrors === null) {
                  vErrors = [err87]
                } else {
                  vErrors.push(err87)
                }
                errors++
              }
            }
            if (data46.statusHistory !== undefined) {
              var data48 = data46.statusHistory
              if (Array.isArray(data48)) {
                var len4 = data48.length
                for (var i4 = 0; i4 < len4; i4++) {
                  var data49 = data48[i4]
                  if (
                    data49 &&
                    typeof data49 == 'object' &&
                    !Array.isArray(data49)
                  ) {
                    if (data49.status === undefined) {
                      var err88 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/statusHistory/' +
                          i4,
                        schemaPath:
                          '#/properties/registrations/items/properties/statusHistory/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'status' },
                        message:
                          "must have required property '" + 'status' + "'",
                        schema:
                          schema38.properties.registrations.items.properties
                            .statusHistory.items.required,
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .statusHistory.items,
                        data: data49
                      }
                      if (vErrors === null) {
                        vErrors = [err88]
                      } else {
                        vErrors.push(err88)
                      }
                      errors++
                    }
                    if (data49.updatedAt === undefined) {
                      var err89 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/statusHistory/' +
                          i4,
                        schemaPath:
                          '#/properties/registrations/items/properties/statusHistory/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'updatedAt' },
                        message:
                          "must have required property '" + 'updatedAt' + "'",
                        schema:
                          schema38.properties.registrations.items.properties
                            .statusHistory.items.required,
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .statusHistory.items,
                        data: data49
                      }
                      if (vErrors === null) {
                        vErrors = [err89]
                      } else {
                        vErrors.push(err89)
                      }
                      errors++
                    }
                    for (var key8 in data49) {
                      if (
                        !(
                          key8 === 'status' ||
                          key8 === 'updatedAt' ||
                          key8 === 'updatedBy'
                        )
                      ) {
                        var err90 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/statusHistory/' +
                            i4,
                          schemaPath:
                            '#/properties/registrations/items/properties/statusHistory/items/additionalProperties',
                          keyword: 'additionalProperties',
                          params: { additionalProperty: key8 },
                          message: 'must NOT have additional properties',
                          schema: false,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .statusHistory.items,
                          data: data49
                        }
                        if (vErrors === null) {
                          vErrors = [err90]
                        } else {
                          vErrors.push(err90)
                        }
                        errors++
                      }
                    }
                    if (data49.status !== undefined) {
                      var data50 = data49.status
                      if (typeof data50 !== 'string') {
                        var err91 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/statusHistory/' +
                            i4 +
                            '/status',
                          schemaPath:
                            '#/properties/registrations/items/properties/statusHistory/items/properties/status/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .statusHistory.items.properties.status.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .statusHistory.items.properties.status,
                          data: data50
                        }
                        if (vErrors === null) {
                          vErrors = [err91]
                        } else {
                          vErrors.push(err91)
                        }
                        errors++
                      }
                      if (
                        !(
                          data50 === 'created' ||
                          data50 === 'approved' ||
                          data50 === 'rejected' ||
                          data50 === 'suspended' ||
                          data50 === 'archived'
                        )
                      ) {
                        var err92 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/statusHistory/' +
                            i4 +
                            '/status',
                          schemaPath:
                            '#/properties/registrations/items/properties/statusHistory/items/properties/status/enum',
                          keyword: 'enum',
                          params: {
                            allowedValues:
                              schema38.properties.registrations.items.properties
                                .statusHistory.items.properties.status.enum
                          },
                          message: 'must be equal to one of the allowed values',
                          schema:
                            schema38.properties.registrations.items.properties
                              .statusHistory.items.properties.status.enum,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .statusHistory.items.properties.status,
                          data: data50
                        }
                        if (vErrors === null) {
                          vErrors = [err92]
                        } else {
                          vErrors.push(err92)
                        }
                        errors++
                      }
                    }
                    if (data49.updatedAt !== undefined) {
                      var data51 = data49.updatedAt
                      if (typeof data51 === 'string') {
                        if (!formats4.validate(data51)) {
                          var err93 = {
                            instancePath:
                              instancePath +
                              '/registrations/' +
                              i3 +
                              '/statusHistory/' +
                              i4 +
                              '/updatedAt',
                            schemaPath:
                              '#/properties/registrations/items/properties/statusHistory/items/properties/updatedAt/format',
                            keyword: 'format',
                            params: { format: 'date-time' },
                            message: 'must match format "' + 'date-time' + '"',
                            schema: 'date-time',
                            parentSchema:
                              schema38.properties.registrations.items.properties
                                .statusHistory.items.properties.updatedAt,
                            data: data51
                          }
                          if (vErrors === null) {
                            vErrors = [err93]
                          } else {
                            vErrors.push(err93)
                          }
                          errors++
                        }
                      } else {
                        var err94 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/statusHistory/' +
                            i4 +
                            '/updatedAt',
                          schemaPath:
                            '#/properties/registrations/items/properties/statusHistory/items/properties/updatedAt/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .statusHistory.items.properties.updatedAt.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .statusHistory.items.properties.updatedAt,
                          data: data51
                        }
                        if (vErrors === null) {
                          vErrors = [err94]
                        } else {
                          vErrors.push(err94)
                        }
                        errors++
                      }
                    }
                    if (data49.updatedBy !== undefined) {
                      var data52 = data49.updatedBy
                      if (typeof data52 !== 'string') {
                        var err95 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/statusHistory/' +
                            i4 +
                            '/updatedBy',
                          schemaPath:
                            '#/properties/registrations/items/properties/statusHistory/items/properties/updatedBy/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .statusHistory.items.properties.updatedBy.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .statusHistory.items.properties.updatedBy,
                          data: data52
                        }
                        if (vErrors === null) {
                          vErrors = [err95]
                        } else {
                          vErrors.push(err95)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err96 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/statusHistory/' +
                        i4,
                      schemaPath:
                        '#/properties/registrations/items/properties/statusHistory/items/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                      schema:
                        schema38.properties.registrations.items.properties
                          .statusHistory.items.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .statusHistory.items,
                      data: data49
                    }
                    if (vErrors === null) {
                      vErrors = [err96]
                    } else {
                      vErrors.push(err96)
                    }
                    errors++
                  }
                }
              } else {
                var err97 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/statusHistory',
                  schemaPath:
                    '#/properties/registrations/items/properties/statusHistory/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                  schema:
                    schema38.properties.registrations.items.properties
                      .statusHistory.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .statusHistory,
                  data: data48
                }
                if (vErrors === null) {
                  vErrors = [err97]
                } else {
                  vErrors.push(err97)
                }
                errors++
              }
            }
            if (data46.status !== undefined) {
              var data53 = data46.status
              if (typeof data53 !== 'string') {
                var err98 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/status',
                  schemaPath:
                    '#/properties/registrations/items/properties/status/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.registrations.items.properties.status
                      .type,
                  parentSchema:
                    schema38.properties.registrations.items.properties.status,
                  data: data53
                }
                if (vErrors === null) {
                  vErrors = [err98]
                } else {
                  vErrors.push(err98)
                }
                errors++
              }
              if (
                !(
                  data53 === 'created' ||
                  data53 === 'approved' ||
                  data53 === 'rejected' ||
                  data53 === 'suspended' ||
                  data53 === 'archived'
                )
              ) {
                var err99 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/status',
                  schemaPath:
                    '#/properties/registrations/items/properties/status/enum',
                  keyword: 'enum',
                  params: {
                    allowedValues:
                      schema38.properties.registrations.items.properties.status
                        .enum
                  },
                  message: 'must be equal to one of the allowed values',
                  schema:
                    schema38.properties.registrations.items.properties.status
                      .enum,
                  parentSchema:
                    schema38.properties.registrations.items.properties.status,
                  data: data53
                }
                if (vErrors === null) {
                  vErrors = [err99]
                } else {
                  vErrors.push(err99)
                }
                errors++
              }
            }
            if (data46.formSubmissionTime !== undefined) {
              var data54 = data46.formSubmissionTime
              if (typeof data54 === 'string') {
                if (!formats4.validate(data54)) {
                  var err100 = {
                    instancePath:
                      instancePath +
                      '/registrations/' +
                      i3 +
                      '/formSubmissionTime',
                    schemaPath:
                      '#/properties/registrations/items/properties/formSubmissionTime/format',
                    keyword: 'format',
                    params: { format: 'date-time' },
                    message: 'must match format "' + 'date-time' + '"',
                    schema: 'date-time',
                    parentSchema:
                      schema38.properties.registrations.items.properties
                        .formSubmissionTime,
                    data: data54
                  }
                  if (vErrors === null) {
                    vErrors = [err100]
                  } else {
                    vErrors.push(err100)
                  }
                  errors++
                }
              } else {
                var err101 = {
                  instancePath:
                    instancePath +
                    '/registrations/' +
                    i3 +
                    '/formSubmissionTime',
                  schemaPath:
                    '#/properties/registrations/items/properties/formSubmissionTime/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.registrations.items.properties
                      .formSubmissionTime.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .formSubmissionTime,
                  data: data54
                }
                if (vErrors === null) {
                  vErrors = [err101]
                } else {
                  vErrors.push(err101)
                }
                errors++
              }
            }
            if (data46.submittedToRegulator !== undefined) {
              var data55 = data46.submittedToRegulator
              if (typeof data55 !== 'string') {
                var err102 = {
                  instancePath:
                    instancePath +
                    '/registrations/' +
                    i3 +
                    '/submittedToRegulator',
                  schemaPath:
                    '#/properties/registrations/items/properties/submittedToRegulator/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.registrations.items.properties
                      .submittedToRegulator.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .submittedToRegulator,
                  data: data55
                }
                if (vErrors === null) {
                  vErrors = [err102]
                } else {
                  vErrors.push(err102)
                }
                errors++
              }
              if (
                !(
                  data55 === 'ea' ||
                  data55 === 'nrw' ||
                  data55 === 'sepa' ||
                  data55 === 'niea'
                )
              ) {
                var err103 = {
                  instancePath:
                    instancePath +
                    '/registrations/' +
                    i3 +
                    '/submittedToRegulator',
                  schemaPath:
                    '#/properties/registrations/items/properties/submittedToRegulator/enum',
                  keyword: 'enum',
                  params: {
                    allowedValues:
                      schema38.properties.registrations.items.properties
                        .submittedToRegulator.enum
                  },
                  message: 'must be equal to one of the allowed values',
                  schema:
                    schema38.properties.registrations.items.properties
                      .submittedToRegulator.enum,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .submittedToRegulator,
                  data: data55
                }
                if (vErrors === null) {
                  vErrors = [err103]
                } else {
                  vErrors.push(err103)
                }
                errors++
              }
            }
            if (data46.orgName !== undefined) {
              var data56 = data46.orgName
              if (typeof data56 !== 'string') {
                var err104 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/orgName',
                  schemaPath:
                    '#/properties/registrations/items/properties/orgName/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.registrations.items.properties.orgName
                      .type,
                  parentSchema:
                    schema38.properties.registrations.items.properties.orgName,
                  data: data56
                }
                if (vErrors === null) {
                  vErrors = [err104]
                } else {
                  vErrors.push(err104)
                }
                errors++
              }
            }
            if (data46.site !== undefined) {
              var data57 = data46.site
              if (
                data57 &&
                typeof data57 == 'object' &&
                !Array.isArray(data57)
              ) {
                if (data57.address === undefined) {
                  var err105 = {
                    instancePath:
                      instancePath + '/registrations/' + i3 + '/site',
                    schemaPath:
                      '#/properties/registrations/items/properties/site/required',
                    keyword: 'required',
                    params: { missingProperty: 'address' },
                    message: "must have required property '" + 'address' + "'",
                    schema:
                      schema38.properties.registrations.items.properties.site
                        .required,
                    parentSchema:
                      schema38.properties.registrations.items.properties.site,
                    data: data57
                  }
                  if (vErrors === null) {
                    vErrors = [err105]
                  } else {
                    vErrors.push(err105)
                  }
                  errors++
                }
                for (var key9 in data57) {
                  if (
                    !(
                      key9 === 'address' ||
                      key9 === 'gridReference' ||
                      key9 === 'siteCapacity'
                    )
                  ) {
                    var err106 = {
                      instancePath:
                        instancePath + '/registrations/' + i3 + '/site',
                      schemaPath:
                        '#/properties/registrations/items/properties/site/additionalProperties',
                      keyword: 'additionalProperties',
                      params: { additionalProperty: key9 },
                      message: 'must NOT have additional properties',
                      schema: false,
                      parentSchema:
                        schema38.properties.registrations.items.properties.site,
                      data: data57
                    }
                    if (vErrors === null) {
                      vErrors = [err106]
                    } else {
                      vErrors.push(err106)
                    }
                    errors++
                  }
                }
                if (data57.address !== undefined) {
                  var data58 = data57.address
                  if (
                    data58 &&
                    typeof data58 == 'object' &&
                    !Array.isArray(data58)
                  ) {
                    for (var key10 in data58) {
                      if (
                        !func4.call(
                          schema38.properties.registrations.items.properties
                            .site.properties.address.properties,
                          key10
                        )
                      ) {
                        var err107 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/site/address',
                          schemaPath:
                            '#/properties/registrations/items/properties/site/properties/address/additionalProperties',
                          keyword: 'additionalProperties',
                          params: { additionalProperty: key10 },
                          message: 'must NOT have additional properties',
                          schema: false,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address,
                          data: data58
                        }
                        if (vErrors === null) {
                          vErrors = [err107]
                        } else {
                          vErrors.push(err107)
                        }
                        errors++
                      }
                    }
                    if (data58.line1 !== undefined) {
                      var data59 = data58.line1
                      if (typeof data59 !== 'string') {
                        var err108 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/site/address/line1',
                          schemaPath:
                            '#/properties/registrations/items/properties/site/properties/address/properties/line1/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.line1.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.line1,
                          data: data59
                        }
                        if (vErrors === null) {
                          vErrors = [err108]
                        } else {
                          vErrors.push(err108)
                        }
                        errors++
                      }
                    }
                    if (data58.line2 !== undefined) {
                      var data60 = data58.line2
                      if (typeof data60 !== 'string') {
                        var err109 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/site/address/line2',
                          schemaPath:
                            '#/properties/registrations/items/properties/site/properties/address/properties/line2/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.line2.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.line2,
                          data: data60
                        }
                        if (vErrors === null) {
                          vErrors = [err109]
                        } else {
                          vErrors.push(err109)
                        }
                        errors++
                      }
                    }
                    if (data58.town !== undefined) {
                      var data61 = data58.town
                      if (typeof data61 !== 'string') {
                        var err110 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/site/address/town',
                          schemaPath:
                            '#/properties/registrations/items/properties/site/properties/address/properties/town/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.town.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.town,
                          data: data61
                        }
                        if (vErrors === null) {
                          vErrors = [err110]
                        } else {
                          vErrors.push(err110)
                        }
                        errors++
                      }
                    }
                    if (data58.county !== undefined) {
                      var data62 = data58.county
                      if (typeof data62 !== 'string') {
                        var err111 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/site/address/county',
                          schemaPath:
                            '#/properties/registrations/items/properties/site/properties/address/properties/county/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.county.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.county,
                          data: data62
                        }
                        if (vErrors === null) {
                          vErrors = [err111]
                        } else {
                          vErrors.push(err111)
                        }
                        errors++
                      }
                    }
                    if (data58.country !== undefined) {
                      var data63 = data58.country
                      if (typeof data63 !== 'string') {
                        var err112 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/site/address/country',
                          schemaPath:
                            '#/properties/registrations/items/properties/site/properties/address/properties/country/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.country.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.country,
                          data: data63
                        }
                        if (vErrors === null) {
                          vErrors = [err112]
                        } else {
                          vErrors.push(err112)
                        }
                        errors++
                      }
                    }
                    if (data58.postcode !== undefined) {
                      var data64 = data58.postcode
                      if (typeof data64 !== 'string') {
                        var err113 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/site/address/postcode',
                          schemaPath:
                            '#/properties/registrations/items/properties/site/properties/address/properties/postcode/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.postcode.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.postcode,
                          data: data64
                        }
                        if (vErrors === null) {
                          vErrors = [err113]
                        } else {
                          vErrors.push(err113)
                        }
                        errors++
                      }
                    }
                    if (data58.region !== undefined) {
                      var data65 = data58.region
                      if (typeof data65 !== 'string') {
                        var err114 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/site/address/region',
                          schemaPath:
                            '#/properties/registrations/items/properties/site/properties/address/properties/region/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.region.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.region,
                          data: data65
                        }
                        if (vErrors === null) {
                          vErrors = [err114]
                        } else {
                          vErrors.push(err114)
                        }
                        errors++
                      }
                    }
                    if (data58.fullAddress !== undefined) {
                      var data66 = data58.fullAddress
                      if (typeof data66 !== 'string') {
                        var err115 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/site/address/fullAddress',
                          schemaPath:
                            '#/properties/registrations/items/properties/site/properties/address/properties/fullAddress/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.fullAddress
                              .type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.fullAddress,
                          data: data66
                        }
                        if (vErrors === null) {
                          vErrors = [err115]
                        } else {
                          vErrors.push(err115)
                        }
                        errors++
                      }
                    }
                    if (data58.line2ToCounty !== undefined) {
                      var data67 = data58.line2ToCounty
                      if (typeof data67 !== 'string') {
                        var err116 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/site/address/line2ToCounty',
                          schemaPath:
                            '#/properties/registrations/items/properties/site/properties/address/properties/line2ToCounty/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.line2ToCounty
                              .type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .site.properties.address.properties.line2ToCounty,
                          data: data67
                        }
                        if (vErrors === null) {
                          vErrors = [err116]
                        } else {
                          vErrors.push(err116)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err117 = {
                      instancePath:
                        instancePath + '/registrations/' + i3 + '/site/address',
                      schemaPath:
                        '#/properties/registrations/items/properties/site/properties/address/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                      schema:
                        schema38.properties.registrations.items.properties.site
                          .properties.address.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties.site
                          .properties.address,
                      data: data58
                    }
                    if (vErrors === null) {
                      vErrors = [err117]
                    } else {
                      vErrors.push(err117)
                    }
                    errors++
                  }
                }
                if (data57.gridReference !== undefined) {
                  var data68 = data57.gridReference
                  if (typeof data68 !== 'string') {
                    var err118 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/site/gridReference',
                      schemaPath:
                        '#/properties/registrations/items/properties/site/properties/gridReference/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties.site
                          .properties.gridReference.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties.site
                          .properties.gridReference,
                      data: data68
                    }
                    if (vErrors === null) {
                      vErrors = [err118]
                    } else {
                      vErrors.push(err118)
                    }
                    errors++
                  }
                }
                if (data57.siteCapacity !== undefined) {
                  var data69 = data57.siteCapacity
                  if (Array.isArray(data69)) {
                    var len5 = data69.length
                    for (var i5 = 0; i5 < len5; i5++) {
                      var data70 = data69[i5]
                      if (
                        data70 &&
                        typeof data70 == 'object' &&
                        !Array.isArray(data70)
                      ) {
                        if (data70.material === undefined) {
                          var err119 = {
                            instancePath:
                              instancePath +
                              '/registrations/' +
                              i3 +
                              '/site/siteCapacity/' +
                              i5,
                            schemaPath:
                              '#/properties/registrations/items/properties/site/properties/siteCapacity/items/required',
                            keyword: 'required',
                            params: { missingProperty: 'material' },
                            message:
                              "must have required property '" +
                              'material' +
                              "'",
                            schema:
                              schema38.properties.registrations.items.properties
                                .site.properties.siteCapacity.items.required,
                            parentSchema:
                              schema38.properties.registrations.items.properties
                                .site.properties.siteCapacity.items,
                            data: data70
                          }
                          if (vErrors === null) {
                            vErrors = [err119]
                          } else {
                            vErrors.push(err119)
                          }
                          errors++
                        }
                        for (var key11 in data70) {
                          if (
                            !(
                              key11 === 'material' ||
                              key11 === 'siteCapacityWeight' ||
                              key11 === 'siteCapacityTimescale'
                            )
                          ) {
                            var err120 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/site/siteCapacity/' +
                                i5,
                              schemaPath:
                                '#/properties/registrations/items/properties/site/properties/siteCapacity/items/additionalProperties',
                              keyword: 'additionalProperties',
                              params: { additionalProperty: key11 },
                              message: 'must NOT have additional properties',
                              schema: false,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.site.properties.siteCapacity
                                  .items,
                              data: data70
                            }
                            if (vErrors === null) {
                              vErrors = [err120]
                            } else {
                              vErrors.push(err120)
                            }
                            errors++
                          }
                        }
                        if (data70.material !== undefined) {
                          var data71 = data70.material
                          if (typeof data71 !== 'string') {
                            var err121 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/site/siteCapacity/' +
                                i5 +
                                '/material',
                              schemaPath:
                                '#/properties/registrations/items/properties/site/properties/siteCapacity/items/properties/material/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.material.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.material,
                              data: data71
                            }
                            if (vErrors === null) {
                              vErrors = [err121]
                            } else {
                              vErrors.push(err121)
                            }
                            errors++
                          }
                          if (
                            !(
                              data71 === 'aluminium' ||
                              data71 === 'fibre' ||
                              data71 === 'glass' ||
                              data71 === 'paper' ||
                              data71 === 'plastic' ||
                              data71 === 'steel' ||
                              data71 === 'wood'
                            )
                          ) {
                            var err122 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/site/siteCapacity/' +
                                i5 +
                                '/material',
                              schemaPath:
                                '#/properties/registrations/items/properties/site/properties/siteCapacity/items/properties/material/enum',
                              keyword: 'enum',
                              params: {
                                allowedValues:
                                  schema38.properties.registrations.items
                                    .properties.site.properties.siteCapacity
                                    .items.properties.material.enum
                              },
                              message:
                                'must be equal to one of the allowed values',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.material.enum,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.material,
                              data: data71
                            }
                            if (vErrors === null) {
                              vErrors = [err122]
                            } else {
                              vErrors.push(err122)
                            }
                            errors++
                          }
                        }
                        if (data70.siteCapacityWeight !== undefined) {
                          var data72 = data70.siteCapacityWeight
                          if (typeof data72 !== 'string') {
                            var err123 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/site/siteCapacity/' +
                                i5 +
                                '/siteCapacityWeight',
                              schemaPath:
                                '#/properties/registrations/items/properties/site/properties/siteCapacity/items/properties/siteCapacityWeight/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.siteCapacityWeight.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.siteCapacityWeight,
                              data: data72
                            }
                            if (vErrors === null) {
                              vErrors = [err123]
                            } else {
                              vErrors.push(err123)
                            }
                            errors++
                          }
                        }
                        if (data70.siteCapacityTimescale !== undefined) {
                          var data73 = data70.siteCapacityTimescale
                          if (typeof data73 !== 'string') {
                            var err124 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/site/siteCapacity/' +
                                i5 +
                                '/siteCapacityTimescale',
                              schemaPath:
                                '#/properties/registrations/items/properties/site/properties/siteCapacity/items/properties/siteCapacityTimescale/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.siteCapacityTimescale.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.siteCapacityTimescale,
                              data: data73
                            }
                            if (vErrors === null) {
                              vErrors = [err124]
                            } else {
                              vErrors.push(err124)
                            }
                            errors++
                          }
                          if (
                            !(
                              data73 === 'weekly' ||
                              data73 === 'monthly' ||
                              data73 === 'yearly'
                            )
                          ) {
                            var err125 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/site/siteCapacity/' +
                                i5 +
                                '/siteCapacityTimescale',
                              schemaPath:
                                '#/properties/registrations/items/properties/site/properties/siteCapacity/items/properties/siteCapacityTimescale/enum',
                              keyword: 'enum',
                              params: {
                                allowedValues:
                                  schema38.properties.registrations.items
                                    .properties.site.properties.siteCapacity
                                    .items.properties.siteCapacityTimescale.enum
                              },
                              message:
                                'must be equal to one of the allowed values',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.siteCapacityTimescale.enum,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.siteCapacityTimescale,
                              data: data73
                            }
                            if (vErrors === null) {
                              vErrors = [err125]
                            } else {
                              vErrors.push(err125)
                            }
                            errors++
                          }
                        }
                      } else {
                        var err126 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/site/siteCapacity/' +
                            i5,
                          schemaPath:
                            '#/properties/registrations/items/properties/site/properties/siteCapacity/items/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                          schema:
                            schema38.properties.registrations.items.properties
                              .site.properties.siteCapacity.items.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .site.properties.siteCapacity.items,
                          data: data70
                        }
                        if (vErrors === null) {
                          vErrors = [err126]
                        } else {
                          vErrors.push(err126)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err127 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/site/siteCapacity',
                      schemaPath:
                        '#/properties/registrations/items/properties/site/properties/siteCapacity/type',
                      keyword: 'type',
                      params: { type: 'array' },
                      message: 'must be array',
                      schema:
                        schema38.properties.registrations.items.properties.site
                          .properties.siteCapacity.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties.site
                          .properties.siteCapacity,
                      data: data69
                    }
                    if (vErrors === null) {
                      vErrors = [err127]
                    } else {
                      vErrors.push(err127)
                    }
                    errors++
                  }
                }
              } else {
                var err128 = {
                  instancePath: instancePath + '/registrations/' + i3 + '/site',
                  schemaPath:
                    '#/properties/registrations/items/properties/site/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                  schema:
                    schema38.properties.registrations.items.properties.site
                      .type,
                  parentSchema:
                    schema38.properties.registrations.items.properties.site,
                  data: data57
                }
                if (vErrors === null) {
                  vErrors = [err128]
                } else {
                  vErrors.push(err128)
                }
                errors++
              }
            }
            if (data46.material !== undefined) {
              var data74 = data46.material
              if (typeof data74 !== 'string') {
                var err129 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/material',
                  schemaPath:
                    '#/properties/registrations/items/properties/material/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.registrations.items.properties.material
                      .type,
                  parentSchema:
                    schema38.properties.registrations.items.properties.material,
                  data: data74
                }
                if (vErrors === null) {
                  vErrors = [err129]
                } else {
                  vErrors.push(err129)
                }
                errors++
              }
              if (
                !(
                  data74 === 'aluminium' ||
                  data74 === 'fibre' ||
                  data74 === 'glass' ||
                  data74 === 'paper' ||
                  data74 === 'plastic' ||
                  data74 === 'steel' ||
                  data74 === 'wood'
                )
              ) {
                var err130 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/material',
                  schemaPath:
                    '#/properties/registrations/items/properties/material/enum',
                  keyword: 'enum',
                  params: {
                    allowedValues:
                      schema38.properties.registrations.items.properties
                        .material.enum
                  },
                  message: 'must be equal to one of the allowed values',
                  schema:
                    schema38.properties.registrations.items.properties.material
                      .enum,
                  parentSchema:
                    schema38.properties.registrations.items.properties.material,
                  data: data74
                }
                if (vErrors === null) {
                  vErrors = [err130]
                } else {
                  vErrors.push(err130)
                }
                errors++
              }
            }
            if (data46.wasteProcessingType !== undefined) {
              var data75 = data46.wasteProcessingType
              if (typeof data75 !== 'string') {
                var err131 = {
                  instancePath:
                    instancePath +
                    '/registrations/' +
                    i3 +
                    '/wasteProcessingType',
                  schemaPath:
                    '#/properties/registrations/items/properties/wasteProcessingType/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.registrations.items.properties
                      .wasteProcessingType.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .wasteProcessingType,
                  data: data75
                }
                if (vErrors === null) {
                  vErrors = [err131]
                } else {
                  vErrors.push(err131)
                }
                errors++
              }
              if (!(data75 === 'reprocessor' || data75 === 'exporter')) {
                var err132 = {
                  instancePath:
                    instancePath +
                    '/registrations/' +
                    i3 +
                    '/wasteProcessingType',
                  schemaPath:
                    '#/properties/registrations/items/properties/wasteProcessingType/enum',
                  keyword: 'enum',
                  params: {
                    allowedValues:
                      schema38.properties.registrations.items.properties
                        .wasteProcessingType.enum
                  },
                  message: 'must be equal to one of the allowed values',
                  schema:
                    schema38.properties.registrations.items.properties
                      .wasteProcessingType.enum,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .wasteProcessingType,
                  data: data75
                }
                if (vErrors === null) {
                  vErrors = [err132]
                } else {
                  vErrors.push(err132)
                }
                errors++
              }
            }
            if (data46.accreditationId !== undefined) {
              var data76 = data46.accreditationId
              if (typeof data76 !== 'string') {
                var err133 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/accreditationId',
                  schemaPath:
                    '#/properties/registrations/items/properties/accreditationId/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.registrations.items.properties
                      .accreditationId.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .accreditationId,
                  data: data76
                }
                if (vErrors === null) {
                  vErrors = [err133]
                } else {
                  vErrors.push(err133)
                }
                errors++
              }
            }
            if (data46.recyclingProcess !== undefined) {
              var data77 = data46.recyclingProcess
              if (Array.isArray(data77)) {
                var len6 = data77.length
                for (var i6 = 0; i6 < len6; i6++) {
                  var data78 = data77[i6]
                  if (typeof data78 !== 'string') {
                    var err134 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/recyclingProcess/' +
                        i6,
                      schemaPath:
                        '#/properties/registrations/items/properties/recyclingProcess/items/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .recyclingProcess.items.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .recyclingProcess.items,
                      data: data78
                    }
                    if (vErrors === null) {
                      vErrors = [err134]
                    } else {
                      vErrors.push(err134)
                    }
                    errors++
                  }
                  if (
                    !(data78 === 'glass_re_melt' || data78 === 'glass_other')
                  ) {
                    var err135 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/recyclingProcess/' +
                        i6,
                      schemaPath:
                        '#/properties/registrations/items/properties/recyclingProcess/items/enum',
                      keyword: 'enum',
                      params: {
                        allowedValues:
                          schema38.properties.registrations.items.properties
                            .recyclingProcess.items.enum
                      },
                      message: 'must be equal to one of the allowed values',
                      schema:
                        schema38.properties.registrations.items.properties
                          .recyclingProcess.items.enum,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .recyclingProcess.items,
                      data: data78
                    }
                    if (vErrors === null) {
                      vErrors = [err135]
                    } else {
                      vErrors.push(err135)
                    }
                    errors++
                  }
                }
              } else {
                var err136 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/recyclingProcess',
                  schemaPath:
                    '#/properties/registrations/items/properties/recyclingProcess/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                  schema:
                    schema38.properties.registrations.items.properties
                      .recyclingProcess.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .recyclingProcess,
                  data: data77
                }
                if (vErrors === null) {
                  vErrors = [err136]
                } else {
                  vErrors.push(err136)
                }
                errors++
              }
            }
            if (data46.noticeAddress !== undefined) {
              var data79 = data46.noticeAddress
              if (
                data79 &&
                typeof data79 == 'object' &&
                !Array.isArray(data79)
              ) {
                for (var key12 in data79) {
                  if (
                    !func4.call(
                      schema38.properties.registrations.items.properties
                        .noticeAddress.properties,
                      key12
                    )
                  ) {
                    var err137 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/noticeAddress',
                      schemaPath:
                        '#/properties/registrations/items/properties/noticeAddress/additionalProperties',
                      keyword: 'additionalProperties',
                      params: { additionalProperty: key12 },
                      message: 'must NOT have additional properties',
                      schema: false,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress,
                      data: data79
                    }
                    if (vErrors === null) {
                      vErrors = [err137]
                    } else {
                      vErrors.push(err137)
                    }
                    errors++
                  }
                }
                if (data79.line1 !== undefined) {
                  var data80 = data79.line1
                  if (typeof data80 !== 'string') {
                    var err138 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/noticeAddress/line1',
                      schemaPath:
                        '#/properties/registrations/items/properties/noticeAddress/properties/line1/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.line1.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.line1,
                      data: data80
                    }
                    if (vErrors === null) {
                      vErrors = [err138]
                    } else {
                      vErrors.push(err138)
                    }
                    errors++
                  }
                }
                if (data79.line2 !== undefined) {
                  var data81 = data79.line2
                  if (typeof data81 !== 'string') {
                    var err139 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/noticeAddress/line2',
                      schemaPath:
                        '#/properties/registrations/items/properties/noticeAddress/properties/line2/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.line2.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.line2,
                      data: data81
                    }
                    if (vErrors === null) {
                      vErrors = [err139]
                    } else {
                      vErrors.push(err139)
                    }
                    errors++
                  }
                }
                if (data79.town !== undefined) {
                  var data82 = data79.town
                  if (typeof data82 !== 'string') {
                    var err140 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/noticeAddress/town',
                      schemaPath:
                        '#/properties/registrations/items/properties/noticeAddress/properties/town/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.town.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.town,
                      data: data82
                    }
                    if (vErrors === null) {
                      vErrors = [err140]
                    } else {
                      vErrors.push(err140)
                    }
                    errors++
                  }
                }
                if (data79.county !== undefined) {
                  var data83 = data79.county
                  if (typeof data83 !== 'string') {
                    var err141 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/noticeAddress/county',
                      schemaPath:
                        '#/properties/registrations/items/properties/noticeAddress/properties/county/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.county.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.county,
                      data: data83
                    }
                    if (vErrors === null) {
                      vErrors = [err141]
                    } else {
                      vErrors.push(err141)
                    }
                    errors++
                  }
                }
                if (data79.country !== undefined) {
                  var data84 = data79.country
                  if (typeof data84 !== 'string') {
                    var err142 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/noticeAddress/country',
                      schemaPath:
                        '#/properties/registrations/items/properties/noticeAddress/properties/country/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.country.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.country,
                      data: data84
                    }
                    if (vErrors === null) {
                      vErrors = [err142]
                    } else {
                      vErrors.push(err142)
                    }
                    errors++
                  }
                }
                if (data79.postcode !== undefined) {
                  var data85 = data79.postcode
                  if (typeof data85 !== 'string') {
                    var err143 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/noticeAddress/postcode',
                      schemaPath:
                        '#/properties/registrations/items/properties/noticeAddress/properties/postcode/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.postcode.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.postcode,
                      data: data85
                    }
                    if (vErrors === null) {
                      vErrors = [err143]
                    } else {
                      vErrors.push(err143)
                    }
                    errors++
                  }
                }
                if (data79.region !== undefined) {
                  var data86 = data79.region
                  if (typeof data86 !== 'string') {
                    var err144 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/noticeAddress/region',
                      schemaPath:
                        '#/properties/registrations/items/properties/noticeAddress/properties/region/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.region.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.region,
                      data: data86
                    }
                    if (vErrors === null) {
                      vErrors = [err144]
                    } else {
                      vErrors.push(err144)
                    }
                    errors++
                  }
                }
                if (data79.fullAddress !== undefined) {
                  var data87 = data79.fullAddress
                  if (typeof data87 !== 'string') {
                    var err145 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/noticeAddress/fullAddress',
                      schemaPath:
                        '#/properties/registrations/items/properties/noticeAddress/properties/fullAddress/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.fullAddress.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.fullAddress,
                      data: data87
                    }
                    if (vErrors === null) {
                      vErrors = [err145]
                    } else {
                      vErrors.push(err145)
                    }
                    errors++
                  }
                }
                if (data79.line2ToCounty !== undefined) {
                  var data88 = data79.line2ToCounty
                  if (typeof data88 !== 'string') {
                    var err146 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/noticeAddress/line2ToCounty',
                      schemaPath:
                        '#/properties/registrations/items/properties/noticeAddress/properties/line2ToCounty/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.line2ToCounty.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .noticeAddress.properties.line2ToCounty,
                      data: data88
                    }
                    if (vErrors === null) {
                      vErrors = [err146]
                    } else {
                      vErrors.push(err146)
                    }
                    errors++
                  }
                }
              } else {
                var err147 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/noticeAddress',
                  schemaPath:
                    '#/properties/registrations/items/properties/noticeAddress/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                  schema:
                    schema38.properties.registrations.items.properties
                      .noticeAddress.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .noticeAddress,
                  data: data79
                }
                if (vErrors === null) {
                  vErrors = [err147]
                } else {
                  vErrors.push(err147)
                }
                errors++
              }
            }
            if (data46.wasteRegistrationNumber !== undefined) {
              var data89 = data46.wasteRegistrationNumber
              if (typeof data89 !== 'string') {
                var err148 = {
                  instancePath:
                    instancePath +
                    '/registrations/' +
                    i3 +
                    '/wasteRegistrationNumber',
                  schemaPath:
                    '#/properties/registrations/items/properties/wasteRegistrationNumber/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.registrations.items.properties
                      .wasteRegistrationNumber.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .wasteRegistrationNumber,
                  data: data89
                }
                if (vErrors === null) {
                  vErrors = [err148]
                } else {
                  vErrors.push(err148)
                }
                errors++
              }
            }
            if (data46.wasteManagementPermits !== undefined) {
              var data90 = data46.wasteManagementPermits
              if (Array.isArray(data90)) {
                var len7 = data90.length
                for (var i7 = 0; i7 < len7; i7++) {
                  var data91 = data90[i7]
                  if (
                    data91 &&
                    typeof data91 == 'object' &&
                    !Array.isArray(data91)
                  ) {
                    if (data91.type === undefined) {
                      var err149 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/wasteManagementPermits/' +
                          i7,
                        schemaPath:
                          '#/properties/registrations/items/properties/wasteManagementPermits/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'type' },
                        message: "must have required property '" + 'type' + "'",
                        schema:
                          schema38.properties.registrations.items.properties
                            .wasteManagementPermits.items.required,
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .wasteManagementPermits.items,
                        data: data91
                      }
                      if (vErrors === null) {
                        vErrors = [err149]
                      } else {
                        vErrors.push(err149)
                      }
                      errors++
                    }
                    for (var key13 in data91) {
                      if (
                        !(
                          key13 === 'type' ||
                          key13 === 'permitNumber' ||
                          key13 === 'exemptions' ||
                          key13 === 'authorisedMaterials'
                        )
                      ) {
                        var err150 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/wasteManagementPermits/' +
                            i7,
                          schemaPath:
                            '#/properties/registrations/items/properties/wasteManagementPermits/items/additionalProperties',
                          keyword: 'additionalProperties',
                          params: { additionalProperty: key13 },
                          message: 'must NOT have additional properties',
                          schema: false,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .wasteManagementPermits.items,
                          data: data91
                        }
                        if (vErrors === null) {
                          vErrors = [err150]
                        } else {
                          vErrors.push(err150)
                        }
                        errors++
                      }
                    }
                    if (data91.type !== undefined) {
                      var data92 = data91.type
                      if (typeof data92 !== 'string') {
                        var err151 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/wasteManagementPermits/' +
                            i7 +
                            '/type',
                          schemaPath:
                            '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/type/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .wasteManagementPermits.items.properties.type
                              .type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .wasteManagementPermits.items.properties.type,
                          data: data92
                        }
                        if (vErrors === null) {
                          vErrors = [err151]
                        } else {
                          vErrors.push(err151)
                        }
                        errors++
                      }
                      if (
                        !(
                          data92 === 'wml' ||
                          data92 === 'ppc' ||
                          data92 === 'waste_exemption'
                        )
                      ) {
                        var err152 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/wasteManagementPermits/' +
                            i7 +
                            '/type',
                          schemaPath:
                            '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/type/enum',
                          keyword: 'enum',
                          params: {
                            allowedValues:
                              schema38.properties.registrations.items.properties
                                .wasteManagementPermits.items.properties.type
                                .enum
                          },
                          message: 'must be equal to one of the allowed values',
                          schema:
                            schema38.properties.registrations.items.properties
                              .wasteManagementPermits.items.properties.type
                              .enum,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .wasteManagementPermits.items.properties.type,
                          data: data92
                        }
                        if (vErrors === null) {
                          vErrors = [err152]
                        } else {
                          vErrors.push(err152)
                        }
                        errors++
                      }
                    }
                    if (data91.permitNumber !== undefined) {
                      var data93 = data91.permitNumber
                      if (typeof data93 !== 'string') {
                        var err153 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/wasteManagementPermits/' +
                            i7 +
                            '/permitNumber',
                          schemaPath:
                            '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/permitNumber/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .wasteManagementPermits.items.properties
                              .permitNumber.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .wasteManagementPermits.items.properties
                              .permitNumber,
                          data: data93
                        }
                        if (vErrors === null) {
                          vErrors = [err153]
                        } else {
                          vErrors.push(err153)
                        }
                        errors++
                      }
                    }
                    if (data91.exemptions !== undefined) {
                      var data94 = data91.exemptions
                      if (Array.isArray(data94)) {
                        var len8 = data94.length
                        for (var i8 = 0; i8 < len8; i8++) {
                          var data95 = data94[i8]
                          if (
                            data95 &&
                            typeof data95 == 'object' &&
                            !Array.isArray(data95)
                          ) {
                            if (data95.reference === undefined) {
                              var err154 = {
                                instancePath:
                                  instancePath +
                                  '/registrations/' +
                                  i3 +
                                  '/wasteManagementPermits/' +
                                  i7 +
                                  '/exemptions/' +
                                  i8,
                                schemaPath:
                                  '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/exemptions/items/required',
                                keyword: 'required',
                                params: { missingProperty: 'reference' },
                                message:
                                  "must have required property '" +
                                  'reference' +
                                  "'",
                                schema:
                                  schema38.properties.registrations.items
                                    .properties.wasteManagementPermits.items
                                    .properties.exemptions.items.required,
                                parentSchema:
                                  schema38.properties.registrations.items
                                    .properties.wasteManagementPermits.items
                                    .properties.exemptions.items,
                                data: data95
                              }
                              if (vErrors === null) {
                                vErrors = [err154]
                              } else {
                                vErrors.push(err154)
                              }
                              errors++
                            }
                            if (data95.exemptionCode === undefined) {
                              var err155 = {
                                instancePath:
                                  instancePath +
                                  '/registrations/' +
                                  i3 +
                                  '/wasteManagementPermits/' +
                                  i7 +
                                  '/exemptions/' +
                                  i8,
                                schemaPath:
                                  '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/exemptions/items/required',
                                keyword: 'required',
                                params: { missingProperty: 'exemptionCode' },
                                message:
                                  "must have required property '" +
                                  'exemptionCode' +
                                  "'",
                                schema:
                                  schema38.properties.registrations.items
                                    .properties.wasteManagementPermits.items
                                    .properties.exemptions.items.required,
                                parentSchema:
                                  schema38.properties.registrations.items
                                    .properties.wasteManagementPermits.items
                                    .properties.exemptions.items,
                                data: data95
                              }
                              if (vErrors === null) {
                                vErrors = [err155]
                              } else {
                                vErrors.push(err155)
                              }
                              errors++
                            }
                            for (var key14 in data95) {
                              if (
                                !(
                                  key14 === 'reference' ||
                                  key14 === 'exemptionCode'
                                )
                              ) {
                                var err156 = {
                                  instancePath:
                                    instancePath +
                                    '/registrations/' +
                                    i3 +
                                    '/wasteManagementPermits/' +
                                    i7 +
                                    '/exemptions/' +
                                    i8,
                                  schemaPath:
                                    '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/exemptions/items/additionalProperties',
                                  keyword: 'additionalProperties',
                                  params: { additionalProperty: key14 },
                                  message:
                                    'must NOT have additional properties',
                                  schema: false,
                                  parentSchema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.exemptions.items,
                                  data: data95
                                }
                                if (vErrors === null) {
                                  vErrors = [err156]
                                } else {
                                  vErrors.push(err156)
                                }
                                errors++
                              }
                            }
                            if (data95.reference !== undefined) {
                              var data96 = data95.reference
                              if (typeof data96 !== 'string') {
                                var err157 = {
                                  instancePath:
                                    instancePath +
                                    '/registrations/' +
                                    i3 +
                                    '/wasteManagementPermits/' +
                                    i7 +
                                    '/exemptions/' +
                                    i8 +
                                    '/reference',
                                  schemaPath:
                                    '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/exemptions/items/properties/reference/type',
                                  keyword: 'type',
                                  params: { type: 'string' },
                                  message: 'must be string',
                                  schema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.exemptions.items.properties
                                      .reference.type,
                                  parentSchema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.exemptions.items.properties
                                      .reference,
                                  data: data96
                                }
                                if (vErrors === null) {
                                  vErrors = [err157]
                                } else {
                                  vErrors.push(err157)
                                }
                                errors++
                              }
                            }
                            if (data95.exemptionCode !== undefined) {
                              var data97 = data95.exemptionCode
                              if (typeof data97 !== 'string') {
                                var err158 = {
                                  instancePath:
                                    instancePath +
                                    '/registrations/' +
                                    i3 +
                                    '/wasteManagementPermits/' +
                                    i7 +
                                    '/exemptions/' +
                                    i8 +
                                    '/exemptionCode',
                                  schemaPath:
                                    '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/exemptions/items/properties/exemptionCode/type',
                                  keyword: 'type',
                                  params: { type: 'string' },
                                  message: 'must be string',
                                  schema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.exemptions.items.properties
                                      .exemptionCode.type,
                                  parentSchema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.exemptions.items.properties
                                      .exemptionCode,
                                  data: data97
                                }
                                if (vErrors === null) {
                                  vErrors = [err158]
                                } else {
                                  vErrors.push(err158)
                                }
                                errors++
                              }
                            }
                          } else {
                            var err159 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/wasteManagementPermits/' +
                                i7 +
                                '/exemptions/' +
                                i8,
                              schemaPath:
                                '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/exemptions/items/type',
                              keyword: 'type',
                              params: { type: 'object' },
                              message: 'must be object',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.wasteManagementPermits.items
                                  .properties.exemptions.items.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.wasteManagementPermits.items
                                  .properties.exemptions.items,
                              data: data95
                            }
                            if (vErrors === null) {
                              vErrors = [err159]
                            } else {
                              vErrors.push(err159)
                            }
                            errors++
                          }
                        }
                      } else {
                        var err160 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/wasteManagementPermits/' +
                            i7 +
                            '/exemptions',
                          schemaPath:
                            '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/exemptions/type',
                          keyword: 'type',
                          params: { type: 'array' },
                          message: 'must be array',
                          schema:
                            schema38.properties.registrations.items.properties
                              .wasteManagementPermits.items.properties
                              .exemptions.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .wasteManagementPermits.items.properties
                              .exemptions,
                          data: data94
                        }
                        if (vErrors === null) {
                          vErrors = [err160]
                        } else {
                          vErrors.push(err160)
                        }
                        errors++
                      }
                    }
                    if (data91.authorisedMaterials !== undefined) {
                      var data98 = data91.authorisedMaterials
                      if (Array.isArray(data98)) {
                        var len9 = data98.length
                        for (var i9 = 0; i9 < len9; i9++) {
                          var data99 = data98[i9]
                          if (
                            data99 &&
                            typeof data99 == 'object' &&
                            !Array.isArray(data99)
                          ) {
                            if (data99.material === undefined) {
                              var err161 = {
                                instancePath:
                                  instancePath +
                                  '/registrations/' +
                                  i3 +
                                  '/wasteManagementPermits/' +
                                  i7 +
                                  '/authorisedMaterials/' +
                                  i9,
                                schemaPath:
                                  '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/authorisedMaterials/items/required',
                                keyword: 'required',
                                params: { missingProperty: 'material' },
                                message:
                                  "must have required property '" +
                                  'material' +
                                  "'",
                                schema:
                                  schema38.properties.registrations.items
                                    .properties.wasteManagementPermits.items
                                    .properties.authorisedMaterials.items
                                    .required,
                                parentSchema:
                                  schema38.properties.registrations.items
                                    .properties.wasteManagementPermits.items
                                    .properties.authorisedMaterials.items,
                                data: data99
                              }
                              if (vErrors === null) {
                                vErrors = [err161]
                              } else {
                                vErrors.push(err161)
                              }
                              errors++
                            }
                            for (var key15 in data99) {
                              if (
                                !(
                                  key15 === 'material' ||
                                  key15 === 'authorisedWeight' ||
                                  key15 === 'timeScale'
                                )
                              ) {
                                var err162 = {
                                  instancePath:
                                    instancePath +
                                    '/registrations/' +
                                    i3 +
                                    '/wasteManagementPermits/' +
                                    i7 +
                                    '/authorisedMaterials/' +
                                    i9,
                                  schemaPath:
                                    '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/authorisedMaterials/items/additionalProperties',
                                  keyword: 'additionalProperties',
                                  params: { additionalProperty: key15 },
                                  message:
                                    'must NOT have additional properties',
                                  schema: false,
                                  parentSchema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.authorisedMaterials.items,
                                  data: data99
                                }
                                if (vErrors === null) {
                                  vErrors = [err162]
                                } else {
                                  vErrors.push(err162)
                                }
                                errors++
                              }
                            }
                            if (data99.material !== undefined) {
                              var data100 = data99.material
                              if (typeof data100 !== 'string') {
                                var err163 = {
                                  instancePath:
                                    instancePath +
                                    '/registrations/' +
                                    i3 +
                                    '/wasteManagementPermits/' +
                                    i7 +
                                    '/authorisedMaterials/' +
                                    i9 +
                                    '/material',
                                  schemaPath:
                                    '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/authorisedMaterials/items/properties/material/type',
                                  keyword: 'type',
                                  params: { type: 'string' },
                                  message: 'must be string',
                                  schema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.authorisedMaterials.items
                                      .properties.material.type,
                                  parentSchema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.authorisedMaterials.items
                                      .properties.material,
                                  data: data100
                                }
                                if (vErrors === null) {
                                  vErrors = [err163]
                                } else {
                                  vErrors.push(err163)
                                }
                                errors++
                              }
                              if (
                                !(
                                  data100 === 'aluminium' ||
                                  data100 === 'fibre' ||
                                  data100 === 'glass' ||
                                  data100 === 'paper' ||
                                  data100 === 'plastic' ||
                                  data100 === 'steel' ||
                                  data100 === 'wood'
                                )
                              ) {
                                var err164 = {
                                  instancePath:
                                    instancePath +
                                    '/registrations/' +
                                    i3 +
                                    '/wasteManagementPermits/' +
                                    i7 +
                                    '/authorisedMaterials/' +
                                    i9 +
                                    '/material',
                                  schemaPath:
                                    '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/authorisedMaterials/items/properties/material/enum',
                                  keyword: 'enum',
                                  params: {
                                    allowedValues:
                                      schema38.properties.registrations.items
                                        .properties.wasteManagementPermits.items
                                        .properties.authorisedMaterials.items
                                        .properties.material.enum
                                  },
                                  message:
                                    'must be equal to one of the allowed values',
                                  schema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.authorisedMaterials.items
                                      .properties.material.enum,
                                  parentSchema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.authorisedMaterials.items
                                      .properties.material,
                                  data: data100
                                }
                                if (vErrors === null) {
                                  vErrors = [err164]
                                } else {
                                  vErrors.push(err164)
                                }
                                errors++
                              }
                            }
                            if (data99.authorisedWeight !== undefined) {
                              var data101 = data99.authorisedWeight
                              if (typeof data101 !== 'string') {
                                var err165 = {
                                  instancePath:
                                    instancePath +
                                    '/registrations/' +
                                    i3 +
                                    '/wasteManagementPermits/' +
                                    i7 +
                                    '/authorisedMaterials/' +
                                    i9 +
                                    '/authorisedWeight',
                                  schemaPath:
                                    '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/authorisedMaterials/items/properties/authorisedWeight/type',
                                  keyword: 'type',
                                  params: { type: 'string' },
                                  message: 'must be string',
                                  schema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.authorisedMaterials.items
                                      .properties.authorisedWeight.type,
                                  parentSchema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.authorisedMaterials.items
                                      .properties.authorisedWeight,
                                  data: data101
                                }
                                if (vErrors === null) {
                                  vErrors = [err165]
                                } else {
                                  vErrors.push(err165)
                                }
                                errors++
                              }
                            }
                            if (data99.timeScale !== undefined) {
                              var data102 = data99.timeScale
                              if (typeof data102 !== 'string') {
                                var err166 = {
                                  instancePath:
                                    instancePath +
                                    '/registrations/' +
                                    i3 +
                                    '/wasteManagementPermits/' +
                                    i7 +
                                    '/authorisedMaterials/' +
                                    i9 +
                                    '/timeScale',
                                  schemaPath:
                                    '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/authorisedMaterials/items/properties/timeScale/type',
                                  keyword: 'type',
                                  params: { type: 'string' },
                                  message: 'must be string',
                                  schema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.authorisedMaterials.items
                                      .properties.timeScale.type,
                                  parentSchema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.authorisedMaterials.items
                                      .properties.timeScale,
                                  data: data102
                                }
                                if (vErrors === null) {
                                  vErrors = [err166]
                                } else {
                                  vErrors.push(err166)
                                }
                                errors++
                              }
                              if (
                                !(
                                  data102 === 'weekly' ||
                                  data102 === 'monthly' ||
                                  data102 === 'yearly'
                                )
                              ) {
                                var err167 = {
                                  instancePath:
                                    instancePath +
                                    '/registrations/' +
                                    i3 +
                                    '/wasteManagementPermits/' +
                                    i7 +
                                    '/authorisedMaterials/' +
                                    i9 +
                                    '/timeScale',
                                  schemaPath:
                                    '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/authorisedMaterials/items/properties/timeScale/enum',
                                  keyword: 'enum',
                                  params: {
                                    allowedValues:
                                      schema38.properties.registrations.items
                                        .properties.wasteManagementPermits.items
                                        .properties.authorisedMaterials.items
                                        .properties.timeScale.enum
                                  },
                                  message:
                                    'must be equal to one of the allowed values',
                                  schema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.authorisedMaterials.items
                                      .properties.timeScale.enum,
                                  parentSchema:
                                    schema38.properties.registrations.items
                                      .properties.wasteManagementPermits.items
                                      .properties.authorisedMaterials.items
                                      .properties.timeScale,
                                  data: data102
                                }
                                if (vErrors === null) {
                                  vErrors = [err167]
                                } else {
                                  vErrors.push(err167)
                                }
                                errors++
                              }
                            }
                          } else {
                            var err168 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/wasteManagementPermits/' +
                                i7 +
                                '/authorisedMaterials/' +
                                i9,
                              schemaPath:
                                '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/authorisedMaterials/items/type',
                              keyword: 'type',
                              params: { type: 'object' },
                              message: 'must be object',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.wasteManagementPermits.items
                                  .properties.authorisedMaterials.items.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.wasteManagementPermits.items
                                  .properties.authorisedMaterials.items,
                              data: data99
                            }
                            if (vErrors === null) {
                              vErrors = [err168]
                            } else {
                              vErrors.push(err168)
                            }
                            errors++
                          }
                        }
                      } else {
                        var err169 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/wasteManagementPermits/' +
                            i7 +
                            '/authorisedMaterials',
                          schemaPath:
                            '#/properties/registrations/items/properties/wasteManagementPermits/items/properties/authorisedMaterials/type',
                          keyword: 'type',
                          params: { type: 'array' },
                          message: 'must be array',
                          schema:
                            schema38.properties.registrations.items.properties
                              .wasteManagementPermits.items.properties
                              .authorisedMaterials.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .wasteManagementPermits.items.properties
                              .authorisedMaterials,
                          data: data98
                        }
                        if (vErrors === null) {
                          vErrors = [err169]
                        } else {
                          vErrors.push(err169)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err170 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/wasteManagementPermits/' +
                        i7,
                      schemaPath:
                        '#/properties/registrations/items/properties/wasteManagementPermits/items/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                      schema:
                        schema38.properties.registrations.items.properties
                          .wasteManagementPermits.items.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .wasteManagementPermits.items,
                      data: data91
                    }
                    if (vErrors === null) {
                      vErrors = [err170]
                    } else {
                      vErrors.push(err170)
                    }
                    errors++
                  }
                }
              } else {
                var err171 = {
                  instancePath:
                    instancePath +
                    '/registrations/' +
                    i3 +
                    '/wasteManagementPermits',
                  schemaPath:
                    '#/properties/registrations/items/properties/wasteManagementPermits/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                  schema:
                    schema38.properties.registrations.items.properties
                      .wasteManagementPermits.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .wasteManagementPermits,
                  data: data90
                }
                if (vErrors === null) {
                  vErrors = [err171]
                } else {
                  vErrors.push(err171)
                }
                errors++
              }
            }
            if (data46.approvedPersons !== undefined) {
              var data103 = data46.approvedPersons
              if (Array.isArray(data103)) {
                var len10 = data103.length
                for (var i10 = 0; i10 < len10; i10++) {
                  var data104 = data103[i10]
                  var _errs233 = errors
                  var valid40 = false
                  var _errs234 = errors
                  if (
                    data104 &&
                    typeof data104 == 'object' &&
                    !Array.isArray(data104)
                  ) {
                    if (data104.role === undefined) {
                      var err172 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/approvedPersons/' +
                          i10,
                        schemaPath:
                          '#/properties/registrations/items/properties/approvedPersons/items/anyOf/0/required',
                        keyword: 'required',
                        params: { missingProperty: 'role' },
                        message: "must have required property '" + 'role' + "'",
                        schema:
                          schema38.properties.registrations.items.properties
                            .approvedPersons.items.anyOf[0].required,
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .approvedPersons.items.anyOf[0],
                        data: data104
                      }
                      if (vErrors === null) {
                        vErrors = [err172]
                      } else {
                        vErrors.push(err172)
                      }
                      errors++
                    }
                  }
                  var _valid2 = _errs234 === errors
                  valid40 = valid40 || _valid2
                  if (!valid40) {
                    var _errs235 = errors
                    if (
                      data104 &&
                      typeof data104 == 'object' &&
                      !Array.isArray(data104)
                    ) {
                      if (data104.title === undefined) {
                        var err173 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/approvedPersons/' +
                            i10,
                          schemaPath:
                            '#/properties/registrations/items/properties/approvedPersons/items/anyOf/1/required',
                          keyword: 'required',
                          params: { missingProperty: 'title' },
                          message:
                            "must have required property '" + 'title' + "'",
                          schema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items.anyOf[1].required,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items.anyOf[1],
                          data: data104
                        }
                        if (vErrors === null) {
                          vErrors = [err173]
                        } else {
                          vErrors.push(err173)
                        }
                        errors++
                      }
                    }
                    var _valid2 = _errs235 === errors
                    valid40 = valid40 || _valid2
                  }
                  if (!valid40) {
                    var err174 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/approvedPersons/' +
                        i10,
                      schemaPath:
                        '#/properties/registrations/items/properties/approvedPersons/items/anyOf',
                      keyword: 'anyOf',
                      params: {},
                      message: 'must match a schema in anyOf',
                      schema:
                        schema38.properties.registrations.items.properties
                          .approvedPersons.items.anyOf,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .approvedPersons.items,
                      data: data104
                    }
                    if (vErrors === null) {
                      vErrors = [err174]
                    } else {
                      vErrors.push(err174)
                    }
                    errors++
                  } else {
                    errors = _errs233
                    if (vErrors !== null) {
                      if (_errs233) {
                        vErrors.length = _errs233
                      } else {
                        vErrors = null
                      }
                    }
                  }
                  if (
                    data104 &&
                    typeof data104 == 'object' &&
                    !Array.isArray(data104)
                  ) {
                    if (data104.fullName === undefined) {
                      var err175 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/approvedPersons/' +
                          i10,
                        schemaPath:
                          '#/properties/registrations/items/properties/approvedPersons/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'fullName' },
                        message:
                          "must have required property '" + 'fullName' + "'",
                        schema:
                          schema38.properties.registrations.items.properties
                            .approvedPersons.items.required,
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .approvedPersons.items,
                        data: data104
                      }
                      if (vErrors === null) {
                        vErrors = [err175]
                      } else {
                        vErrors.push(err175)
                      }
                      errors++
                    }
                    if (data104.email === undefined) {
                      var err176 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/approvedPersons/' +
                          i10,
                        schemaPath:
                          '#/properties/registrations/items/properties/approvedPersons/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'email' },
                        message:
                          "must have required property '" + 'email' + "'",
                        schema:
                          schema38.properties.registrations.items.properties
                            .approvedPersons.items.required,
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .approvedPersons.items,
                        data: data104
                      }
                      if (vErrors === null) {
                        vErrors = [err176]
                      } else {
                        vErrors.push(err176)
                      }
                      errors++
                    }
                    if (data104.phone === undefined) {
                      var err177 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/approvedPersons/' +
                          i10,
                        schemaPath:
                          '#/properties/registrations/items/properties/approvedPersons/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'phone' },
                        message:
                          "must have required property '" + 'phone' + "'",
                        schema:
                          schema38.properties.registrations.items.properties
                            .approvedPersons.items.required,
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .approvedPersons.items,
                        data: data104
                      }
                      if (vErrors === null) {
                        vErrors = [err177]
                      } else {
                        vErrors.push(err177)
                      }
                      errors++
                    }
                    for (var key16 in data104) {
                      if (
                        !(
                          key16 === 'fullName' ||
                          key16 === 'email' ||
                          key16 === 'phone' ||
                          key16 === 'role' ||
                          key16 === 'title'
                        )
                      ) {
                        var err178 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/approvedPersons/' +
                            i10,
                          schemaPath:
                            '#/properties/registrations/items/properties/approvedPersons/items/additionalProperties',
                          keyword: 'additionalProperties',
                          params: { additionalProperty: key16 },
                          message: 'must NOT have additional properties',
                          schema: false,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items,
                          data: data104
                        }
                        if (vErrors === null) {
                          vErrors = [err178]
                        } else {
                          vErrors.push(err178)
                        }
                        errors++
                      }
                    }
                    if (data104.fullName !== undefined) {
                      var data105 = data104.fullName
                      if (typeof data105 !== 'string') {
                        var err179 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/approvedPersons/' +
                            i10 +
                            '/fullName',
                          schemaPath:
                            '#/properties/registrations/items/properties/approvedPersons/items/properties/fullName/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items.properties.fullName.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items.properties.fullName,
                          data: data105
                        }
                        if (vErrors === null) {
                          vErrors = [err179]
                        } else {
                          vErrors.push(err179)
                        }
                        errors++
                      }
                    }
                    if (data104.email !== undefined) {
                      var data106 = data104.email
                      if (typeof data106 === 'string') {
                        if (!formats0.test(data106)) {
                          var err180 = {
                            instancePath:
                              instancePath +
                              '/registrations/' +
                              i3 +
                              '/approvedPersons/' +
                              i10 +
                              '/email',
                            schemaPath:
                              '#/properties/registrations/items/properties/approvedPersons/items/properties/email/format',
                            keyword: 'format',
                            params: { format: 'email' },
                            message: 'must match format "' + 'email' + '"',
                            schema: 'email',
                            parentSchema:
                              schema38.properties.registrations.items.properties
                                .approvedPersons.items.properties.email,
                            data: data106
                          }
                          if (vErrors === null) {
                            vErrors = [err180]
                          } else {
                            vErrors.push(err180)
                          }
                          errors++
                        }
                      } else {
                        var err181 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/approvedPersons/' +
                            i10 +
                            '/email',
                          schemaPath:
                            '#/properties/registrations/items/properties/approvedPersons/items/properties/email/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items.properties.email.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items.properties.email,
                          data: data106
                        }
                        if (vErrors === null) {
                          vErrors = [err181]
                        } else {
                          vErrors.push(err181)
                        }
                        errors++
                      }
                    }
                    if (data104.phone !== undefined) {
                      var data107 = data104.phone
                      if (typeof data107 !== 'string') {
                        var err182 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/approvedPersons/' +
                            i10 +
                            '/phone',
                          schemaPath:
                            '#/properties/registrations/items/properties/approvedPersons/items/properties/phone/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items.properties.phone.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items.properties.phone,
                          data: data107
                        }
                        if (vErrors === null) {
                          vErrors = [err182]
                        } else {
                          vErrors.push(err182)
                        }
                        errors++
                      }
                    }
                    if (data104.role !== undefined) {
                      var data108 = data104.role
                      if (typeof data108 !== 'string') {
                        var err183 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/approvedPersons/' +
                            i10 +
                            '/role',
                          schemaPath:
                            '#/properties/registrations/items/properties/approvedPersons/items/properties/role/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items.properties.role.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items.properties.role,
                          data: data108
                        }
                        if (vErrors === null) {
                          vErrors = [err183]
                        } else {
                          vErrors.push(err183)
                        }
                        errors++
                      }
                    }
                    if (data104.title !== undefined) {
                      var data109 = data104.title
                      if (typeof data109 !== 'string') {
                        var err184 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/approvedPersons/' +
                            i10 +
                            '/title',
                          schemaPath:
                            '#/properties/registrations/items/properties/approvedPersons/items/properties/title/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items.properties.title.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .approvedPersons.items.properties.title,
                          data: data109
                        }
                        if (vErrors === null) {
                          vErrors = [err184]
                        } else {
                          vErrors.push(err184)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err185 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/approvedPersons/' +
                        i10,
                      schemaPath:
                        '#/properties/registrations/items/properties/approvedPersons/items/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                      schema:
                        schema38.properties.registrations.items.properties
                          .approvedPersons.items.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .approvedPersons.items,
                      data: data104
                    }
                    if (vErrors === null) {
                      vErrors = [err185]
                    } else {
                      vErrors.push(err185)
                    }
                    errors++
                  }
                }
              } else {
                var err186 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/approvedPersons',
                  schemaPath:
                    '#/properties/registrations/items/properties/approvedPersons/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                  schema:
                    schema38.properties.registrations.items.properties
                      .approvedPersons.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .approvedPersons,
                  data: data103
                }
                if (vErrors === null) {
                  vErrors = [err186]
                } else {
                  vErrors.push(err186)
                }
                errors++
              }
            }
            if (data46.suppliers !== undefined) {
              var data110 = data46.suppliers
              if (typeof data110 !== 'string') {
                var err187 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/suppliers',
                  schemaPath:
                    '#/properties/registrations/items/properties/suppliers/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.registrations.items.properties.suppliers
                      .type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .suppliers,
                  data: data110
                }
                if (vErrors === null) {
                  vErrors = [err187]
                } else {
                  vErrors.push(err187)
                }
                errors++
              }
            }
            if (data46.exportPorts !== undefined) {
              var data111 = data46.exportPorts
              if (Array.isArray(data111)) {
                var len11 = data111.length
                for (var i11 = 0; i11 < len11; i11++) {
                  var data112 = data111[i11]
                  if (typeof data112 !== 'string') {
                    var err188 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/exportPorts/' +
                        i11,
                      schemaPath:
                        '#/properties/registrations/items/properties/exportPorts/items/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .exportPorts.items.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .exportPorts.items,
                      data: data112
                    }
                    if (vErrors === null) {
                      vErrors = [err188]
                    } else {
                      vErrors.push(err188)
                    }
                    errors++
                  }
                }
              } else {
                var err189 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/exportPorts',
                  schemaPath:
                    '#/properties/registrations/items/properties/exportPorts/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                  schema:
                    schema38.properties.registrations.items.properties
                      .exportPorts.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .exportPorts,
                  data: data111
                }
                if (vErrors === null) {
                  vErrors = [err189]
                } else {
                  vErrors.push(err189)
                }
                errors++
              }
            }
            if (data46.yearlyMetrics !== undefined) {
              var data113 = data46.yearlyMetrics
              if (Array.isArray(data113)) {
                var len12 = data113.length
                for (var i12 = 0; i12 < len12; i12++) {
                  var data114 = data113[i12]
                  if (
                    data114 &&
                    typeof data114 == 'object' &&
                    !Array.isArray(data114)
                  ) {
                    if (data114.year === undefined) {
                      var err190 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/yearlyMetrics/' +
                          i12,
                        schemaPath:
                          '#/properties/registrations/items/properties/yearlyMetrics/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'year' },
                        message: "must have required property '" + 'year' + "'",
                        schema:
                          schema38.properties.registrations.items.properties
                            .yearlyMetrics.items.required,
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .yearlyMetrics.items,
                        data: data114
                      }
                      if (vErrors === null) {
                        vErrors = [err190]
                      } else {
                        vErrors.push(err190)
                      }
                      errors++
                    }
                    for (var key17 in data114) {
                      if (
                        !(
                          key17 === 'year' ||
                          key17 === 'input' ||
                          key17 === 'rawMaterialInputs' ||
                          key17 === 'output' ||
                          key17 === 'productsMadeFromRecycling'
                        )
                      ) {
                        var err191 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/yearlyMetrics/' +
                            i12,
                          schemaPath:
                            '#/properties/registrations/items/properties/yearlyMetrics/items/additionalProperties',
                          keyword: 'additionalProperties',
                          params: { additionalProperty: key17 },
                          message: 'must NOT have additional properties',
                          schema: false,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .yearlyMetrics.items,
                          data: data114
                        }
                        if (vErrors === null) {
                          vErrors = [err191]
                        } else {
                          vErrors.push(err191)
                        }
                        errors++
                      }
                    }
                    if (data114.year !== undefined) {
                      var data115 = data114.year
                      if (typeof data115 !== 'string') {
                        var err192 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/yearlyMetrics/' +
                            i12 +
                            '/year',
                          schemaPath:
                            '#/properties/registrations/items/properties/yearlyMetrics/items/properties/year/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .yearlyMetrics.items.properties.year.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .yearlyMetrics.items.properties.year,
                          data: data115
                        }
                        if (vErrors === null) {
                          vErrors = [err192]
                        } else {
                          vErrors.push(err192)
                        }
                        errors++
                      }
                    }
                    if (data114.input !== undefined) {
                      var data116 = data114.input
                      if (
                        data116 &&
                        typeof data116 == 'object' &&
                        !Array.isArray(data116)
                      ) {
                        for (var key18 in data116) {
                          if (
                            !(
                              key18 === 'type' ||
                              key18 === 'ukPackagingWaste' ||
                              key18 === 'nonUkPackagingWaste' ||
                              key18 === 'nonPackagingWaste'
                            )
                          ) {
                            var err193 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/input',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/input/additionalProperties',
                              keyword: 'additionalProperties',
                              params: { additionalProperty: key18 },
                              message: 'must NOT have additional properties',
                              schema: false,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .input,
                              data: data116
                            }
                            if (vErrors === null) {
                              vErrors = [err193]
                            } else {
                              vErrors.push(err193)
                            }
                            errors++
                          }
                        }
                        if (data116.type !== undefined) {
                          var data117 = data116.type
                          if (typeof data117 !== 'string') {
                            var err194 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/input/type',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/input/properties/type/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .input.properties.type.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .input.properties.type,
                              data: data117
                            }
                            if (vErrors === null) {
                              vErrors = [err194]
                            } else {
                              vErrors.push(err194)
                            }
                            errors++
                          }
                          if (
                            !(data117 === 'actual' || data117 === 'estimated')
                          ) {
                            var err195 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/input/type',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/input/properties/type/enum',
                              keyword: 'enum',
                              params: {
                                allowedValues:
                                  schema38.properties.registrations.items
                                    .properties.yearlyMetrics.items.properties
                                    .input.properties.type.enum
                              },
                              message:
                                'must be equal to one of the allowed values',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .input.properties.type.enum,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .input.properties.type,
                              data: data117
                            }
                            if (vErrors === null) {
                              vErrors = [err195]
                            } else {
                              vErrors.push(err195)
                            }
                            errors++
                          }
                        }
                        if (data116.ukPackagingWaste !== undefined) {
                          var data118 = data116.ukPackagingWaste
                          if (typeof data118 !== 'string') {
                            var err196 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/input/ukPackagingWaste',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/input/properties/ukPackagingWaste/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .input.properties.ukPackagingWaste.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .input.properties.ukPackagingWaste,
                              data: data118
                            }
                            if (vErrors === null) {
                              vErrors = [err196]
                            } else {
                              vErrors.push(err196)
                            }
                            errors++
                          }
                        }
                        if (data116.nonUkPackagingWaste !== undefined) {
                          var data119 = data116.nonUkPackagingWaste
                          if (typeof data119 !== 'string') {
                            var err197 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/input/nonUkPackagingWaste',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/input/properties/nonUkPackagingWaste/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .input.properties.nonUkPackagingWaste.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .input.properties.nonUkPackagingWaste,
                              data: data119
                            }
                            if (vErrors === null) {
                              vErrors = [err197]
                            } else {
                              vErrors.push(err197)
                            }
                            errors++
                          }
                        }
                        if (data116.nonPackagingWaste !== undefined) {
                          var data120 = data116.nonPackagingWaste
                          if (typeof data120 !== 'string') {
                            var err198 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/input/nonPackagingWaste',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/input/properties/nonPackagingWaste/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .input.properties.nonPackagingWaste.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .input.properties.nonPackagingWaste,
                              data: data120
                            }
                            if (vErrors === null) {
                              vErrors = [err198]
                            } else {
                              vErrors.push(err198)
                            }
                            errors++
                          }
                        }
                      } else {
                        var err199 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/yearlyMetrics/' +
                            i12 +
                            '/input',
                          schemaPath:
                            '#/properties/registrations/items/properties/yearlyMetrics/items/properties/input/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                          schema:
                            schema38.properties.registrations.items.properties
                              .yearlyMetrics.items.properties.input.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .yearlyMetrics.items.properties.input,
                          data: data116
                        }
                        if (vErrors === null) {
                          vErrors = [err199]
                        } else {
                          vErrors.push(err199)
                        }
                        errors++
                      }
                    }
                    if (data114.rawMaterialInputs !== undefined) {
                      var data121 = data114.rawMaterialInputs
                      if (
                        data121 &&
                        typeof data121 == 'object' &&
                        !Array.isArray(data121)
                      ) {
                        for (var key19 in data121) {
                          if (!(key19 === 'material' || key19 === 'tonnage')) {
                            var err200 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/rawMaterialInputs',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/rawMaterialInputs/additionalProperties',
                              keyword: 'additionalProperties',
                              params: { additionalProperty: key19 },
                              message: 'must NOT have additional properties',
                              schema: false,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .rawMaterialInputs,
                              data: data121
                            }
                            if (vErrors === null) {
                              vErrors = [err200]
                            } else {
                              vErrors.push(err200)
                            }
                            errors++
                          }
                        }
                        if (data121.material !== undefined) {
                          var data122 = data121.material
                          if (typeof data122 !== 'string') {
                            var err201 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/rawMaterialInputs/material',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/rawMaterialInputs/properties/material/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .rawMaterialInputs.properties.material.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .rawMaterialInputs.properties.material,
                              data: data122
                            }
                            if (vErrors === null) {
                              vErrors = [err201]
                            } else {
                              vErrors.push(err201)
                            }
                            errors++
                          }
                        }
                        if (data121.tonnage !== undefined) {
                          var data123 = data121.tonnage
                          if (typeof data123 !== 'string') {
                            var err202 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/rawMaterialInputs/tonnage',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/rawMaterialInputs/properties/tonnage/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .rawMaterialInputs.properties.tonnage.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .rawMaterialInputs.properties.tonnage,
                              data: data123
                            }
                            if (vErrors === null) {
                              vErrors = [err202]
                            } else {
                              vErrors.push(err202)
                            }
                            errors++
                          }
                        }
                      } else {
                        var err203 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/yearlyMetrics/' +
                            i12 +
                            '/rawMaterialInputs',
                          schemaPath:
                            '#/properties/registrations/items/properties/yearlyMetrics/items/properties/rawMaterialInputs/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                          schema:
                            schema38.properties.registrations.items.properties
                              .yearlyMetrics.items.properties.rawMaterialInputs
                              .type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .yearlyMetrics.items.properties.rawMaterialInputs,
                          data: data121
                        }
                        if (vErrors === null) {
                          vErrors = [err203]
                        } else {
                          vErrors.push(err203)
                        }
                        errors++
                      }
                    }
                    if (data114.output !== undefined) {
                      var data124 = data114.output
                      if (
                        data124 &&
                        typeof data124 == 'object' &&
                        !Array.isArray(data124)
                      ) {
                        for (var key20 in data124) {
                          if (
                            !(
                              key20 === 'type' ||
                              key20 === 'sentToAnotherSite' ||
                              key20 === 'contaminants' ||
                              key20 === 'processLoss'
                            )
                          ) {
                            var err204 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/output',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/output/additionalProperties',
                              keyword: 'additionalProperties',
                              params: { additionalProperty: key20 },
                              message: 'must NOT have additional properties',
                              schema: false,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .output,
                              data: data124
                            }
                            if (vErrors === null) {
                              vErrors = [err204]
                            } else {
                              vErrors.push(err204)
                            }
                            errors++
                          }
                        }
                        if (data124.type !== undefined) {
                          var data125 = data124.type
                          if (typeof data125 !== 'string') {
                            var err205 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/output/type',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/output/properties/type/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .output.properties.type.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .output.properties.type,
                              data: data125
                            }
                            if (vErrors === null) {
                              vErrors = [err205]
                            } else {
                              vErrors.push(err205)
                            }
                            errors++
                          }
                          if (
                            !(data125 === 'actual' || data125 === 'estimated')
                          ) {
                            var err206 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/output/type',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/output/properties/type/enum',
                              keyword: 'enum',
                              params: {
                                allowedValues:
                                  schema38.properties.registrations.items
                                    .properties.yearlyMetrics.items.properties
                                    .output.properties.type.enum
                              },
                              message:
                                'must be equal to one of the allowed values',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .output.properties.type.enum,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .output.properties.type,
                              data: data125
                            }
                            if (vErrors === null) {
                              vErrors = [err206]
                            } else {
                              vErrors.push(err206)
                            }
                            errors++
                          }
                        }
                        if (data124.sentToAnotherSite !== undefined) {
                          var data126 = data124.sentToAnotherSite
                          if (typeof data126 !== 'string') {
                            var err207 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/output/sentToAnotherSite',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/output/properties/sentToAnotherSite/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .output.properties.sentToAnotherSite.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .output.properties.sentToAnotherSite,
                              data: data126
                            }
                            if (vErrors === null) {
                              vErrors = [err207]
                            } else {
                              vErrors.push(err207)
                            }
                            errors++
                          }
                        }
                        if (data124.contaminants !== undefined) {
                          var data127 = data124.contaminants
                          if (typeof data127 !== 'string') {
                            var err208 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/output/contaminants',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/output/properties/contaminants/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .output.properties.contaminants.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .output.properties.contaminants,
                              data: data127
                            }
                            if (vErrors === null) {
                              vErrors = [err208]
                            } else {
                              vErrors.push(err208)
                            }
                            errors++
                          }
                        }
                        if (data124.processLoss !== undefined) {
                          var data128 = data124.processLoss
                          if (typeof data128 !== 'string') {
                            var err209 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/output/processLoss',
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/output/properties/processLoss/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .output.properties.processLoss.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .output.properties.processLoss,
                              data: data128
                            }
                            if (vErrors === null) {
                              vErrors = [err209]
                            } else {
                              vErrors.push(err209)
                            }
                            errors++
                          }
                        }
                      } else {
                        var err210 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/yearlyMetrics/' +
                            i12 +
                            '/output',
                          schemaPath:
                            '#/properties/registrations/items/properties/yearlyMetrics/items/properties/output/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                          schema:
                            schema38.properties.registrations.items.properties
                              .yearlyMetrics.items.properties.output.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .yearlyMetrics.items.properties.output,
                          data: data124
                        }
                        if (vErrors === null) {
                          vErrors = [err210]
                        } else {
                          vErrors.push(err210)
                        }
                        errors++
                      }
                    }
                    if (data114.productsMadeFromRecycling !== undefined) {
                      var data129 = data114.productsMadeFromRecycling
                      if (Array.isArray(data129)) {
                        var len13 = data129.length
                        for (var i13 = 0; i13 < len13; i13++) {
                          var data130 = data129[i13]
                          if (
                            data130 &&
                            typeof data130 == 'object' &&
                            !Array.isArray(data130)
                          ) {
                            for (var key21 in data130) {
                              if (!(key21 === 'name' || key21 === 'weight')) {
                                var err211 = {
                                  instancePath:
                                    instancePath +
                                    '/registrations/' +
                                    i3 +
                                    '/yearlyMetrics/' +
                                    i12 +
                                    '/productsMadeFromRecycling/' +
                                    i13,
                                  schemaPath:
                                    '#/properties/registrations/items/properties/yearlyMetrics/items/properties/productsMadeFromRecycling/items/additionalProperties',
                                  keyword: 'additionalProperties',
                                  params: { additionalProperty: key21 },
                                  message:
                                    'must NOT have additional properties',
                                  schema: false,
                                  parentSchema:
                                    schema38.properties.registrations.items
                                      .properties.yearlyMetrics.items.properties
                                      .productsMadeFromRecycling.items,
                                  data: data130
                                }
                                if (vErrors === null) {
                                  vErrors = [err211]
                                } else {
                                  vErrors.push(err211)
                                }
                                errors++
                              }
                            }
                            if (data130.name !== undefined) {
                              var data131 = data130.name
                              if (typeof data131 !== 'string') {
                                var err212 = {
                                  instancePath:
                                    instancePath +
                                    '/registrations/' +
                                    i3 +
                                    '/yearlyMetrics/' +
                                    i12 +
                                    '/productsMadeFromRecycling/' +
                                    i13 +
                                    '/name',
                                  schemaPath:
                                    '#/properties/registrations/items/properties/yearlyMetrics/items/properties/productsMadeFromRecycling/items/properties/name/type',
                                  keyword: 'type',
                                  params: { type: 'string' },
                                  message: 'must be string',
                                  schema:
                                    schema38.properties.registrations.items
                                      .properties.yearlyMetrics.items.properties
                                      .productsMadeFromRecycling.items
                                      .properties.name.type,
                                  parentSchema:
                                    schema38.properties.registrations.items
                                      .properties.yearlyMetrics.items.properties
                                      .productsMadeFromRecycling.items
                                      .properties.name,
                                  data: data131
                                }
                                if (vErrors === null) {
                                  vErrors = [err212]
                                } else {
                                  vErrors.push(err212)
                                }
                                errors++
                              }
                            }
                            if (data130.weight !== undefined) {
                              var data132 = data130.weight
                              if (typeof data132 !== 'string') {
                                var err213 = {
                                  instancePath:
                                    instancePath +
                                    '/registrations/' +
                                    i3 +
                                    '/yearlyMetrics/' +
                                    i12 +
                                    '/productsMadeFromRecycling/' +
                                    i13 +
                                    '/weight',
                                  schemaPath:
                                    '#/properties/registrations/items/properties/yearlyMetrics/items/properties/productsMadeFromRecycling/items/properties/weight/type',
                                  keyword: 'type',
                                  params: { type: 'string' },
                                  message: 'must be string',
                                  schema:
                                    schema38.properties.registrations.items
                                      .properties.yearlyMetrics.items.properties
                                      .productsMadeFromRecycling.items
                                      .properties.weight.type,
                                  parentSchema:
                                    schema38.properties.registrations.items
                                      .properties.yearlyMetrics.items.properties
                                      .productsMadeFromRecycling.items
                                      .properties.weight,
                                  data: data132
                                }
                                if (vErrors === null) {
                                  vErrors = [err213]
                                } else {
                                  vErrors.push(err213)
                                }
                                errors++
                              }
                            }
                          } else {
                            var err214 = {
                              instancePath:
                                instancePath +
                                '/registrations/' +
                                i3 +
                                '/yearlyMetrics/' +
                                i12 +
                                '/productsMadeFromRecycling/' +
                                i13,
                              schemaPath:
                                '#/properties/registrations/items/properties/yearlyMetrics/items/properties/productsMadeFromRecycling/items/type',
                              keyword: 'type',
                              params: { type: 'object' },
                              message: 'must be object',
                              schema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .productsMadeFromRecycling.items.type,
                              parentSchema:
                                schema38.properties.registrations.items
                                  .properties.yearlyMetrics.items.properties
                                  .productsMadeFromRecycling.items,
                              data: data130
                            }
                            if (vErrors === null) {
                              vErrors = [err214]
                            } else {
                              vErrors.push(err214)
                            }
                            errors++
                          }
                        }
                      } else {
                        var err215 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/yearlyMetrics/' +
                            i12 +
                            '/productsMadeFromRecycling',
                          schemaPath:
                            '#/properties/registrations/items/properties/yearlyMetrics/items/properties/productsMadeFromRecycling/type',
                          keyword: 'type',
                          params: { type: 'array' },
                          message: 'must be array',
                          schema:
                            schema38.properties.registrations.items.properties
                              .yearlyMetrics.items.properties
                              .productsMadeFromRecycling.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .yearlyMetrics.items.properties
                              .productsMadeFromRecycling,
                          data: data129
                        }
                        if (vErrors === null) {
                          vErrors = [err215]
                        } else {
                          vErrors.push(err215)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err216 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/yearlyMetrics/' +
                        i12,
                      schemaPath:
                        '#/properties/registrations/items/properties/yearlyMetrics/items/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                      schema:
                        schema38.properties.registrations.items.properties
                          .yearlyMetrics.items.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .yearlyMetrics.items,
                      data: data114
                    }
                    if (vErrors === null) {
                      vErrors = [err216]
                    } else {
                      vErrors.push(err216)
                    }
                    errors++
                  }
                }
              } else {
                var err217 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/yearlyMetrics',
                  schemaPath:
                    '#/properties/registrations/items/properties/yearlyMetrics/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                  schema:
                    schema38.properties.registrations.items.properties
                      .yearlyMetrics.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .yearlyMetrics,
                  data: data113
                }
                if (vErrors === null) {
                  vErrors = [err217]
                } else {
                  vErrors.push(err217)
                }
                errors++
              }
            }
            if (data46.plantEquipmentDetails !== undefined) {
              var data133 = data46.plantEquipmentDetails
              if (typeof data133 !== 'string') {
                var err218 = {
                  instancePath:
                    instancePath +
                    '/registrations/' +
                    i3 +
                    '/plantEquipmentDetails',
                  schemaPath:
                    '#/properties/registrations/items/properties/plantEquipmentDetails/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.registrations.items.properties
                      .plantEquipmentDetails.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .plantEquipmentDetails,
                  data: data133
                }
                if (vErrors === null) {
                  vErrors = [err218]
                } else {
                  vErrors.push(err218)
                }
                errors++
              }
            }
            if (data46.submitterContactDetails !== undefined) {
              var data134 = data46.submitterContactDetails
              var _errs302 = errors
              var valid53 = false
              var _errs303 = errors
              if (
                data134 &&
                typeof data134 == 'object' &&
                !Array.isArray(data134)
              ) {
                if (data134.role === undefined) {
                  var err219 = {
                    instancePath:
                      instancePath +
                      '/registrations/' +
                      i3 +
                      '/submitterContactDetails',
                    schemaPath:
                      '#/properties/registrations/items/properties/submitterContactDetails/anyOf/0/required',
                    keyword: 'required',
                    params: { missingProperty: 'role' },
                    message: "must have required property '" + 'role' + "'",
                    schema:
                      schema38.properties.registrations.items.properties
                        .submitterContactDetails.anyOf[0].required,
                    parentSchema:
                      schema38.properties.registrations.items.properties
                        .submitterContactDetails.anyOf[0],
                    data: data134
                  }
                  if (vErrors === null) {
                    vErrors = [err219]
                  } else {
                    vErrors.push(err219)
                  }
                  errors++
                }
              }
              var _valid3 = _errs303 === errors
              valid53 = valid53 || _valid3
              if (!valid53) {
                var _errs304 = errors
                if (
                  data134 &&
                  typeof data134 == 'object' &&
                  !Array.isArray(data134)
                ) {
                  if (data134.title === undefined) {
                    var err220 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/submitterContactDetails',
                      schemaPath:
                        '#/properties/registrations/items/properties/submitterContactDetails/anyOf/1/required',
                      keyword: 'required',
                      params: { missingProperty: 'title' },
                      message: "must have required property '" + 'title' + "'",
                      schema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails.anyOf[1].required,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails.anyOf[1],
                      data: data134
                    }
                    if (vErrors === null) {
                      vErrors = [err220]
                    } else {
                      vErrors.push(err220)
                    }
                    errors++
                  }
                }
                var _valid3 = _errs304 === errors
                valid53 = valid53 || _valid3
              }
              if (!valid53) {
                var err221 = {
                  instancePath:
                    instancePath +
                    '/registrations/' +
                    i3 +
                    '/submitterContactDetails',
                  schemaPath:
                    '#/properties/registrations/items/properties/submitterContactDetails/anyOf',
                  keyword: 'anyOf',
                  params: {},
                  message: 'must match a schema in anyOf',
                  schema:
                    schema38.properties.registrations.items.properties
                      .submitterContactDetails.anyOf,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .submitterContactDetails,
                  data: data134
                }
                if (vErrors === null) {
                  vErrors = [err221]
                } else {
                  vErrors.push(err221)
                }
                errors++
              } else {
                errors = _errs302
                if (vErrors !== null) {
                  if (_errs302) {
                    vErrors.length = _errs302
                  } else {
                    vErrors = null
                  }
                }
              }
              if (
                data134 &&
                typeof data134 == 'object' &&
                !Array.isArray(data134)
              ) {
                if (data134.fullName === undefined) {
                  var err222 = {
                    instancePath:
                      instancePath +
                      '/registrations/' +
                      i3 +
                      '/submitterContactDetails',
                    schemaPath:
                      '#/properties/registrations/items/properties/submitterContactDetails/required',
                    keyword: 'required',
                    params: { missingProperty: 'fullName' },
                    message: "must have required property '" + 'fullName' + "'",
                    schema:
                      schema38.properties.registrations.items.properties
                        .submitterContactDetails.required,
                    parentSchema:
                      schema38.properties.registrations.items.properties
                        .submitterContactDetails,
                    data: data134
                  }
                  if (vErrors === null) {
                    vErrors = [err222]
                  } else {
                    vErrors.push(err222)
                  }
                  errors++
                }
                if (data134.email === undefined) {
                  var err223 = {
                    instancePath:
                      instancePath +
                      '/registrations/' +
                      i3 +
                      '/submitterContactDetails',
                    schemaPath:
                      '#/properties/registrations/items/properties/submitterContactDetails/required',
                    keyword: 'required',
                    params: { missingProperty: 'email' },
                    message: "must have required property '" + 'email' + "'",
                    schema:
                      schema38.properties.registrations.items.properties
                        .submitterContactDetails.required,
                    parentSchema:
                      schema38.properties.registrations.items.properties
                        .submitterContactDetails,
                    data: data134
                  }
                  if (vErrors === null) {
                    vErrors = [err223]
                  } else {
                    vErrors.push(err223)
                  }
                  errors++
                }
                if (data134.phone === undefined) {
                  var err224 = {
                    instancePath:
                      instancePath +
                      '/registrations/' +
                      i3 +
                      '/submitterContactDetails',
                    schemaPath:
                      '#/properties/registrations/items/properties/submitterContactDetails/required',
                    keyword: 'required',
                    params: { missingProperty: 'phone' },
                    message: "must have required property '" + 'phone' + "'",
                    schema:
                      schema38.properties.registrations.items.properties
                        .submitterContactDetails.required,
                    parentSchema:
                      schema38.properties.registrations.items.properties
                        .submitterContactDetails,
                    data: data134
                  }
                  if (vErrors === null) {
                    vErrors = [err224]
                  } else {
                    vErrors.push(err224)
                  }
                  errors++
                }
                for (var key22 in data134) {
                  if (
                    !(
                      key22 === 'fullName' ||
                      key22 === 'email' ||
                      key22 === 'phone' ||
                      key22 === 'role' ||
                      key22 === 'title'
                    )
                  ) {
                    var err225 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/submitterContactDetails',
                      schemaPath:
                        '#/properties/registrations/items/properties/submitterContactDetails/additionalProperties',
                      keyword: 'additionalProperties',
                      params: { additionalProperty: key22 },
                      message: 'must NOT have additional properties',
                      schema: false,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails,
                      data: data134
                    }
                    if (vErrors === null) {
                      vErrors = [err225]
                    } else {
                      vErrors.push(err225)
                    }
                    errors++
                  }
                }
                if (data134.fullName !== undefined) {
                  var data135 = data134.fullName
                  if (typeof data135 !== 'string') {
                    var err226 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/submitterContactDetails/fullName',
                      schemaPath:
                        '#/properties/registrations/items/properties/submitterContactDetails/properties/fullName/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails.properties.fullName.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails.properties.fullName,
                      data: data135
                    }
                    if (vErrors === null) {
                      vErrors = [err226]
                    } else {
                      vErrors.push(err226)
                    }
                    errors++
                  }
                }
                if (data134.email !== undefined) {
                  var data136 = data134.email
                  if (typeof data136 === 'string') {
                    if (!formats0.test(data136)) {
                      var err227 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/submitterContactDetails/email',
                        schemaPath:
                          '#/properties/registrations/items/properties/submitterContactDetails/properties/email/format',
                        keyword: 'format',
                        params: { format: 'email' },
                        message: 'must match format "' + 'email' + '"',
                        schema: 'email',
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .submitterContactDetails.properties.email,
                        data: data136
                      }
                      if (vErrors === null) {
                        vErrors = [err227]
                      } else {
                        vErrors.push(err227)
                      }
                      errors++
                    }
                  } else {
                    var err228 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/submitterContactDetails/email',
                      schemaPath:
                        '#/properties/registrations/items/properties/submitterContactDetails/properties/email/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails.properties.email.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails.properties.email,
                      data: data136
                    }
                    if (vErrors === null) {
                      vErrors = [err228]
                    } else {
                      vErrors.push(err228)
                    }
                    errors++
                  }
                }
                if (data134.phone !== undefined) {
                  var data137 = data134.phone
                  if (typeof data137 !== 'string') {
                    var err229 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/submitterContactDetails/phone',
                      schemaPath:
                        '#/properties/registrations/items/properties/submitterContactDetails/properties/phone/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails.properties.phone.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails.properties.phone,
                      data: data137
                    }
                    if (vErrors === null) {
                      vErrors = [err229]
                    } else {
                      vErrors.push(err229)
                    }
                    errors++
                  }
                }
                if (data134.role !== undefined) {
                  var data138 = data134.role
                  if (typeof data138 !== 'string') {
                    var err230 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/submitterContactDetails/role',
                      schemaPath:
                        '#/properties/registrations/items/properties/submitterContactDetails/properties/role/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails.properties.role.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails.properties.role,
                      data: data138
                    }
                    if (vErrors === null) {
                      vErrors = [err230]
                    } else {
                      vErrors.push(err230)
                    }
                    errors++
                  }
                }
                if (data134.title !== undefined) {
                  var data139 = data134.title
                  if (typeof data139 !== 'string') {
                    var err231 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/submitterContactDetails/title',
                      schemaPath:
                        '#/properties/registrations/items/properties/submitterContactDetails/properties/title/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails.properties.title.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .submitterContactDetails.properties.title,
                      data: data139
                    }
                    if (vErrors === null) {
                      vErrors = [err231]
                    } else {
                      vErrors.push(err231)
                    }
                    errors++
                  }
                }
              } else {
                var err232 = {
                  instancePath:
                    instancePath +
                    '/registrations/' +
                    i3 +
                    '/submitterContactDetails',
                  schemaPath:
                    '#/properties/registrations/items/properties/submitterContactDetails/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                  schema:
                    schema38.properties.registrations.items.properties
                      .submitterContactDetails.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .submitterContactDetails,
                  data: data134
                }
                if (vErrors === null) {
                  vErrors = [err232]
                } else {
                  vErrors.push(err232)
                }
                errors++
              }
            }
            if (data46.samplingInspectionPlanFileUploads !== undefined) {
              var data140 = data46.samplingInspectionPlanFileUploads
              if (Array.isArray(data140)) {
                var len14 = data140.length
                for (var i14 = 0; i14 < len14; i14++) {
                  var data141 = data140[i14]
                  if (
                    data141 &&
                    typeof data141 == 'object' &&
                    !Array.isArray(data141)
                  ) {
                    if (data141.defraFormUploadedFileId === undefined) {
                      var err233 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/samplingInspectionPlanFileUploads/' +
                          i14,
                        schemaPath:
                          '#/properties/registrations/items/properties/samplingInspectionPlanFileUploads/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'defraFormUploadedFileId' },
                        message:
                          "must have required property '" +
                          'defraFormUploadedFileId' +
                          "'",
                        schema:
                          schema38.properties.registrations.items.properties
                            .samplingInspectionPlanFileUploads.items.required,
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .samplingInspectionPlanFileUploads.items,
                        data: data141
                      }
                      if (vErrors === null) {
                        vErrors = [err233]
                      } else {
                        vErrors.push(err233)
                      }
                      errors++
                    }
                    if (data141.defraFormUserDownloadLink === undefined) {
                      var err234 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/samplingInspectionPlanFileUploads/' +
                          i14,
                        schemaPath:
                          '#/properties/registrations/items/properties/samplingInspectionPlanFileUploads/items/required',
                        keyword: 'required',
                        params: {
                          missingProperty: 'defraFormUserDownloadLink'
                        },
                        message:
                          "must have required property '" +
                          'defraFormUserDownloadLink' +
                          "'",
                        schema:
                          schema38.properties.registrations.items.properties
                            .samplingInspectionPlanFileUploads.items.required,
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .samplingInspectionPlanFileUploads.items,
                        data: data141
                      }
                      if (vErrors === null) {
                        vErrors = [err234]
                      } else {
                        vErrors.push(err234)
                      }
                      errors++
                    }
                    for (var key23 in data141) {
                      if (
                        !(
                          key23 === 'defraFormUploadedFileId' ||
                          key23 === 'defraFormUserDownloadLink' ||
                          key23 === 's3Uri'
                        )
                      ) {
                        var err235 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/samplingInspectionPlanFileUploads/' +
                            i14,
                          schemaPath:
                            '#/properties/registrations/items/properties/samplingInspectionPlanFileUploads/items/additionalProperties',
                          keyword: 'additionalProperties',
                          params: { additionalProperty: key23 },
                          message: 'must NOT have additional properties',
                          schema: false,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .samplingInspectionPlanFileUploads.items,
                          data: data141
                        }
                        if (vErrors === null) {
                          vErrors = [err235]
                        } else {
                          vErrors.push(err235)
                        }
                        errors++
                      }
                    }
                    if (data141.defraFormUploadedFileId !== undefined) {
                      var data142 = data141.defraFormUploadedFileId
                      if (typeof data142 !== 'string') {
                        var err236 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/samplingInspectionPlanFileUploads/' +
                            i14 +
                            '/defraFormUploadedFileId',
                          schemaPath:
                            '#/properties/registrations/items/properties/samplingInspectionPlanFileUploads/items/properties/defraFormUploadedFileId/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .samplingInspectionPlanFileUploads.items
                              .properties.defraFormUploadedFileId.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .samplingInspectionPlanFileUploads.items
                              .properties.defraFormUploadedFileId,
                          data: data142
                        }
                        if (vErrors === null) {
                          vErrors = [err236]
                        } else {
                          vErrors.push(err236)
                        }
                        errors++
                      }
                    }
                    if (data141.defraFormUserDownloadLink !== undefined) {
                      var data143 = data141.defraFormUserDownloadLink
                      if (typeof data143 === 'string') {
                        if (!formats14(data143)) {
                          var err237 = {
                            instancePath:
                              instancePath +
                              '/registrations/' +
                              i3 +
                              '/samplingInspectionPlanFileUploads/' +
                              i14 +
                              '/defraFormUserDownloadLink',
                            schemaPath:
                              '#/properties/registrations/items/properties/samplingInspectionPlanFileUploads/items/properties/defraFormUserDownloadLink/format',
                            keyword: 'format',
                            params: { format: 'uri' },
                            message: 'must match format "' + 'uri' + '"',
                            schema: 'uri',
                            parentSchema:
                              schema38.properties.registrations.items.properties
                                .samplingInspectionPlanFileUploads.items
                                .properties.defraFormUserDownloadLink,
                            data: data143
                          }
                          if (vErrors === null) {
                            vErrors = [err237]
                          } else {
                            vErrors.push(err237)
                          }
                          errors++
                        }
                      } else {
                        var err238 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/samplingInspectionPlanFileUploads/' +
                            i14 +
                            '/defraFormUserDownloadLink',
                          schemaPath:
                            '#/properties/registrations/items/properties/samplingInspectionPlanFileUploads/items/properties/defraFormUserDownloadLink/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .samplingInspectionPlanFileUploads.items
                              .properties.defraFormUserDownloadLink.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .samplingInspectionPlanFileUploads.items
                              .properties.defraFormUserDownloadLink,
                          data: data143
                        }
                        if (vErrors === null) {
                          vErrors = [err238]
                        } else {
                          vErrors.push(err238)
                        }
                        errors++
                      }
                    }
                    if (data141.s3Uri !== undefined) {
                      var data144 = data141.s3Uri
                      if (typeof data144 !== 'string') {
                        var err239 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/samplingInspectionPlanFileUploads/' +
                            i14 +
                            '/s3Uri',
                          schemaPath:
                            '#/properties/registrations/items/properties/samplingInspectionPlanFileUploads/items/properties/s3Uri/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .samplingInspectionPlanFileUploads.items
                              .properties.s3Uri.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .samplingInspectionPlanFileUploads.items
                              .properties.s3Uri,
                          data: data144
                        }
                        if (vErrors === null) {
                          vErrors = [err239]
                        } else {
                          vErrors.push(err239)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err240 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/samplingInspectionPlanFileUploads/' +
                        i14,
                      schemaPath:
                        '#/properties/registrations/items/properties/samplingInspectionPlanFileUploads/items/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                      schema:
                        schema38.properties.registrations.items.properties
                          .samplingInspectionPlanFileUploads.items.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .samplingInspectionPlanFileUploads.items,
                      data: data141
                    }
                    if (vErrors === null) {
                      vErrors = [err240]
                    } else {
                      vErrors.push(err240)
                    }
                    errors++
                  }
                }
              } else {
                var err241 = {
                  instancePath:
                    instancePath +
                    '/registrations/' +
                    i3 +
                    '/samplingInspectionPlanFileUploads',
                  schemaPath:
                    '#/properties/registrations/items/properties/samplingInspectionPlanFileUploads/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                  schema:
                    schema38.properties.registrations.items.properties
                      .samplingInspectionPlanFileUploads.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .samplingInspectionPlanFileUploads,
                  data: data140
                }
                if (vErrors === null) {
                  vErrors = [err241]
                } else {
                  vErrors.push(err241)
                }
                errors++
              }
            }
            if (data46.orsFileUploads !== undefined) {
              var data145 = data46.orsFileUploads
              if (Array.isArray(data145)) {
                var len15 = data145.length
                for (var i15 = 0; i15 < len15; i15++) {
                  var data146 = data145[i15]
                  if (
                    data146 &&
                    typeof data146 == 'object' &&
                    !Array.isArray(data146)
                  ) {
                    if (data146.defraFormUploadedFileId === undefined) {
                      var err242 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/orsFileUploads/' +
                          i15,
                        schemaPath:
                          '#/properties/registrations/items/properties/orsFileUploads/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'defraFormUploadedFileId' },
                        message:
                          "must have required property '" +
                          'defraFormUploadedFileId' +
                          "'",
                        schema:
                          schema38.properties.registrations.items.properties
                            .orsFileUploads.items.required,
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .orsFileUploads.items,
                        data: data146
                      }
                      if (vErrors === null) {
                        vErrors = [err242]
                      } else {
                        vErrors.push(err242)
                      }
                      errors++
                    }
                    if (data146.defraFormUserDownloadLink === undefined) {
                      var err243 = {
                        instancePath:
                          instancePath +
                          '/registrations/' +
                          i3 +
                          '/orsFileUploads/' +
                          i15,
                        schemaPath:
                          '#/properties/registrations/items/properties/orsFileUploads/items/required',
                        keyword: 'required',
                        params: {
                          missingProperty: 'defraFormUserDownloadLink'
                        },
                        message:
                          "must have required property '" +
                          'defraFormUserDownloadLink' +
                          "'",
                        schema:
                          schema38.properties.registrations.items.properties
                            .orsFileUploads.items.required,
                        parentSchema:
                          schema38.properties.registrations.items.properties
                            .orsFileUploads.items,
                        data: data146
                      }
                      if (vErrors === null) {
                        vErrors = [err243]
                      } else {
                        vErrors.push(err243)
                      }
                      errors++
                    }
                    for (var key24 in data146) {
                      if (
                        !(
                          key24 === 'defraFormUploadedFileId' ||
                          key24 === 'defraFormUserDownloadLink' ||
                          key24 === 's3Uri'
                        )
                      ) {
                        var err244 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/orsFileUploads/' +
                            i15,
                          schemaPath:
                            '#/properties/registrations/items/properties/orsFileUploads/items/additionalProperties',
                          keyword: 'additionalProperties',
                          params: { additionalProperty: key24 },
                          message: 'must NOT have additional properties',
                          schema: false,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .orsFileUploads.items,
                          data: data146
                        }
                        if (vErrors === null) {
                          vErrors = [err244]
                        } else {
                          vErrors.push(err244)
                        }
                        errors++
                      }
                    }
                    if (data146.defraFormUploadedFileId !== undefined) {
                      var data147 = data146.defraFormUploadedFileId
                      if (typeof data147 !== 'string') {
                        var err245 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/orsFileUploads/' +
                            i15 +
                            '/defraFormUploadedFileId',
                          schemaPath:
                            '#/properties/registrations/items/properties/orsFileUploads/items/properties/defraFormUploadedFileId/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .orsFileUploads.items.properties
                              .defraFormUploadedFileId.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .orsFileUploads.items.properties
                              .defraFormUploadedFileId,
                          data: data147
                        }
                        if (vErrors === null) {
                          vErrors = [err245]
                        } else {
                          vErrors.push(err245)
                        }
                        errors++
                      }
                    }
                    if (data146.defraFormUserDownloadLink !== undefined) {
                      var data148 = data146.defraFormUserDownloadLink
                      if (typeof data148 === 'string') {
                        if (!formats14(data148)) {
                          var err246 = {
                            instancePath:
                              instancePath +
                              '/registrations/' +
                              i3 +
                              '/orsFileUploads/' +
                              i15 +
                              '/defraFormUserDownloadLink',
                            schemaPath:
                              '#/properties/registrations/items/properties/orsFileUploads/items/properties/defraFormUserDownloadLink/format',
                            keyword: 'format',
                            params: { format: 'uri' },
                            message: 'must match format "' + 'uri' + '"',
                            schema: 'uri',
                            parentSchema:
                              schema38.properties.registrations.items.properties
                                .orsFileUploads.items.properties
                                .defraFormUserDownloadLink,
                            data: data148
                          }
                          if (vErrors === null) {
                            vErrors = [err246]
                          } else {
                            vErrors.push(err246)
                          }
                          errors++
                        }
                      } else {
                        var err247 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/orsFileUploads/' +
                            i15 +
                            '/defraFormUserDownloadLink',
                          schemaPath:
                            '#/properties/registrations/items/properties/orsFileUploads/items/properties/defraFormUserDownloadLink/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .orsFileUploads.items.properties
                              .defraFormUserDownloadLink.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .orsFileUploads.items.properties
                              .defraFormUserDownloadLink,
                          data: data148
                        }
                        if (vErrors === null) {
                          vErrors = [err247]
                        } else {
                          vErrors.push(err247)
                        }
                        errors++
                      }
                    }
                    if (data146.s3Uri !== undefined) {
                      var data149 = data146.s3Uri
                      if (typeof data149 !== 'string') {
                        var err248 = {
                          instancePath:
                            instancePath +
                            '/registrations/' +
                            i3 +
                            '/orsFileUploads/' +
                            i15 +
                            '/s3Uri',
                          schemaPath:
                            '#/properties/registrations/items/properties/orsFileUploads/items/properties/s3Uri/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.registrations.items.properties
                              .orsFileUploads.items.properties.s3Uri.type,
                          parentSchema:
                            schema38.properties.registrations.items.properties
                              .orsFileUploads.items.properties.s3Uri,
                          data: data149
                        }
                        if (vErrors === null) {
                          vErrors = [err248]
                        } else {
                          vErrors.push(err248)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err249 = {
                      instancePath:
                        instancePath +
                        '/registrations/' +
                        i3 +
                        '/orsFileUploads/' +
                        i15,
                      schemaPath:
                        '#/properties/registrations/items/properties/orsFileUploads/items/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                      schema:
                        schema38.properties.registrations.items.properties
                          .orsFileUploads.items.type,
                      parentSchema:
                        schema38.properties.registrations.items.properties
                          .orsFileUploads.items,
                      data: data146
                    }
                    if (vErrors === null) {
                      vErrors = [err249]
                    } else {
                      vErrors.push(err249)
                    }
                    errors++
                  }
                }
              } else {
                var err250 = {
                  instancePath:
                    instancePath + '/registrations/' + i3 + '/orsFileUploads',
                  schemaPath:
                    '#/properties/registrations/items/properties/orsFileUploads/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                  schema:
                    schema38.properties.registrations.items.properties
                      .orsFileUploads.type,
                  parentSchema:
                    schema38.properties.registrations.items.properties
                      .orsFileUploads,
                  data: data145
                }
                if (vErrors === null) {
                  vErrors = [err250]
                } else {
                  vErrors.push(err250)
                }
                errors++
              }
            }
          } else {
            var err251 = {
              instancePath: instancePath + '/registrations/' + i3,
              schemaPath: '#/properties/registrations/items/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
              schema: schema38.properties.registrations.items.type,
              parentSchema: schema38.properties.registrations.items,
              data: data46
            }
            if (vErrors === null) {
              vErrors = [err251]
            } else {
              vErrors.push(err251)
            }
            errors++
          }
        }
      } else {
        var err252 = {
          instancePath: instancePath + '/registrations',
          schemaPath: '#/properties/registrations/type',
          keyword: 'type',
          params: { type: 'array' },
          message: 'must be array',
          schema: schema38.properties.registrations.type,
          parentSchema: schema38.properties.registrations,
          data: data45
        }
        if (vErrors === null) {
          vErrors = [err252]
        } else {
          vErrors.push(err252)
        }
        errors++
      }
    }
    if (data.accreditations !== undefined) {
      var data150 = data.accreditations
      if (Array.isArray(data150)) {
        var len16 = data150.length
        for (var i16 = 0; i16 < len16; i16++) {
          var data151 = data150[i16]
          if (
            data151 &&
            typeof data151 == 'object' &&
            !Array.isArray(data151)
          ) {
            if (data151.id === undefined) {
              var err253 = {
                instancePath: instancePath + '/accreditations/' + i16,
                schemaPath: '#/properties/accreditations/items/required',
                keyword: 'required',
                params: { missingProperty: 'id' },
                message: "must have required property '" + 'id' + "'",
                schema: schema38.properties.accreditations.items.required,
                parentSchema: schema38.properties.accreditations.items,
                data: data151
              }
              if (vErrors === null) {
                vErrors = [err253]
              } else {
                vErrors.push(err253)
              }
              errors++
            }
            if (data151.formSubmissionTime === undefined) {
              var err254 = {
                instancePath: instancePath + '/accreditations/' + i16,
                schemaPath: '#/properties/accreditations/items/required',
                keyword: 'required',
                params: { missingProperty: 'formSubmissionTime' },
                message:
                  "must have required property '" + 'formSubmissionTime' + "'",
                schema: schema38.properties.accreditations.items.required,
                parentSchema: schema38.properties.accreditations.items,
                data: data151
              }
              if (vErrors === null) {
                vErrors = [err254]
              } else {
                vErrors.push(err254)
              }
              errors++
            }
            if (data151.submittedToRegulator === undefined) {
              var err255 = {
                instancePath: instancePath + '/accreditations/' + i16,
                schemaPath: '#/properties/accreditations/items/required',
                keyword: 'required',
                params: { missingProperty: 'submittedToRegulator' },
                message:
                  "must have required property '" +
                  'submittedToRegulator' +
                  "'",
                schema: schema38.properties.accreditations.items.required,
                parentSchema: schema38.properties.accreditations.items,
                data: data151
              }
              if (vErrors === null) {
                vErrors = [err255]
              } else {
                vErrors.push(err255)
              }
              errors++
            }
            if (data151.material === undefined) {
              var err256 = {
                instancePath: instancePath + '/accreditations/' + i16,
                schemaPath: '#/properties/accreditations/items/required',
                keyword: 'required',
                params: { missingProperty: 'material' },
                message: "must have required property '" + 'material' + "'",
                schema: schema38.properties.accreditations.items.required,
                parentSchema: schema38.properties.accreditations.items,
                data: data151
              }
              if (vErrors === null) {
                vErrors = [err256]
              } else {
                vErrors.push(err256)
              }
              errors++
            }
            if (data151.wasteProcessingType === undefined) {
              var err257 = {
                instancePath: instancePath + '/accreditations/' + i16,
                schemaPath: '#/properties/accreditations/items/required',
                keyword: 'required',
                params: { missingProperty: 'wasteProcessingType' },
                message:
                  "must have required property '" + 'wasteProcessingType' + "'",
                schema: schema38.properties.accreditations.items.required,
                parentSchema: schema38.properties.accreditations.items,
                data: data151
              }
              if (vErrors === null) {
                vErrors = [err257]
              } else {
                vErrors.push(err257)
              }
              errors++
            }
            for (var key25 in data151) {
              if (
                !func4.call(
                  schema38.properties.accreditations.items.properties,
                  key25
                )
              ) {
                var err258 = {
                  instancePath: instancePath + '/accreditations/' + i16,
                  schemaPath:
                    '#/properties/accreditations/items/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key25 },
                  message: 'must NOT have additional properties',
                  schema: false,
                  parentSchema: schema38.properties.accreditations.items,
                  data: data151
                }
                if (vErrors === null) {
                  vErrors = [err258]
                } else {
                  vErrors.push(err258)
                }
                errors++
              }
            }
            if (data151.id !== undefined) {
              var data152 = data151.id
              if (typeof data152 !== 'string') {
                var err259 = {
                  instancePath: instancePath + '/accreditations/' + i16 + '/id',
                  schemaPath:
                    '#/properties/accreditations/items/properties/id/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.accreditations.items.properties.id.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties.id,
                  data: data152
                }
                if (vErrors === null) {
                  vErrors = [err259]
                } else {
                  vErrors.push(err259)
                }
                errors++
              }
            }
            if (data151.accreditationNumber !== undefined) {
              var data153 = data151.accreditationNumber
              if (!(typeof data153 == 'number' && isFinite(data153))) {
                var err260 = {
                  instancePath:
                    instancePath +
                    '/accreditations/' +
                    i16 +
                    '/accreditationNumber',
                  schemaPath:
                    '#/properties/accreditations/items/properties/accreditationNumber/type',
                  keyword: 'type',
                  params: { type: 'number' },
                  message: 'must be number',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .accreditationNumber.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .accreditationNumber,
                  data: data153
                }
                if (vErrors === null) {
                  vErrors = [err260]
                } else {
                  vErrors.push(err260)
                }
                errors++
              }
            }
            if (data151.statusHistory !== undefined) {
              var data154 = data151.statusHistory
              if (Array.isArray(data154)) {
                var len17 = data154.length
                for (var i17 = 0; i17 < len17; i17++) {
                  var data155 = data154[i17]
                  if (
                    data155 &&
                    typeof data155 == 'object' &&
                    !Array.isArray(data155)
                  ) {
                    if (data155.status === undefined) {
                      var err261 = {
                        instancePath:
                          instancePath +
                          '/accreditations/' +
                          i16 +
                          '/statusHistory/' +
                          i17,
                        schemaPath:
                          '#/properties/accreditations/items/properties/statusHistory/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'status' },
                        message:
                          "must have required property '" + 'status' + "'",
                        schema:
                          schema38.properties.accreditations.items.properties
                            .statusHistory.items.required,
                        parentSchema:
                          schema38.properties.accreditations.items.properties
                            .statusHistory.items,
                        data: data155
                      }
                      if (vErrors === null) {
                        vErrors = [err261]
                      } else {
                        vErrors.push(err261)
                      }
                      errors++
                    }
                    if (data155.updatedAt === undefined) {
                      var err262 = {
                        instancePath:
                          instancePath +
                          '/accreditations/' +
                          i16 +
                          '/statusHistory/' +
                          i17,
                        schemaPath:
                          '#/properties/accreditations/items/properties/statusHistory/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'updatedAt' },
                        message:
                          "must have required property '" + 'updatedAt' + "'",
                        schema:
                          schema38.properties.accreditations.items.properties
                            .statusHistory.items.required,
                        parentSchema:
                          schema38.properties.accreditations.items.properties
                            .statusHistory.items,
                        data: data155
                      }
                      if (vErrors === null) {
                        vErrors = [err262]
                      } else {
                        vErrors.push(err262)
                      }
                      errors++
                    }
                    for (var key26 in data155) {
                      if (
                        !(
                          key26 === 'status' ||
                          key26 === 'updatedAt' ||
                          key26 === 'updatedBy'
                        )
                      ) {
                        var err263 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/statusHistory/' +
                            i17,
                          schemaPath:
                            '#/properties/accreditations/items/properties/statusHistory/items/additionalProperties',
                          keyword: 'additionalProperties',
                          params: { additionalProperty: key26 },
                          message: 'must NOT have additional properties',
                          schema: false,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .statusHistory.items,
                          data: data155
                        }
                        if (vErrors === null) {
                          vErrors = [err263]
                        } else {
                          vErrors.push(err263)
                        }
                        errors++
                      }
                    }
                    if (data155.status !== undefined) {
                      var data156 = data155.status
                      if (typeof data156 !== 'string') {
                        var err264 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/statusHistory/' +
                            i17 +
                            '/status',
                          schemaPath:
                            '#/properties/accreditations/items/properties/statusHistory/items/properties/status/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .statusHistory.items.properties.status.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .statusHistory.items.properties.status,
                          data: data156
                        }
                        if (vErrors === null) {
                          vErrors = [err264]
                        } else {
                          vErrors.push(err264)
                        }
                        errors++
                      }
                      if (
                        !(
                          data156 === 'created' ||
                          data156 === 'approved' ||
                          data156 === 'rejected' ||
                          data156 === 'suspended' ||
                          data156 === 'archived'
                        )
                      ) {
                        var err265 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/statusHistory/' +
                            i17 +
                            '/status',
                          schemaPath:
                            '#/properties/accreditations/items/properties/statusHistory/items/properties/status/enum',
                          keyword: 'enum',
                          params: {
                            allowedValues:
                              schema38.properties.accreditations.items
                                .properties.statusHistory.items.properties
                                .status.enum
                          },
                          message: 'must be equal to one of the allowed values',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .statusHistory.items.properties.status.enum,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .statusHistory.items.properties.status,
                          data: data156
                        }
                        if (vErrors === null) {
                          vErrors = [err265]
                        } else {
                          vErrors.push(err265)
                        }
                        errors++
                      }
                    }
                    if (data155.updatedAt !== undefined) {
                      var data157 = data155.updatedAt
                      if (typeof data157 === 'string') {
                        if (!formats4.validate(data157)) {
                          var err266 = {
                            instancePath:
                              instancePath +
                              '/accreditations/' +
                              i16 +
                              '/statusHistory/' +
                              i17 +
                              '/updatedAt',
                            schemaPath:
                              '#/properties/accreditations/items/properties/statusHistory/items/properties/updatedAt/format',
                            keyword: 'format',
                            params: { format: 'date-time' },
                            message: 'must match format "' + 'date-time' + '"',
                            schema: 'date-time',
                            parentSchema:
                              schema38.properties.accreditations.items
                                .properties.statusHistory.items.properties
                                .updatedAt,
                            data: data157
                          }
                          if (vErrors === null) {
                            vErrors = [err266]
                          } else {
                            vErrors.push(err266)
                          }
                          errors++
                        }
                      } else {
                        var err267 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/statusHistory/' +
                            i17 +
                            '/updatedAt',
                          schemaPath:
                            '#/properties/accreditations/items/properties/statusHistory/items/properties/updatedAt/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .statusHistory.items.properties.updatedAt.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .statusHistory.items.properties.updatedAt,
                          data: data157
                        }
                        if (vErrors === null) {
                          vErrors = [err267]
                        } else {
                          vErrors.push(err267)
                        }
                        errors++
                      }
                    }
                    if (data155.updatedBy !== undefined) {
                      var data158 = data155.updatedBy
                      if (typeof data158 !== 'string') {
                        var err268 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/statusHistory/' +
                            i17 +
                            '/updatedBy',
                          schemaPath:
                            '#/properties/accreditations/items/properties/statusHistory/items/properties/updatedBy/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .statusHistory.items.properties.updatedBy.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .statusHistory.items.properties.updatedBy,
                          data: data158
                        }
                        if (vErrors === null) {
                          vErrors = [err268]
                        } else {
                          vErrors.push(err268)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err269 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/statusHistory/' +
                        i17,
                      schemaPath:
                        '#/properties/accreditations/items/properties/statusHistory/items/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .statusHistory.items.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .statusHistory.items,
                      data: data155
                    }
                    if (vErrors === null) {
                      vErrors = [err269]
                    } else {
                      vErrors.push(err269)
                    }
                    errors++
                  }
                }
              } else {
                var err270 = {
                  instancePath:
                    instancePath + '/accreditations/' + i16 + '/statusHistory',
                  schemaPath:
                    '#/properties/accreditations/items/properties/statusHistory/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .statusHistory.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .statusHistory,
                  data: data154
                }
                if (vErrors === null) {
                  vErrors = [err270]
                } else {
                  vErrors.push(err270)
                }
                errors++
              }
            }
            if (data151.status !== undefined) {
              var data159 = data151.status
              if (typeof data159 !== 'string') {
                var err271 = {
                  instancePath:
                    instancePath + '/accreditations/' + i16 + '/status',
                  schemaPath:
                    '#/properties/accreditations/items/properties/status/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.accreditations.items.properties.status
                      .type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties.status,
                  data: data159
                }
                if (vErrors === null) {
                  vErrors = [err271]
                } else {
                  vErrors.push(err271)
                }
                errors++
              }
              if (
                !(
                  data159 === 'created' ||
                  data159 === 'approved' ||
                  data159 === 'rejected' ||
                  data159 === 'suspended' ||
                  data159 === 'archived'
                )
              ) {
                var err272 = {
                  instancePath:
                    instancePath + '/accreditations/' + i16 + '/status',
                  schemaPath:
                    '#/properties/accreditations/items/properties/status/enum',
                  keyword: 'enum',
                  params: {
                    allowedValues:
                      schema38.properties.accreditations.items.properties.status
                        .enum
                  },
                  message: 'must be equal to one of the allowed values',
                  schema:
                    schema38.properties.accreditations.items.properties.status
                      .enum,
                  parentSchema:
                    schema38.properties.accreditations.items.properties.status,
                  data: data159
                }
                if (vErrors === null) {
                  vErrors = [err272]
                } else {
                  vErrors.push(err272)
                }
                errors++
              }
            }
            if (data151.formSubmissionTime !== undefined) {
              var data160 = data151.formSubmissionTime
              if (typeof data160 === 'string') {
                if (!formats4.validate(data160)) {
                  var err273 = {
                    instancePath:
                      instancePath +
                      '/accreditations/' +
                      i16 +
                      '/formSubmissionTime',
                    schemaPath:
                      '#/properties/accreditations/items/properties/formSubmissionTime/format',
                    keyword: 'format',
                    params: { format: 'date-time' },
                    message: 'must match format "' + 'date-time' + '"',
                    schema: 'date-time',
                    parentSchema:
                      schema38.properties.accreditations.items.properties
                        .formSubmissionTime,
                    data: data160
                  }
                  if (vErrors === null) {
                    vErrors = [err273]
                  } else {
                    vErrors.push(err273)
                  }
                  errors++
                }
              } else {
                var err274 = {
                  instancePath:
                    instancePath +
                    '/accreditations/' +
                    i16 +
                    '/formSubmissionTime',
                  schemaPath:
                    '#/properties/accreditations/items/properties/formSubmissionTime/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .formSubmissionTime.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .formSubmissionTime,
                  data: data160
                }
                if (vErrors === null) {
                  vErrors = [err274]
                } else {
                  vErrors.push(err274)
                }
                errors++
              }
            }
            if (data151.submittedToRegulator !== undefined) {
              var data161 = data151.submittedToRegulator
              if (typeof data161 !== 'string') {
                var err275 = {
                  instancePath:
                    instancePath +
                    '/accreditations/' +
                    i16 +
                    '/submittedToRegulator',
                  schemaPath:
                    '#/properties/accreditations/items/properties/submittedToRegulator/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .submittedToRegulator.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .submittedToRegulator,
                  data: data161
                }
                if (vErrors === null) {
                  vErrors = [err275]
                } else {
                  vErrors.push(err275)
                }
                errors++
              }
              if (
                !(
                  data161 === 'ea' ||
                  data161 === 'nrw' ||
                  data161 === 'sepa' ||
                  data161 === 'niea'
                )
              ) {
                var err276 = {
                  instancePath:
                    instancePath +
                    '/accreditations/' +
                    i16 +
                    '/submittedToRegulator',
                  schemaPath:
                    '#/properties/accreditations/items/properties/submittedToRegulator/enum',
                  keyword: 'enum',
                  params: {
                    allowedValues:
                      schema38.properties.accreditations.items.properties
                        .submittedToRegulator.enum
                  },
                  message: 'must be equal to one of the allowed values',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .submittedToRegulator.enum,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .submittedToRegulator,
                  data: data161
                }
                if (vErrors === null) {
                  vErrors = [err276]
                } else {
                  vErrors.push(err276)
                }
                errors++
              }
            }
            if (data151.orgName !== undefined) {
              var data162 = data151.orgName
              if (typeof data162 !== 'string') {
                var err277 = {
                  instancePath:
                    instancePath + '/accreditations/' + i16 + '/orgName',
                  schemaPath:
                    '#/properties/accreditations/items/properties/orgName/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.accreditations.items.properties.orgName
                      .type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties.orgName,
                  data: data162
                }
                if (vErrors === null) {
                  vErrors = [err277]
                } else {
                  vErrors.push(err277)
                }
                errors++
              }
            }
            if (data151.site !== undefined) {
              var data163 = data151.site
              if (
                data163 &&
                typeof data163 == 'object' &&
                !Array.isArray(data163)
              ) {
                if (data163.address === undefined) {
                  var err278 = {
                    instancePath:
                      instancePath + '/accreditations/' + i16 + '/site',
                    schemaPath:
                      '#/properties/accreditations/items/properties/site/required',
                    keyword: 'required',
                    params: { missingProperty: 'address' },
                    message: "must have required property '" + 'address' + "'",
                    schema:
                      schema38.properties.accreditations.items.properties.site
                        .required,
                    parentSchema:
                      schema38.properties.accreditations.items.properties.site,
                    data: data163
                  }
                  if (vErrors === null) {
                    vErrors = [err278]
                  } else {
                    vErrors.push(err278)
                  }
                  errors++
                }
                for (var key27 in data163) {
                  if (
                    !(
                      key27 === 'address' ||
                      key27 === 'gridReference' ||
                      key27 === 'siteCapacity'
                    )
                  ) {
                    var err279 = {
                      instancePath:
                        instancePath + '/accreditations/' + i16 + '/site',
                      schemaPath:
                        '#/properties/accreditations/items/properties/site/additionalProperties',
                      keyword: 'additionalProperties',
                      params: { additionalProperty: key27 },
                      message: 'must NOT have additional properties',
                      schema: false,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .site,
                      data: data163
                    }
                    if (vErrors === null) {
                      vErrors = [err279]
                    } else {
                      vErrors.push(err279)
                    }
                    errors++
                  }
                }
                if (data163.address !== undefined) {
                  var data164 = data163.address
                  if (
                    data164 &&
                    typeof data164 == 'object' &&
                    !Array.isArray(data164)
                  ) {
                    for (var key28 in data164) {
                      if (
                        !func4.call(
                          schema38.properties.accreditations.items.properties
                            .site.properties.address.properties,
                          key28
                        )
                      ) {
                        var err280 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/site/address',
                          schemaPath:
                            '#/properties/accreditations/items/properties/site/properties/address/additionalProperties',
                          keyword: 'additionalProperties',
                          params: { additionalProperty: key28 },
                          message: 'must NOT have additional properties',
                          schema: false,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address,
                          data: data164
                        }
                        if (vErrors === null) {
                          vErrors = [err280]
                        } else {
                          vErrors.push(err280)
                        }
                        errors++
                      }
                    }
                    if (data164.line1 !== undefined) {
                      var data165 = data164.line1
                      if (typeof data165 !== 'string') {
                        var err281 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/site/address/line1',
                          schemaPath:
                            '#/properties/accreditations/items/properties/site/properties/address/properties/line1/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.line1.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.line1,
                          data: data165
                        }
                        if (vErrors === null) {
                          vErrors = [err281]
                        } else {
                          vErrors.push(err281)
                        }
                        errors++
                      }
                    }
                    if (data164.line2 !== undefined) {
                      var data166 = data164.line2
                      if (typeof data166 !== 'string') {
                        var err282 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/site/address/line2',
                          schemaPath:
                            '#/properties/accreditations/items/properties/site/properties/address/properties/line2/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.line2.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.line2,
                          data: data166
                        }
                        if (vErrors === null) {
                          vErrors = [err282]
                        } else {
                          vErrors.push(err282)
                        }
                        errors++
                      }
                    }
                    if (data164.town !== undefined) {
                      var data167 = data164.town
                      if (typeof data167 !== 'string') {
                        var err283 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/site/address/town',
                          schemaPath:
                            '#/properties/accreditations/items/properties/site/properties/address/properties/town/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.town.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.town,
                          data: data167
                        }
                        if (vErrors === null) {
                          vErrors = [err283]
                        } else {
                          vErrors.push(err283)
                        }
                        errors++
                      }
                    }
                    if (data164.county !== undefined) {
                      var data168 = data164.county
                      if (typeof data168 !== 'string') {
                        var err284 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/site/address/county',
                          schemaPath:
                            '#/properties/accreditations/items/properties/site/properties/address/properties/county/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.county.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.county,
                          data: data168
                        }
                        if (vErrors === null) {
                          vErrors = [err284]
                        } else {
                          vErrors.push(err284)
                        }
                        errors++
                      }
                    }
                    if (data164.country !== undefined) {
                      var data169 = data164.country
                      if (typeof data169 !== 'string') {
                        var err285 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/site/address/country',
                          schemaPath:
                            '#/properties/accreditations/items/properties/site/properties/address/properties/country/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.country.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.country,
                          data: data169
                        }
                        if (vErrors === null) {
                          vErrors = [err285]
                        } else {
                          vErrors.push(err285)
                        }
                        errors++
                      }
                    }
                    if (data164.postcode !== undefined) {
                      var data170 = data164.postcode
                      if (typeof data170 !== 'string') {
                        var err286 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/site/address/postcode',
                          schemaPath:
                            '#/properties/accreditations/items/properties/site/properties/address/properties/postcode/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.postcode.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.postcode,
                          data: data170
                        }
                        if (vErrors === null) {
                          vErrors = [err286]
                        } else {
                          vErrors.push(err286)
                        }
                        errors++
                      }
                    }
                    if (data164.region !== undefined) {
                      var data171 = data164.region
                      if (typeof data171 !== 'string') {
                        var err287 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/site/address/region',
                          schemaPath:
                            '#/properties/accreditations/items/properties/site/properties/address/properties/region/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.region.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.region,
                          data: data171
                        }
                        if (vErrors === null) {
                          vErrors = [err287]
                        } else {
                          vErrors.push(err287)
                        }
                        errors++
                      }
                    }
                    if (data164.fullAddress !== undefined) {
                      var data172 = data164.fullAddress
                      if (typeof data172 !== 'string') {
                        var err288 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/site/address/fullAddress',
                          schemaPath:
                            '#/properties/accreditations/items/properties/site/properties/address/properties/fullAddress/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.fullAddress
                              .type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.fullAddress,
                          data: data172
                        }
                        if (vErrors === null) {
                          vErrors = [err288]
                        } else {
                          vErrors.push(err288)
                        }
                        errors++
                      }
                    }
                    if (data164.line2ToCounty !== undefined) {
                      var data173 = data164.line2ToCounty
                      if (typeof data173 !== 'string') {
                        var err289 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/site/address/line2ToCounty',
                          schemaPath:
                            '#/properties/accreditations/items/properties/site/properties/address/properties/line2ToCounty/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.line2ToCounty
                              .type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.address.properties.line2ToCounty,
                          data: data173
                        }
                        if (vErrors === null) {
                          vErrors = [err289]
                        } else {
                          vErrors.push(err289)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err290 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/site/address',
                      schemaPath:
                        '#/properties/accreditations/items/properties/site/properties/address/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                      schema:
                        schema38.properties.accreditations.items.properties.site
                          .properties.address.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties.site
                          .properties.address,
                      data: data164
                    }
                    if (vErrors === null) {
                      vErrors = [err290]
                    } else {
                      vErrors.push(err290)
                    }
                    errors++
                  }
                }
                if (data163.gridReference !== undefined) {
                  var data174 = data163.gridReference
                  if (typeof data174 !== 'string') {
                    var err291 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/site/gridReference',
                      schemaPath:
                        '#/properties/accreditations/items/properties/site/properties/gridReference/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties.site
                          .properties.gridReference.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties.site
                          .properties.gridReference,
                      data: data174
                    }
                    if (vErrors === null) {
                      vErrors = [err291]
                    } else {
                      vErrors.push(err291)
                    }
                    errors++
                  }
                }
                if (data163.siteCapacity !== undefined) {
                  var data175 = data163.siteCapacity
                  if (Array.isArray(data175)) {
                    var len18 = data175.length
                    for (var i18 = 0; i18 < len18; i18++) {
                      var data176 = data175[i18]
                      if (
                        data176 &&
                        typeof data176 == 'object' &&
                        !Array.isArray(data176)
                      ) {
                        if (data176.material === undefined) {
                          var err292 = {
                            instancePath:
                              instancePath +
                              '/accreditations/' +
                              i16 +
                              '/site/siteCapacity/' +
                              i18,
                            schemaPath:
                              '#/properties/accreditations/items/properties/site/properties/siteCapacity/items/required',
                            keyword: 'required',
                            params: { missingProperty: 'material' },
                            message:
                              "must have required property '" +
                              'material' +
                              "'",
                            schema:
                              schema38.properties.accreditations.items
                                .properties.site.properties.siteCapacity.items
                                .required,
                            parentSchema:
                              schema38.properties.accreditations.items
                                .properties.site.properties.siteCapacity.items,
                            data: data176
                          }
                          if (vErrors === null) {
                            vErrors = [err292]
                          } else {
                            vErrors.push(err292)
                          }
                          errors++
                        }
                        for (var key29 in data176) {
                          if (
                            !(
                              key29 === 'material' ||
                              key29 === 'siteCapacityWeight' ||
                              key29 === 'siteCapacityTimescale'
                            )
                          ) {
                            var err293 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/site/siteCapacity/' +
                                i18,
                              schemaPath:
                                '#/properties/accreditations/items/properties/site/properties/siteCapacity/items/additionalProperties',
                              keyword: 'additionalProperties',
                              params: { additionalProperty: key29 },
                              message: 'must NOT have additional properties',
                              schema: false,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.site.properties.siteCapacity
                                  .items,
                              data: data176
                            }
                            if (vErrors === null) {
                              vErrors = [err293]
                            } else {
                              vErrors.push(err293)
                            }
                            errors++
                          }
                        }
                        if (data176.material !== undefined) {
                          var data177 = data176.material
                          if (typeof data177 !== 'string') {
                            var err294 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/site/siteCapacity/' +
                                i18 +
                                '/material',
                              schemaPath:
                                '#/properties/accreditations/items/properties/site/properties/siteCapacity/items/properties/material/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.material.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.material,
                              data: data177
                            }
                            if (vErrors === null) {
                              vErrors = [err294]
                            } else {
                              vErrors.push(err294)
                            }
                            errors++
                          }
                          if (
                            !(
                              data177 === 'aluminium' ||
                              data177 === 'fibre' ||
                              data177 === 'glass' ||
                              data177 === 'paper' ||
                              data177 === 'plastic' ||
                              data177 === 'steel' ||
                              data177 === 'wood'
                            )
                          ) {
                            var err295 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/site/siteCapacity/' +
                                i18 +
                                '/material',
                              schemaPath:
                                '#/properties/accreditations/items/properties/site/properties/siteCapacity/items/properties/material/enum',
                              keyword: 'enum',
                              params: {
                                allowedValues:
                                  schema38.properties.accreditations.items
                                    .properties.site.properties.siteCapacity
                                    .items.properties.material.enum
                              },
                              message:
                                'must be equal to one of the allowed values',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.material.enum,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.material,
                              data: data177
                            }
                            if (vErrors === null) {
                              vErrors = [err295]
                            } else {
                              vErrors.push(err295)
                            }
                            errors++
                          }
                        }
                        if (data176.siteCapacityWeight !== undefined) {
                          var data178 = data176.siteCapacityWeight
                          if (typeof data178 !== 'string') {
                            var err296 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/site/siteCapacity/' +
                                i18 +
                                '/siteCapacityWeight',
                              schemaPath:
                                '#/properties/accreditations/items/properties/site/properties/siteCapacity/items/properties/siteCapacityWeight/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.siteCapacityWeight.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.siteCapacityWeight,
                              data: data178
                            }
                            if (vErrors === null) {
                              vErrors = [err296]
                            } else {
                              vErrors.push(err296)
                            }
                            errors++
                          }
                        }
                        if (data176.siteCapacityTimescale !== undefined) {
                          var data179 = data176.siteCapacityTimescale
                          if (typeof data179 !== 'string') {
                            var err297 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/site/siteCapacity/' +
                                i18 +
                                '/siteCapacityTimescale',
                              schemaPath:
                                '#/properties/accreditations/items/properties/site/properties/siteCapacity/items/properties/siteCapacityTimescale/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.siteCapacityTimescale.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.siteCapacityTimescale,
                              data: data179
                            }
                            if (vErrors === null) {
                              vErrors = [err297]
                            } else {
                              vErrors.push(err297)
                            }
                            errors++
                          }
                          if (
                            !(
                              data179 === 'weekly' ||
                              data179 === 'monthly' ||
                              data179 === 'yearly'
                            )
                          ) {
                            var err298 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/site/siteCapacity/' +
                                i18 +
                                '/siteCapacityTimescale',
                              schemaPath:
                                '#/properties/accreditations/items/properties/site/properties/siteCapacity/items/properties/siteCapacityTimescale/enum',
                              keyword: 'enum',
                              params: {
                                allowedValues:
                                  schema38.properties.accreditations.items
                                    .properties.site.properties.siteCapacity
                                    .items.properties.siteCapacityTimescale.enum
                              },
                              message:
                                'must be equal to one of the allowed values',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.siteCapacityTimescale.enum,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.site.properties.siteCapacity.items
                                  .properties.siteCapacityTimescale,
                              data: data179
                            }
                            if (vErrors === null) {
                              vErrors = [err298]
                            } else {
                              vErrors.push(err298)
                            }
                            errors++
                          }
                        }
                      } else {
                        var err299 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/site/siteCapacity/' +
                            i18,
                          schemaPath:
                            '#/properties/accreditations/items/properties/site/properties/siteCapacity/items/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.siteCapacity.items.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .site.properties.siteCapacity.items,
                          data: data176
                        }
                        if (vErrors === null) {
                          vErrors = [err299]
                        } else {
                          vErrors.push(err299)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err300 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/site/siteCapacity',
                      schemaPath:
                        '#/properties/accreditations/items/properties/site/properties/siteCapacity/type',
                      keyword: 'type',
                      params: { type: 'array' },
                      message: 'must be array',
                      schema:
                        schema38.properties.accreditations.items.properties.site
                          .properties.siteCapacity.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties.site
                          .properties.siteCapacity,
                      data: data175
                    }
                    if (vErrors === null) {
                      vErrors = [err300]
                    } else {
                      vErrors.push(err300)
                    }
                    errors++
                  }
                }
              } else {
                var err301 = {
                  instancePath:
                    instancePath + '/accreditations/' + i16 + '/site',
                  schemaPath:
                    '#/properties/accreditations/items/properties/site/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                  schema:
                    schema38.properties.accreditations.items.properties.site
                      .type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties.site,
                  data: data163
                }
                if (vErrors === null) {
                  vErrors = [err301]
                } else {
                  vErrors.push(err301)
                }
                errors++
              }
            }
            if (data151.material !== undefined) {
              var data180 = data151.material
              if (typeof data180 !== 'string') {
                var err302 = {
                  instancePath:
                    instancePath + '/accreditations/' + i16 + '/material',
                  schemaPath:
                    '#/properties/accreditations/items/properties/material/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.accreditations.items.properties.material
                      .type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .material,
                  data: data180
                }
                if (vErrors === null) {
                  vErrors = [err302]
                } else {
                  vErrors.push(err302)
                }
                errors++
              }
              if (
                !(
                  data180 === 'aluminium' ||
                  data180 === 'fibre' ||
                  data180 === 'glass' ||
                  data180 === 'paper' ||
                  data180 === 'plastic' ||
                  data180 === 'steel' ||
                  data180 === 'wood'
                )
              ) {
                var err303 = {
                  instancePath:
                    instancePath + '/accreditations/' + i16 + '/material',
                  schemaPath:
                    '#/properties/accreditations/items/properties/material/enum',
                  keyword: 'enum',
                  params: {
                    allowedValues:
                      schema38.properties.accreditations.items.properties
                        .material.enum
                  },
                  message: 'must be equal to one of the allowed values',
                  schema:
                    schema38.properties.accreditations.items.properties.material
                      .enum,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .material,
                  data: data180
                }
                if (vErrors === null) {
                  vErrors = [err303]
                } else {
                  vErrors.push(err303)
                }
                errors++
              }
            }
            if (data151.wasteProcessingType !== undefined) {
              var data181 = data151.wasteProcessingType
              if (typeof data181 !== 'string') {
                var err304 = {
                  instancePath:
                    instancePath +
                    '/accreditations/' +
                    i16 +
                    '/wasteProcessingType',
                  schemaPath:
                    '#/properties/accreditations/items/properties/wasteProcessingType/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .wasteProcessingType.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .wasteProcessingType,
                  data: data181
                }
                if (vErrors === null) {
                  vErrors = [err304]
                } else {
                  vErrors.push(err304)
                }
                errors++
              }
              if (!(data181 === 'reprocessor' || data181 === 'exporter')) {
                var err305 = {
                  instancePath:
                    instancePath +
                    '/accreditations/' +
                    i16 +
                    '/wasteProcessingType',
                  schemaPath:
                    '#/properties/accreditations/items/properties/wasteProcessingType/enum',
                  keyword: 'enum',
                  params: {
                    allowedValues:
                      schema38.properties.accreditations.items.properties
                        .wasteProcessingType.enum
                  },
                  message: 'must be equal to one of the allowed values',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .wasteProcessingType.enum,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .wasteProcessingType,
                  data: data181
                }
                if (vErrors === null) {
                  vErrors = [err305]
                } else {
                  vErrors.push(err305)
                }
                errors++
              }
            }
            if (data151.prnIssuance !== undefined) {
              var data182 = data151.prnIssuance
              if (
                data182 &&
                typeof data182 == 'object' &&
                !Array.isArray(data182)
              ) {
                for (var key30 in data182) {
                  if (
                    !(
                      key30 === 'tonnageBand' ||
                      key30 === 'signatories' ||
                      key30 === 'prnIncomeBusinessPlan'
                    )
                  ) {
                    var err306 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/prnIssuance',
                      schemaPath:
                        '#/properties/accreditations/items/properties/prnIssuance/additionalProperties',
                      keyword: 'additionalProperties',
                      params: { additionalProperty: key30 },
                      message: 'must NOT have additional properties',
                      schema: false,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .prnIssuance,
                      data: data182
                    }
                    if (vErrors === null) {
                      vErrors = [err306]
                    } else {
                      vErrors.push(err306)
                    }
                    errors++
                  }
                }
                if (data182.tonnageBand !== undefined) {
                  var data183 = data182.tonnageBand
                  if (typeof data183 !== 'string') {
                    var err307 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/prnIssuance/tonnageBand',
                      schemaPath:
                        '#/properties/accreditations/items/properties/prnIssuance/properties/tonnageBand/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .prnIssuance.properties.tonnageBand.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .prnIssuance.properties.tonnageBand,
                      data: data183
                    }
                    if (vErrors === null) {
                      vErrors = [err307]
                    } else {
                      vErrors.push(err307)
                    }
                    errors++
                  }
                  if (
                    !(
                      data183 === 'up_to_500' ||
                      data183 === 'up_to_5000' ||
                      data183 === 'up_to_10000' ||
                      data183 === 'over_10000'
                    )
                  ) {
                    var err308 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/prnIssuance/tonnageBand',
                      schemaPath:
                        '#/properties/accreditations/items/properties/prnIssuance/properties/tonnageBand/enum',
                      keyword: 'enum',
                      params: {
                        allowedValues:
                          schema38.properties.accreditations.items.properties
                            .prnIssuance.properties.tonnageBand.enum
                      },
                      message: 'must be equal to one of the allowed values',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .prnIssuance.properties.tonnageBand.enum,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .prnIssuance.properties.tonnageBand,
                      data: data183
                    }
                    if (vErrors === null) {
                      vErrors = [err308]
                    } else {
                      vErrors.push(err308)
                    }
                    errors++
                  }
                }
                if (data182.signatories !== undefined) {
                  var data184 = data182.signatories
                  if (Array.isArray(data184)) {
                    var len19 = data184.length
                    for (var i19 = 0; i19 < len19; i19++) {
                      var data185 = data184[i19]
                      var _errs416 = errors
                      var valid75 = false
                      var _errs417 = errors
                      if (
                        data185 &&
                        typeof data185 == 'object' &&
                        !Array.isArray(data185)
                      ) {
                        if (data185.role === undefined) {
                          var err309 = {
                            instancePath:
                              instancePath +
                              '/accreditations/' +
                              i16 +
                              '/prnIssuance/signatories/' +
                              i19,
                            schemaPath:
                              '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/anyOf/0/required',
                            keyword: 'required',
                            params: { missingProperty: 'role' },
                            message:
                              "must have required property '" + 'role' + "'",
                            schema:
                              schema38.properties.accreditations.items
                                .properties.prnIssuance.properties.signatories
                                .items.anyOf[0].required,
                            parentSchema:
                              schema38.properties.accreditations.items
                                .properties.prnIssuance.properties.signatories
                                .items.anyOf[0],
                            data: data185
                          }
                          if (vErrors === null) {
                            vErrors = [err309]
                          } else {
                            vErrors.push(err309)
                          }
                          errors++
                        }
                      }
                      var _valid4 = _errs417 === errors
                      valid75 = valid75 || _valid4
                      if (!valid75) {
                        var _errs418 = errors
                        if (
                          data185 &&
                          typeof data185 == 'object' &&
                          !Array.isArray(data185)
                        ) {
                          if (data185.title === undefined) {
                            var err310 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/prnIssuance/signatories/' +
                                i19,
                              schemaPath:
                                '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/anyOf/1/required',
                              keyword: 'required',
                              params: { missingProperty: 'title' },
                              message:
                                "must have required property '" + 'title' + "'",
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items.anyOf[1].required,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items.anyOf[1],
                              data: data185
                            }
                            if (vErrors === null) {
                              vErrors = [err310]
                            } else {
                              vErrors.push(err310)
                            }
                            errors++
                          }
                        }
                        var _valid4 = _errs418 === errors
                        valid75 = valid75 || _valid4
                      }
                      if (!valid75) {
                        var err311 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/prnIssuance/signatories/' +
                            i19,
                          schemaPath:
                            '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/anyOf',
                          keyword: 'anyOf',
                          params: {},
                          message: 'must match a schema in anyOf',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .prnIssuance.properties.signatories.items.anyOf,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .prnIssuance.properties.signatories.items,
                          data: data185
                        }
                        if (vErrors === null) {
                          vErrors = [err311]
                        } else {
                          vErrors.push(err311)
                        }
                        errors++
                      } else {
                        errors = _errs416
                        if (vErrors !== null) {
                          if (_errs416) {
                            vErrors.length = _errs416
                          } else {
                            vErrors = null
                          }
                        }
                      }
                      if (
                        data185 &&
                        typeof data185 == 'object' &&
                        !Array.isArray(data185)
                      ) {
                        if (data185.fullName === undefined) {
                          var err312 = {
                            instancePath:
                              instancePath +
                              '/accreditations/' +
                              i16 +
                              '/prnIssuance/signatories/' +
                              i19,
                            schemaPath:
                              '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/required',
                            keyword: 'required',
                            params: { missingProperty: 'fullName' },
                            message:
                              "must have required property '" +
                              'fullName' +
                              "'",
                            schema:
                              schema38.properties.accreditations.items
                                .properties.prnIssuance.properties.signatories
                                .items.required,
                            parentSchema:
                              schema38.properties.accreditations.items
                                .properties.prnIssuance.properties.signatories
                                .items,
                            data: data185
                          }
                          if (vErrors === null) {
                            vErrors = [err312]
                          } else {
                            vErrors.push(err312)
                          }
                          errors++
                        }
                        if (data185.email === undefined) {
                          var err313 = {
                            instancePath:
                              instancePath +
                              '/accreditations/' +
                              i16 +
                              '/prnIssuance/signatories/' +
                              i19,
                            schemaPath:
                              '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/required',
                            keyword: 'required',
                            params: { missingProperty: 'email' },
                            message:
                              "must have required property '" + 'email' + "'",
                            schema:
                              schema38.properties.accreditations.items
                                .properties.prnIssuance.properties.signatories
                                .items.required,
                            parentSchema:
                              schema38.properties.accreditations.items
                                .properties.prnIssuance.properties.signatories
                                .items,
                            data: data185
                          }
                          if (vErrors === null) {
                            vErrors = [err313]
                          } else {
                            vErrors.push(err313)
                          }
                          errors++
                        }
                        if (data185.phone === undefined) {
                          var err314 = {
                            instancePath:
                              instancePath +
                              '/accreditations/' +
                              i16 +
                              '/prnIssuance/signatories/' +
                              i19,
                            schemaPath:
                              '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/required',
                            keyword: 'required',
                            params: { missingProperty: 'phone' },
                            message:
                              "must have required property '" + 'phone' + "'",
                            schema:
                              schema38.properties.accreditations.items
                                .properties.prnIssuance.properties.signatories
                                .items.required,
                            parentSchema:
                              schema38.properties.accreditations.items
                                .properties.prnIssuance.properties.signatories
                                .items,
                            data: data185
                          }
                          if (vErrors === null) {
                            vErrors = [err314]
                          } else {
                            vErrors.push(err314)
                          }
                          errors++
                        }
                        for (var key31 in data185) {
                          if (
                            !(
                              key31 === 'fullName' ||
                              key31 === 'email' ||
                              key31 === 'phone' ||
                              key31 === 'role' ||
                              key31 === 'title'
                            )
                          ) {
                            var err315 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/prnIssuance/signatories/' +
                                i19,
                              schemaPath:
                                '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/additionalProperties',
                              keyword: 'additionalProperties',
                              params: { additionalProperty: key31 },
                              message: 'must NOT have additional properties',
                              schema: false,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items,
                              data: data185
                            }
                            if (vErrors === null) {
                              vErrors = [err315]
                            } else {
                              vErrors.push(err315)
                            }
                            errors++
                          }
                        }
                        if (data185.fullName !== undefined) {
                          var data186 = data185.fullName
                          if (typeof data186 !== 'string') {
                            var err316 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/prnIssuance/signatories/' +
                                i19 +
                                '/fullName',
                              schemaPath:
                                '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/properties/fullName/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items.properties.fullName.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items.properties.fullName,
                              data: data186
                            }
                            if (vErrors === null) {
                              vErrors = [err316]
                            } else {
                              vErrors.push(err316)
                            }
                            errors++
                          }
                        }
                        if (data185.email !== undefined) {
                          var data187 = data185.email
                          if (typeof data187 === 'string') {
                            if (!formats0.test(data187)) {
                              var err317 = {
                                instancePath:
                                  instancePath +
                                  '/accreditations/' +
                                  i16 +
                                  '/prnIssuance/signatories/' +
                                  i19 +
                                  '/email',
                                schemaPath:
                                  '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/properties/email/format',
                                keyword: 'format',
                                params: { format: 'email' },
                                message: 'must match format "' + 'email' + '"',
                                schema: 'email',
                                parentSchema:
                                  schema38.properties.accreditations.items
                                    .properties.prnIssuance.properties
                                    .signatories.items.properties.email,
                                data: data187
                              }
                              if (vErrors === null) {
                                vErrors = [err317]
                              } else {
                                vErrors.push(err317)
                              }
                              errors++
                            }
                          } else {
                            var err318 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/prnIssuance/signatories/' +
                                i19 +
                                '/email',
                              schemaPath:
                                '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/properties/email/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items.properties.email.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items.properties.email,
                              data: data187
                            }
                            if (vErrors === null) {
                              vErrors = [err318]
                            } else {
                              vErrors.push(err318)
                            }
                            errors++
                          }
                        }
                        if (data185.phone !== undefined) {
                          var data188 = data185.phone
                          if (typeof data188 !== 'string') {
                            var err319 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/prnIssuance/signatories/' +
                                i19 +
                                '/phone',
                              schemaPath:
                                '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/properties/phone/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items.properties.phone.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items.properties.phone,
                              data: data188
                            }
                            if (vErrors === null) {
                              vErrors = [err319]
                            } else {
                              vErrors.push(err319)
                            }
                            errors++
                          }
                        }
                        if (data185.role !== undefined) {
                          var data189 = data185.role
                          if (typeof data189 !== 'string') {
                            var err320 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/prnIssuance/signatories/' +
                                i19 +
                                '/role',
                              schemaPath:
                                '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/properties/role/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items.properties.role.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items.properties.role,
                              data: data189
                            }
                            if (vErrors === null) {
                              vErrors = [err320]
                            } else {
                              vErrors.push(err320)
                            }
                            errors++
                          }
                        }
                        if (data185.title !== undefined) {
                          var data190 = data185.title
                          if (typeof data190 !== 'string') {
                            var err321 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/prnIssuance/signatories/' +
                                i19 +
                                '/title',
                              schemaPath:
                                '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/properties/title/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items.properties.title.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties.signatories
                                  .items.properties.title,
                              data: data190
                            }
                            if (vErrors === null) {
                              vErrors = [err321]
                            } else {
                              vErrors.push(err321)
                            }
                            errors++
                          }
                        }
                      } else {
                        var err322 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/prnIssuance/signatories/' +
                            i19,
                          schemaPath:
                            '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/items/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .prnIssuance.properties.signatories.items.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .prnIssuance.properties.signatories.items,
                          data: data185
                        }
                        if (vErrors === null) {
                          vErrors = [err322]
                        } else {
                          vErrors.push(err322)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err323 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/prnIssuance/signatories',
                      schemaPath:
                        '#/properties/accreditations/items/properties/prnIssuance/properties/signatories/type',
                      keyword: 'type',
                      params: { type: 'array' },
                      message: 'must be array',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .prnIssuance.properties.signatories.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .prnIssuance.properties.signatories,
                      data: data184
                    }
                    if (vErrors === null) {
                      vErrors = [err323]
                    } else {
                      vErrors.push(err323)
                    }
                    errors++
                  }
                }
                if (data182.prnIncomeBusinessPlan !== undefined) {
                  var data191 = data182.prnIncomeBusinessPlan
                  if (Array.isArray(data191)) {
                    var len20 = data191.length
                    for (var i20 = 0; i20 < len20; i20++) {
                      var data192 = data191[i20]
                      if (
                        data192 &&
                        typeof data192 == 'object' &&
                        !Array.isArray(data192)
                      ) {
                        for (var key32 in data192) {
                          if (
                            !(
                              key32 === 'percentIncomeSpent' ||
                              key32 === 'usageDescription' ||
                              key32 === 'detailedExplanation'
                            )
                          ) {
                            var err324 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/prnIssuance/prnIncomeBusinessPlan/' +
                                i20,
                              schemaPath:
                                '#/properties/accreditations/items/properties/prnIssuance/properties/prnIncomeBusinessPlan/items/additionalProperties',
                              keyword: 'additionalProperties',
                              params: { additionalProperty: key32 },
                              message: 'must NOT have additional properties',
                              schema: false,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties
                                  .prnIncomeBusinessPlan.items,
                              data: data192
                            }
                            if (vErrors === null) {
                              vErrors = [err324]
                            } else {
                              vErrors.push(err324)
                            }
                            errors++
                          }
                        }
                        if (data192.percentIncomeSpent !== undefined) {
                          var data193 = data192.percentIncomeSpent
                          if (
                            !(typeof data193 == 'number' && isFinite(data193))
                          ) {
                            var err325 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/prnIssuance/prnIncomeBusinessPlan/' +
                                i20 +
                                '/percentIncomeSpent',
                              schemaPath:
                                '#/properties/accreditations/items/properties/prnIssuance/properties/prnIncomeBusinessPlan/items/properties/percentIncomeSpent/type',
                              keyword: 'type',
                              params: { type: 'number' },
                              message: 'must be number',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties
                                  .prnIncomeBusinessPlan.items.properties
                                  .percentIncomeSpent.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties
                                  .prnIncomeBusinessPlan.items.properties
                                  .percentIncomeSpent,
                              data: data193
                            }
                            if (vErrors === null) {
                              vErrors = [err325]
                            } else {
                              vErrors.push(err325)
                            }
                            errors++
                          }
                        }
                        if (data192.usageDescription !== undefined) {
                          var data194 = data192.usageDescription
                          if (typeof data194 !== 'string') {
                            var err326 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/prnIssuance/prnIncomeBusinessPlan/' +
                                i20 +
                                '/usageDescription',
                              schemaPath:
                                '#/properties/accreditations/items/properties/prnIssuance/properties/prnIncomeBusinessPlan/items/properties/usageDescription/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties
                                  .prnIncomeBusinessPlan.items.properties
                                  .usageDescription.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties
                                  .prnIncomeBusinessPlan.items.properties
                                  .usageDescription,
                              data: data194
                            }
                            if (vErrors === null) {
                              vErrors = [err326]
                            } else {
                              vErrors.push(err326)
                            }
                            errors++
                          }
                        }
                        if (data192.detailedExplanation !== undefined) {
                          var data195 = data192.detailedExplanation
                          if (typeof data195 !== 'string') {
                            var err327 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/prnIssuance/prnIncomeBusinessPlan/' +
                                i20 +
                                '/detailedExplanation',
                              schemaPath:
                                '#/properties/accreditations/items/properties/prnIssuance/properties/prnIncomeBusinessPlan/items/properties/detailedExplanation/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties
                                  .prnIncomeBusinessPlan.items.properties
                                  .detailedExplanation.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.prnIssuance.properties
                                  .prnIncomeBusinessPlan.items.properties
                                  .detailedExplanation,
                              data: data195
                            }
                            if (vErrors === null) {
                              vErrors = [err327]
                            } else {
                              vErrors.push(err327)
                            }
                            errors++
                          }
                        }
                      } else {
                        var err328 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/prnIssuance/prnIncomeBusinessPlan/' +
                            i20,
                          schemaPath:
                            '#/properties/accreditations/items/properties/prnIssuance/properties/prnIncomeBusinessPlan/items/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .prnIssuance.properties.prnIncomeBusinessPlan
                              .items.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .prnIssuance.properties.prnIncomeBusinessPlan
                              .items,
                          data: data192
                        }
                        if (vErrors === null) {
                          vErrors = [err328]
                        } else {
                          vErrors.push(err328)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err329 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/prnIssuance/prnIncomeBusinessPlan',
                      schemaPath:
                        '#/properties/accreditations/items/properties/prnIssuance/properties/prnIncomeBusinessPlan/type',
                      keyword: 'type',
                      params: { type: 'array' },
                      message: 'must be array',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .prnIssuance.properties.prnIncomeBusinessPlan.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .prnIssuance.properties.prnIncomeBusinessPlan,
                      data: data191
                    }
                    if (vErrors === null) {
                      vErrors = [err329]
                    } else {
                      vErrors.push(err329)
                    }
                    errors++
                  }
                }
              } else {
                var err330 = {
                  instancePath:
                    instancePath + '/accreditations/' + i16 + '/prnIssuance',
                  schemaPath:
                    '#/properties/accreditations/items/properties/prnIssuance/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .prnIssuance.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .prnIssuance,
                  data: data182
                }
                if (vErrors === null) {
                  vErrors = [err330]
                } else {
                  vErrors.push(err330)
                }
                errors++
              }
            }
            if (data151.pernIssuance !== undefined) {
              var data196 = data151.pernIssuance
              if (
                data196 &&
                typeof data196 == 'object' &&
                !Array.isArray(data196)
              ) {
                for (var key33 in data196) {
                  if (
                    !(
                      key33 === 'tonnageBand' ||
                      key33 === 'signatories' ||
                      key33 === 'pernIncomeBusinessPlan'
                    )
                  ) {
                    var err331 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/pernIssuance',
                      schemaPath:
                        '#/properties/accreditations/items/properties/pernIssuance/additionalProperties',
                      keyword: 'additionalProperties',
                      params: { additionalProperty: key33 },
                      message: 'must NOT have additional properties',
                      schema: false,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .pernIssuance,
                      data: data196
                    }
                    if (vErrors === null) {
                      vErrors = [err331]
                    } else {
                      vErrors.push(err331)
                    }
                    errors++
                  }
                }
                if (data196.tonnageBand !== undefined) {
                  var data197 = data196.tonnageBand
                  if (typeof data197 !== 'string') {
                    var err332 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/pernIssuance/tonnageBand',
                      schemaPath:
                        '#/properties/accreditations/items/properties/pernIssuance/properties/tonnageBand/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .pernIssuance.properties.tonnageBand.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .pernIssuance.properties.tonnageBand,
                      data: data197
                    }
                    if (vErrors === null) {
                      vErrors = [err332]
                    } else {
                      vErrors.push(err332)
                    }
                    errors++
                  }
                  if (
                    !(
                      data197 === 'up_to_500' ||
                      data197 === 'up_to_5000' ||
                      data197 === 'up_to_10000' ||
                      data197 === 'over_10000'
                    )
                  ) {
                    var err333 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/pernIssuance/tonnageBand',
                      schemaPath:
                        '#/properties/accreditations/items/properties/pernIssuance/properties/tonnageBand/enum',
                      keyword: 'enum',
                      params: {
                        allowedValues:
                          schema38.properties.accreditations.items.properties
                            .pernIssuance.properties.tonnageBand.enum
                      },
                      message: 'must be equal to one of the allowed values',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .pernIssuance.properties.tonnageBand.enum,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .pernIssuance.properties.tonnageBand,
                      data: data197
                    }
                    if (vErrors === null) {
                      vErrors = [err333]
                    } else {
                      vErrors.push(err333)
                    }
                    errors++
                  }
                }
                if (data196.signatories !== undefined) {
                  var data198 = data196.signatories
                  if (Array.isArray(data198)) {
                    var len21 = data198.length
                    for (var i21 = 0; i21 < len21; i21++) {
                      var data199 = data198[i21]
                      var _errs450 = errors
                      var valid83 = false
                      var _errs451 = errors
                      if (
                        data199 &&
                        typeof data199 == 'object' &&
                        !Array.isArray(data199)
                      ) {
                        if (data199.role === undefined) {
                          var err334 = {
                            instancePath:
                              instancePath +
                              '/accreditations/' +
                              i16 +
                              '/pernIssuance/signatories/' +
                              i21,
                            schemaPath:
                              '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/anyOf/0/required',
                            keyword: 'required',
                            params: { missingProperty: 'role' },
                            message:
                              "must have required property '" + 'role' + "'",
                            schema:
                              schema38.properties.accreditations.items
                                .properties.pernIssuance.properties.signatories
                                .items.anyOf[0].required,
                            parentSchema:
                              schema38.properties.accreditations.items
                                .properties.pernIssuance.properties.signatories
                                .items.anyOf[0],
                            data: data199
                          }
                          if (vErrors === null) {
                            vErrors = [err334]
                          } else {
                            vErrors.push(err334)
                          }
                          errors++
                        }
                      }
                      var _valid5 = _errs451 === errors
                      valid83 = valid83 || _valid5
                      if (!valid83) {
                        var _errs452 = errors
                        if (
                          data199 &&
                          typeof data199 == 'object' &&
                          !Array.isArray(data199)
                        ) {
                          if (data199.title === undefined) {
                            var err335 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/pernIssuance/signatories/' +
                                i21,
                              schemaPath:
                                '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/anyOf/1/required',
                              keyword: 'required',
                              params: { missingProperty: 'title' },
                              message:
                                "must have required property '" + 'title' + "'",
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items.anyOf[1].required,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items.anyOf[1],
                              data: data199
                            }
                            if (vErrors === null) {
                              vErrors = [err335]
                            } else {
                              vErrors.push(err335)
                            }
                            errors++
                          }
                        }
                        var _valid5 = _errs452 === errors
                        valid83 = valid83 || _valid5
                      }
                      if (!valid83) {
                        var err336 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/pernIssuance/signatories/' +
                            i21,
                          schemaPath:
                            '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/anyOf',
                          keyword: 'anyOf',
                          params: {},
                          message: 'must match a schema in anyOf',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .pernIssuance.properties.signatories.items.anyOf,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .pernIssuance.properties.signatories.items,
                          data: data199
                        }
                        if (vErrors === null) {
                          vErrors = [err336]
                        } else {
                          vErrors.push(err336)
                        }
                        errors++
                      } else {
                        errors = _errs450
                        if (vErrors !== null) {
                          if (_errs450) {
                            vErrors.length = _errs450
                          } else {
                            vErrors = null
                          }
                        }
                      }
                      if (
                        data199 &&
                        typeof data199 == 'object' &&
                        !Array.isArray(data199)
                      ) {
                        if (data199.fullName === undefined) {
                          var err337 = {
                            instancePath:
                              instancePath +
                              '/accreditations/' +
                              i16 +
                              '/pernIssuance/signatories/' +
                              i21,
                            schemaPath:
                              '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/required',
                            keyword: 'required',
                            params: { missingProperty: 'fullName' },
                            message:
                              "must have required property '" +
                              'fullName' +
                              "'",
                            schema:
                              schema38.properties.accreditations.items
                                .properties.pernIssuance.properties.signatories
                                .items.required,
                            parentSchema:
                              schema38.properties.accreditations.items
                                .properties.pernIssuance.properties.signatories
                                .items,
                            data: data199
                          }
                          if (vErrors === null) {
                            vErrors = [err337]
                          } else {
                            vErrors.push(err337)
                          }
                          errors++
                        }
                        if (data199.email === undefined) {
                          var err338 = {
                            instancePath:
                              instancePath +
                              '/accreditations/' +
                              i16 +
                              '/pernIssuance/signatories/' +
                              i21,
                            schemaPath:
                              '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/required',
                            keyword: 'required',
                            params: { missingProperty: 'email' },
                            message:
                              "must have required property '" + 'email' + "'",
                            schema:
                              schema38.properties.accreditations.items
                                .properties.pernIssuance.properties.signatories
                                .items.required,
                            parentSchema:
                              schema38.properties.accreditations.items
                                .properties.pernIssuance.properties.signatories
                                .items,
                            data: data199
                          }
                          if (vErrors === null) {
                            vErrors = [err338]
                          } else {
                            vErrors.push(err338)
                          }
                          errors++
                        }
                        if (data199.phone === undefined) {
                          var err339 = {
                            instancePath:
                              instancePath +
                              '/accreditations/' +
                              i16 +
                              '/pernIssuance/signatories/' +
                              i21,
                            schemaPath:
                              '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/required',
                            keyword: 'required',
                            params: { missingProperty: 'phone' },
                            message:
                              "must have required property '" + 'phone' + "'",
                            schema:
                              schema38.properties.accreditations.items
                                .properties.pernIssuance.properties.signatories
                                .items.required,
                            parentSchema:
                              schema38.properties.accreditations.items
                                .properties.pernIssuance.properties.signatories
                                .items,
                            data: data199
                          }
                          if (vErrors === null) {
                            vErrors = [err339]
                          } else {
                            vErrors.push(err339)
                          }
                          errors++
                        }
                        for (var key34 in data199) {
                          if (
                            !(
                              key34 === 'fullName' ||
                              key34 === 'email' ||
                              key34 === 'phone' ||
                              key34 === 'role' ||
                              key34 === 'title'
                            )
                          ) {
                            var err340 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/pernIssuance/signatories/' +
                                i21,
                              schemaPath:
                                '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/additionalProperties',
                              keyword: 'additionalProperties',
                              params: { additionalProperty: key34 },
                              message: 'must NOT have additional properties',
                              schema: false,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items,
                              data: data199
                            }
                            if (vErrors === null) {
                              vErrors = [err340]
                            } else {
                              vErrors.push(err340)
                            }
                            errors++
                          }
                        }
                        if (data199.fullName !== undefined) {
                          var data200 = data199.fullName
                          if (typeof data200 !== 'string') {
                            var err341 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/pernIssuance/signatories/' +
                                i21 +
                                '/fullName',
                              schemaPath:
                                '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/properties/fullName/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items.properties.fullName.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items.properties.fullName,
                              data: data200
                            }
                            if (vErrors === null) {
                              vErrors = [err341]
                            } else {
                              vErrors.push(err341)
                            }
                            errors++
                          }
                        }
                        if (data199.email !== undefined) {
                          var data201 = data199.email
                          if (typeof data201 === 'string') {
                            if (!formats0.test(data201)) {
                              var err342 = {
                                instancePath:
                                  instancePath +
                                  '/accreditations/' +
                                  i16 +
                                  '/pernIssuance/signatories/' +
                                  i21 +
                                  '/email',
                                schemaPath:
                                  '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/properties/email/format',
                                keyword: 'format',
                                params: { format: 'email' },
                                message: 'must match format "' + 'email' + '"',
                                schema: 'email',
                                parentSchema:
                                  schema38.properties.accreditations.items
                                    .properties.pernIssuance.properties
                                    .signatories.items.properties.email,
                                data: data201
                              }
                              if (vErrors === null) {
                                vErrors = [err342]
                              } else {
                                vErrors.push(err342)
                              }
                              errors++
                            }
                          } else {
                            var err343 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/pernIssuance/signatories/' +
                                i21 +
                                '/email',
                              schemaPath:
                                '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/properties/email/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items.properties.email.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items.properties.email,
                              data: data201
                            }
                            if (vErrors === null) {
                              vErrors = [err343]
                            } else {
                              vErrors.push(err343)
                            }
                            errors++
                          }
                        }
                        if (data199.phone !== undefined) {
                          var data202 = data199.phone
                          if (typeof data202 !== 'string') {
                            var err344 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/pernIssuance/signatories/' +
                                i21 +
                                '/phone',
                              schemaPath:
                                '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/properties/phone/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items.properties.phone.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items.properties.phone,
                              data: data202
                            }
                            if (vErrors === null) {
                              vErrors = [err344]
                            } else {
                              vErrors.push(err344)
                            }
                            errors++
                          }
                        }
                        if (data199.role !== undefined) {
                          var data203 = data199.role
                          if (typeof data203 !== 'string') {
                            var err345 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/pernIssuance/signatories/' +
                                i21 +
                                '/role',
                              schemaPath:
                                '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/properties/role/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items.properties.role.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items.properties.role,
                              data: data203
                            }
                            if (vErrors === null) {
                              vErrors = [err345]
                            } else {
                              vErrors.push(err345)
                            }
                            errors++
                          }
                        }
                        if (data199.title !== undefined) {
                          var data204 = data199.title
                          if (typeof data204 !== 'string') {
                            var err346 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/pernIssuance/signatories/' +
                                i21 +
                                '/title',
                              schemaPath:
                                '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/properties/title/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items.properties.title.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .signatories.items.properties.title,
                              data: data204
                            }
                            if (vErrors === null) {
                              vErrors = [err346]
                            } else {
                              vErrors.push(err346)
                            }
                            errors++
                          }
                        }
                      } else {
                        var err347 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/pernIssuance/signatories/' +
                            i21,
                          schemaPath:
                            '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/items/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .pernIssuance.properties.signatories.items.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .pernIssuance.properties.signatories.items,
                          data: data199
                        }
                        if (vErrors === null) {
                          vErrors = [err347]
                        } else {
                          vErrors.push(err347)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err348 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/pernIssuance/signatories',
                      schemaPath:
                        '#/properties/accreditations/items/properties/pernIssuance/properties/signatories/type',
                      keyword: 'type',
                      params: { type: 'array' },
                      message: 'must be array',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .pernIssuance.properties.signatories.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .pernIssuance.properties.signatories,
                      data: data198
                    }
                    if (vErrors === null) {
                      vErrors = [err348]
                    } else {
                      vErrors.push(err348)
                    }
                    errors++
                  }
                }
                if (data196.pernIncomeBusinessPlan !== undefined) {
                  var data205 = data196.pernIncomeBusinessPlan
                  if (Array.isArray(data205)) {
                    var len22 = data205.length
                    for (var i22 = 0; i22 < len22; i22++) {
                      var data206 = data205[i22]
                      if (
                        data206 &&
                        typeof data206 == 'object' &&
                        !Array.isArray(data206)
                      ) {
                        for (var key35 in data206) {
                          if (
                            !(
                              key35 === 'percentIncomeSpent' ||
                              key35 === 'usageDescription' ||
                              key35 === 'detailedExplanation'
                            )
                          ) {
                            var err349 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/pernIssuance/pernIncomeBusinessPlan/' +
                                i22,
                              schemaPath:
                                '#/properties/accreditations/items/properties/pernIssuance/properties/pernIncomeBusinessPlan/items/additionalProperties',
                              keyword: 'additionalProperties',
                              params: { additionalProperty: key35 },
                              message: 'must NOT have additional properties',
                              schema: false,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .pernIncomeBusinessPlan.items,
                              data: data206
                            }
                            if (vErrors === null) {
                              vErrors = [err349]
                            } else {
                              vErrors.push(err349)
                            }
                            errors++
                          }
                        }
                        if (data206.percentIncomeSpent !== undefined) {
                          var data207 = data206.percentIncomeSpent
                          if (
                            !(typeof data207 == 'number' && isFinite(data207))
                          ) {
                            var err350 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/pernIssuance/pernIncomeBusinessPlan/' +
                                i22 +
                                '/percentIncomeSpent',
                              schemaPath:
                                '#/properties/accreditations/items/properties/pernIssuance/properties/pernIncomeBusinessPlan/items/properties/percentIncomeSpent/type',
                              keyword: 'type',
                              params: { type: 'number' },
                              message: 'must be number',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .pernIncomeBusinessPlan.items.properties
                                  .percentIncomeSpent.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .pernIncomeBusinessPlan.items.properties
                                  .percentIncomeSpent,
                              data: data207
                            }
                            if (vErrors === null) {
                              vErrors = [err350]
                            } else {
                              vErrors.push(err350)
                            }
                            errors++
                          }
                        }
                        if (data206.usageDescription !== undefined) {
                          var data208 = data206.usageDescription
                          if (typeof data208 !== 'string') {
                            var err351 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/pernIssuance/pernIncomeBusinessPlan/' +
                                i22 +
                                '/usageDescription',
                              schemaPath:
                                '#/properties/accreditations/items/properties/pernIssuance/properties/pernIncomeBusinessPlan/items/properties/usageDescription/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .pernIncomeBusinessPlan.items.properties
                                  .usageDescription.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .pernIncomeBusinessPlan.items.properties
                                  .usageDescription,
                              data: data208
                            }
                            if (vErrors === null) {
                              vErrors = [err351]
                            } else {
                              vErrors.push(err351)
                            }
                            errors++
                          }
                        }
                        if (data206.detailedExplanation !== undefined) {
                          var data209 = data206.detailedExplanation
                          if (typeof data209 !== 'string') {
                            var err352 = {
                              instancePath:
                                instancePath +
                                '/accreditations/' +
                                i16 +
                                '/pernIssuance/pernIncomeBusinessPlan/' +
                                i22 +
                                '/detailedExplanation',
                              schemaPath:
                                '#/properties/accreditations/items/properties/pernIssuance/properties/pernIncomeBusinessPlan/items/properties/detailedExplanation/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                              schema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .pernIncomeBusinessPlan.items.properties
                                  .detailedExplanation.type,
                              parentSchema:
                                schema38.properties.accreditations.items
                                  .properties.pernIssuance.properties
                                  .pernIncomeBusinessPlan.items.properties
                                  .detailedExplanation,
                              data: data209
                            }
                            if (vErrors === null) {
                              vErrors = [err352]
                            } else {
                              vErrors.push(err352)
                            }
                            errors++
                          }
                        }
                      } else {
                        var err353 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/pernIssuance/pernIncomeBusinessPlan/' +
                            i22,
                          schemaPath:
                            '#/properties/accreditations/items/properties/pernIssuance/properties/pernIncomeBusinessPlan/items/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .pernIssuance.properties.pernIncomeBusinessPlan
                              .items.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .pernIssuance.properties.pernIncomeBusinessPlan
                              .items,
                          data: data206
                        }
                        if (vErrors === null) {
                          vErrors = [err353]
                        } else {
                          vErrors.push(err353)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err354 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/pernIssuance/pernIncomeBusinessPlan',
                      schemaPath:
                        '#/properties/accreditations/items/properties/pernIssuance/properties/pernIncomeBusinessPlan/type',
                      keyword: 'type',
                      params: { type: 'array' },
                      message: 'must be array',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .pernIssuance.properties.pernIncomeBusinessPlan.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .pernIssuance.properties.pernIncomeBusinessPlan,
                      data: data205
                    }
                    if (vErrors === null) {
                      vErrors = [err354]
                    } else {
                      vErrors.push(err354)
                    }
                    errors++
                  }
                }
              } else {
                var err355 = {
                  instancePath:
                    instancePath + '/accreditations/' + i16 + '/pernIssuance',
                  schemaPath:
                    '#/properties/accreditations/items/properties/pernIssuance/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .pernIssuance.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .pernIssuance,
                  data: data196
                }
                if (vErrors === null) {
                  vErrors = [err355]
                } else {
                  vErrors.push(err355)
                }
                errors++
              }
            }
            if (data151.businessPlan !== undefined) {
              var data210 = data151.businessPlan
              if (Array.isArray(data210)) {
                var len23 = data210.length
                for (var i23 = 0; i23 < len23; i23++) {
                  var data211 = data210[i23]
                  if (
                    data211 &&
                    typeof data211 == 'object' &&
                    !Array.isArray(data211)
                  ) {
                    for (var key36 in data211) {
                      var err356 = {
                        instancePath:
                          instancePath +
                          '/accreditations/' +
                          i16 +
                          '/businessPlan/' +
                          i23,
                        schemaPath:
                          '#/properties/accreditations/items/properties/businessPlan/items/additionalProperties',
                        keyword: 'additionalProperties',
                        params: { additionalProperty: key36 },
                        message: 'must NOT have additional properties',
                        schema: false,
                        parentSchema:
                          schema38.properties.accreditations.items.properties
                            .businessPlan.items,
                        data: data211
                      }
                      if (vErrors === null) {
                        vErrors = [err356]
                      } else {
                        vErrors.push(err356)
                      }
                      errors++
                    }
                  } else {
                    var err357 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/businessPlan/' +
                        i23,
                      schemaPath:
                        '#/properties/accreditations/items/properties/businessPlan/items/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .businessPlan.items.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .businessPlan.items,
                      data: data211
                    }
                    if (vErrors === null) {
                      vErrors = [err357]
                    } else {
                      vErrors.push(err357)
                    }
                    errors++
                  }
                }
              } else {
                var err358 = {
                  instancePath:
                    instancePath + '/accreditations/' + i16 + '/businessPlan',
                  schemaPath:
                    '#/properties/accreditations/items/properties/businessPlan/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .businessPlan.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .businessPlan,
                  data: data210
                }
                if (vErrors === null) {
                  vErrors = [err358]
                } else {
                  vErrors.push(err358)
                }
                errors++
              }
            }
            if (data151.noticeAddress !== undefined) {
              var data212 = data151.noticeAddress
              if (
                data212 &&
                typeof data212 == 'object' &&
                !Array.isArray(data212)
              ) {
                for (var key37 in data212) {
                  if (
                    !func4.call(
                      schema38.properties.accreditations.items.properties
                        .noticeAddress.properties,
                      key37
                    )
                  ) {
                    var err359 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/noticeAddress',
                      schemaPath:
                        '#/properties/accreditations/items/properties/noticeAddress/additionalProperties',
                      keyword: 'additionalProperties',
                      params: { additionalProperty: key37 },
                      message: 'must NOT have additional properties',
                      schema: false,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress,
                      data: data212
                    }
                    if (vErrors === null) {
                      vErrors = [err359]
                    } else {
                      vErrors.push(err359)
                    }
                    errors++
                  }
                }
                if (data212.line1 !== undefined) {
                  var data213 = data212.line1
                  if (typeof data213 !== 'string') {
                    var err360 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/noticeAddress/line1',
                      schemaPath:
                        '#/properties/accreditations/items/properties/noticeAddress/properties/line1/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.line1.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.line1,
                      data: data213
                    }
                    if (vErrors === null) {
                      vErrors = [err360]
                    } else {
                      vErrors.push(err360)
                    }
                    errors++
                  }
                }
                if (data212.line2 !== undefined) {
                  var data214 = data212.line2
                  if (typeof data214 !== 'string') {
                    var err361 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/noticeAddress/line2',
                      schemaPath:
                        '#/properties/accreditations/items/properties/noticeAddress/properties/line2/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.line2.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.line2,
                      data: data214
                    }
                    if (vErrors === null) {
                      vErrors = [err361]
                    } else {
                      vErrors.push(err361)
                    }
                    errors++
                  }
                }
                if (data212.town !== undefined) {
                  var data215 = data212.town
                  if (typeof data215 !== 'string') {
                    var err362 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/noticeAddress/town',
                      schemaPath:
                        '#/properties/accreditations/items/properties/noticeAddress/properties/town/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.town.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.town,
                      data: data215
                    }
                    if (vErrors === null) {
                      vErrors = [err362]
                    } else {
                      vErrors.push(err362)
                    }
                    errors++
                  }
                }
                if (data212.county !== undefined) {
                  var data216 = data212.county
                  if (typeof data216 !== 'string') {
                    var err363 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/noticeAddress/county',
                      schemaPath:
                        '#/properties/accreditations/items/properties/noticeAddress/properties/county/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.county.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.county,
                      data: data216
                    }
                    if (vErrors === null) {
                      vErrors = [err363]
                    } else {
                      vErrors.push(err363)
                    }
                    errors++
                  }
                }
                if (data212.country !== undefined) {
                  var data217 = data212.country
                  if (typeof data217 !== 'string') {
                    var err364 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/noticeAddress/country',
                      schemaPath:
                        '#/properties/accreditations/items/properties/noticeAddress/properties/country/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.country.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.country,
                      data: data217
                    }
                    if (vErrors === null) {
                      vErrors = [err364]
                    } else {
                      vErrors.push(err364)
                    }
                    errors++
                  }
                }
                if (data212.postcode !== undefined) {
                  var data218 = data212.postcode
                  if (typeof data218 !== 'string') {
                    var err365 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/noticeAddress/postcode',
                      schemaPath:
                        '#/properties/accreditations/items/properties/noticeAddress/properties/postcode/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.postcode.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.postcode,
                      data: data218
                    }
                    if (vErrors === null) {
                      vErrors = [err365]
                    } else {
                      vErrors.push(err365)
                    }
                    errors++
                  }
                }
                if (data212.region !== undefined) {
                  var data219 = data212.region
                  if (typeof data219 !== 'string') {
                    var err366 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/noticeAddress/region',
                      schemaPath:
                        '#/properties/accreditations/items/properties/noticeAddress/properties/region/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.region.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.region,
                      data: data219
                    }
                    if (vErrors === null) {
                      vErrors = [err366]
                    } else {
                      vErrors.push(err366)
                    }
                    errors++
                  }
                }
                if (data212.fullAddress !== undefined) {
                  var data220 = data212.fullAddress
                  if (typeof data220 !== 'string') {
                    var err367 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/noticeAddress/fullAddress',
                      schemaPath:
                        '#/properties/accreditations/items/properties/noticeAddress/properties/fullAddress/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.fullAddress.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.fullAddress,
                      data: data220
                    }
                    if (vErrors === null) {
                      vErrors = [err367]
                    } else {
                      vErrors.push(err367)
                    }
                    errors++
                  }
                }
                if (data212.line2ToCounty !== undefined) {
                  var data221 = data212.line2ToCounty
                  if (typeof data221 !== 'string') {
                    var err368 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/noticeAddress/line2ToCounty',
                      schemaPath:
                        '#/properties/accreditations/items/properties/noticeAddress/properties/line2ToCounty/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.line2ToCounty.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .noticeAddress.properties.line2ToCounty,
                      data: data221
                    }
                    if (vErrors === null) {
                      vErrors = [err368]
                    } else {
                      vErrors.push(err368)
                    }
                    errors++
                  }
                }
              } else {
                var err369 = {
                  instancePath:
                    instancePath + '/accreditations/' + i16 + '/noticeAddress',
                  schemaPath:
                    '#/properties/accreditations/items/properties/noticeAddress/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .noticeAddress.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .noticeAddress,
                  data: data212
                }
                if (vErrors === null) {
                  vErrors = [err369]
                } else {
                  vErrors.push(err369)
                }
                errors++
              }
            }
            if (data151.submitterContactDetails !== undefined) {
              var data222 = data151.submitterContactDetails
              var _errs503 = errors
              var valid91 = false
              var _errs504 = errors
              if (
                data222 &&
                typeof data222 == 'object' &&
                !Array.isArray(data222)
              ) {
                if (data222.role === undefined) {
                  var err370 = {
                    instancePath:
                      instancePath +
                      '/accreditations/' +
                      i16 +
                      '/submitterContactDetails',
                    schemaPath:
                      '#/properties/accreditations/items/properties/submitterContactDetails/anyOf/0/required',
                    keyword: 'required',
                    params: { missingProperty: 'role' },
                    message: "must have required property '" + 'role' + "'",
                    schema:
                      schema38.properties.accreditations.items.properties
                        .submitterContactDetails.anyOf[0].required,
                    parentSchema:
                      schema38.properties.accreditations.items.properties
                        .submitterContactDetails.anyOf[0],
                    data: data222
                  }
                  if (vErrors === null) {
                    vErrors = [err370]
                  } else {
                    vErrors.push(err370)
                  }
                  errors++
                }
              }
              var _valid6 = _errs504 === errors
              valid91 = valid91 || _valid6
              if (!valid91) {
                var _errs505 = errors
                if (
                  data222 &&
                  typeof data222 == 'object' &&
                  !Array.isArray(data222)
                ) {
                  if (data222.title === undefined) {
                    var err371 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/submitterContactDetails',
                      schemaPath:
                        '#/properties/accreditations/items/properties/submitterContactDetails/anyOf/1/required',
                      keyword: 'required',
                      params: { missingProperty: 'title' },
                      message: "must have required property '" + 'title' + "'",
                      schema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails.anyOf[1].required,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails.anyOf[1],
                      data: data222
                    }
                    if (vErrors === null) {
                      vErrors = [err371]
                    } else {
                      vErrors.push(err371)
                    }
                    errors++
                  }
                }
                var _valid6 = _errs505 === errors
                valid91 = valid91 || _valid6
              }
              if (!valid91) {
                var err372 = {
                  instancePath:
                    instancePath +
                    '/accreditations/' +
                    i16 +
                    '/submitterContactDetails',
                  schemaPath:
                    '#/properties/accreditations/items/properties/submitterContactDetails/anyOf',
                  keyword: 'anyOf',
                  params: {},
                  message: 'must match a schema in anyOf',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .submitterContactDetails.anyOf,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .submitterContactDetails,
                  data: data222
                }
                if (vErrors === null) {
                  vErrors = [err372]
                } else {
                  vErrors.push(err372)
                }
                errors++
              } else {
                errors = _errs503
                if (vErrors !== null) {
                  if (_errs503) {
                    vErrors.length = _errs503
                  } else {
                    vErrors = null
                  }
                }
              }
              if (
                data222 &&
                typeof data222 == 'object' &&
                !Array.isArray(data222)
              ) {
                if (data222.fullName === undefined) {
                  var err373 = {
                    instancePath:
                      instancePath +
                      '/accreditations/' +
                      i16 +
                      '/submitterContactDetails',
                    schemaPath:
                      '#/properties/accreditations/items/properties/submitterContactDetails/required',
                    keyword: 'required',
                    params: { missingProperty: 'fullName' },
                    message: "must have required property '" + 'fullName' + "'",
                    schema:
                      schema38.properties.accreditations.items.properties
                        .submitterContactDetails.required,
                    parentSchema:
                      schema38.properties.accreditations.items.properties
                        .submitterContactDetails,
                    data: data222
                  }
                  if (vErrors === null) {
                    vErrors = [err373]
                  } else {
                    vErrors.push(err373)
                  }
                  errors++
                }
                if (data222.email === undefined) {
                  var err374 = {
                    instancePath:
                      instancePath +
                      '/accreditations/' +
                      i16 +
                      '/submitterContactDetails',
                    schemaPath:
                      '#/properties/accreditations/items/properties/submitterContactDetails/required',
                    keyword: 'required',
                    params: { missingProperty: 'email' },
                    message: "must have required property '" + 'email' + "'",
                    schema:
                      schema38.properties.accreditations.items.properties
                        .submitterContactDetails.required,
                    parentSchema:
                      schema38.properties.accreditations.items.properties
                        .submitterContactDetails,
                    data: data222
                  }
                  if (vErrors === null) {
                    vErrors = [err374]
                  } else {
                    vErrors.push(err374)
                  }
                  errors++
                }
                if (data222.phone === undefined) {
                  var err375 = {
                    instancePath:
                      instancePath +
                      '/accreditations/' +
                      i16 +
                      '/submitterContactDetails',
                    schemaPath:
                      '#/properties/accreditations/items/properties/submitterContactDetails/required',
                    keyword: 'required',
                    params: { missingProperty: 'phone' },
                    message: "must have required property '" + 'phone' + "'",
                    schema:
                      schema38.properties.accreditations.items.properties
                        .submitterContactDetails.required,
                    parentSchema:
                      schema38.properties.accreditations.items.properties
                        .submitterContactDetails,
                    data: data222
                  }
                  if (vErrors === null) {
                    vErrors = [err375]
                  } else {
                    vErrors.push(err375)
                  }
                  errors++
                }
                for (var key38 in data222) {
                  if (
                    !(
                      key38 === 'fullName' ||
                      key38 === 'email' ||
                      key38 === 'phone' ||
                      key38 === 'role' ||
                      key38 === 'title'
                    )
                  ) {
                    var err376 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/submitterContactDetails',
                      schemaPath:
                        '#/properties/accreditations/items/properties/submitterContactDetails/additionalProperties',
                      keyword: 'additionalProperties',
                      params: { additionalProperty: key38 },
                      message: 'must NOT have additional properties',
                      schema: false,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails,
                      data: data222
                    }
                    if (vErrors === null) {
                      vErrors = [err376]
                    } else {
                      vErrors.push(err376)
                    }
                    errors++
                  }
                }
                if (data222.fullName !== undefined) {
                  var data223 = data222.fullName
                  if (typeof data223 !== 'string') {
                    var err377 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/submitterContactDetails/fullName',
                      schemaPath:
                        '#/properties/accreditations/items/properties/submitterContactDetails/properties/fullName/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails.properties.fullName.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails.properties.fullName,
                      data: data223
                    }
                    if (vErrors === null) {
                      vErrors = [err377]
                    } else {
                      vErrors.push(err377)
                    }
                    errors++
                  }
                }
                if (data222.email !== undefined) {
                  var data224 = data222.email
                  if (typeof data224 === 'string') {
                    if (!formats0.test(data224)) {
                      var err378 = {
                        instancePath:
                          instancePath +
                          '/accreditations/' +
                          i16 +
                          '/submitterContactDetails/email',
                        schemaPath:
                          '#/properties/accreditations/items/properties/submitterContactDetails/properties/email/format',
                        keyword: 'format',
                        params: { format: 'email' },
                        message: 'must match format "' + 'email' + '"',
                        schema: 'email',
                        parentSchema:
                          schema38.properties.accreditations.items.properties
                            .submitterContactDetails.properties.email,
                        data: data224
                      }
                      if (vErrors === null) {
                        vErrors = [err378]
                      } else {
                        vErrors.push(err378)
                      }
                      errors++
                    }
                  } else {
                    var err379 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/submitterContactDetails/email',
                      schemaPath:
                        '#/properties/accreditations/items/properties/submitterContactDetails/properties/email/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails.properties.email.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails.properties.email,
                      data: data224
                    }
                    if (vErrors === null) {
                      vErrors = [err379]
                    } else {
                      vErrors.push(err379)
                    }
                    errors++
                  }
                }
                if (data222.phone !== undefined) {
                  var data225 = data222.phone
                  if (typeof data225 !== 'string') {
                    var err380 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/submitterContactDetails/phone',
                      schemaPath:
                        '#/properties/accreditations/items/properties/submitterContactDetails/properties/phone/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails.properties.phone.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails.properties.phone,
                      data: data225
                    }
                    if (vErrors === null) {
                      vErrors = [err380]
                    } else {
                      vErrors.push(err380)
                    }
                    errors++
                  }
                }
                if (data222.role !== undefined) {
                  var data226 = data222.role
                  if (typeof data226 !== 'string') {
                    var err381 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/submitterContactDetails/role',
                      schemaPath:
                        '#/properties/accreditations/items/properties/submitterContactDetails/properties/role/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails.properties.role.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails.properties.role,
                      data: data226
                    }
                    if (vErrors === null) {
                      vErrors = [err381]
                    } else {
                      vErrors.push(err381)
                    }
                    errors++
                  }
                }
                if (data222.title !== undefined) {
                  var data227 = data222.title
                  if (typeof data227 !== 'string') {
                    var err382 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/submitterContactDetails/title',
                      schemaPath:
                        '#/properties/accreditations/items/properties/submitterContactDetails/properties/title/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails.properties.title.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .submitterContactDetails.properties.title,
                      data: data227
                    }
                    if (vErrors === null) {
                      vErrors = [err382]
                    } else {
                      vErrors.push(err382)
                    }
                    errors++
                  }
                }
              } else {
                var err383 = {
                  instancePath:
                    instancePath +
                    '/accreditations/' +
                    i16 +
                    '/submitterContactDetails',
                  schemaPath:
                    '#/properties/accreditations/items/properties/submitterContactDetails/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .submitterContactDetails.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .submitterContactDetails,
                  data: data222
                }
                if (vErrors === null) {
                  vErrors = [err383]
                } else {
                  vErrors.push(err383)
                }
                errors++
              }
            }
            if (data151.samplingInspectionPlanFileUploads !== undefined) {
              var data228 = data151.samplingInspectionPlanFileUploads
              if (Array.isArray(data228)) {
                var len24 = data228.length
                for (var i24 = 0; i24 < len24; i24++) {
                  var data229 = data228[i24]
                  if (
                    data229 &&
                    typeof data229 == 'object' &&
                    !Array.isArray(data229)
                  ) {
                    if (data229.defraFormUploadedFileId === undefined) {
                      var err384 = {
                        instancePath:
                          instancePath +
                          '/accreditations/' +
                          i16 +
                          '/samplingInspectionPlanFileUploads/' +
                          i24,
                        schemaPath:
                          '#/properties/accreditations/items/properties/samplingInspectionPlanFileUploads/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'defraFormUploadedFileId' },
                        message:
                          "must have required property '" +
                          'defraFormUploadedFileId' +
                          "'",
                        schema:
                          schema38.properties.accreditations.items.properties
                            .samplingInspectionPlanFileUploads.items.required,
                        parentSchema:
                          schema38.properties.accreditations.items.properties
                            .samplingInspectionPlanFileUploads.items,
                        data: data229
                      }
                      if (vErrors === null) {
                        vErrors = [err384]
                      } else {
                        vErrors.push(err384)
                      }
                      errors++
                    }
                    if (data229.defraFormUserDownloadLink === undefined) {
                      var err385 = {
                        instancePath:
                          instancePath +
                          '/accreditations/' +
                          i16 +
                          '/samplingInspectionPlanFileUploads/' +
                          i24,
                        schemaPath:
                          '#/properties/accreditations/items/properties/samplingInspectionPlanFileUploads/items/required',
                        keyword: 'required',
                        params: {
                          missingProperty: 'defraFormUserDownloadLink'
                        },
                        message:
                          "must have required property '" +
                          'defraFormUserDownloadLink' +
                          "'",
                        schema:
                          schema38.properties.accreditations.items.properties
                            .samplingInspectionPlanFileUploads.items.required,
                        parentSchema:
                          schema38.properties.accreditations.items.properties
                            .samplingInspectionPlanFileUploads.items,
                        data: data229
                      }
                      if (vErrors === null) {
                        vErrors = [err385]
                      } else {
                        vErrors.push(err385)
                      }
                      errors++
                    }
                    for (var key39 in data229) {
                      if (
                        !(
                          key39 === 'defraFormUploadedFileId' ||
                          key39 === 'defraFormUserDownloadLink' ||
                          key39 === 's3Uri'
                        )
                      ) {
                        var err386 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/samplingInspectionPlanFileUploads/' +
                            i24,
                          schemaPath:
                            '#/properties/accreditations/items/properties/samplingInspectionPlanFileUploads/items/additionalProperties',
                          keyword: 'additionalProperties',
                          params: { additionalProperty: key39 },
                          message: 'must NOT have additional properties',
                          schema: false,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .samplingInspectionPlanFileUploads.items,
                          data: data229
                        }
                        if (vErrors === null) {
                          vErrors = [err386]
                        } else {
                          vErrors.push(err386)
                        }
                        errors++
                      }
                    }
                    if (data229.defraFormUploadedFileId !== undefined) {
                      var data230 = data229.defraFormUploadedFileId
                      if (typeof data230 !== 'string') {
                        var err387 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/samplingInspectionPlanFileUploads/' +
                            i24 +
                            '/defraFormUploadedFileId',
                          schemaPath:
                            '#/properties/accreditations/items/properties/samplingInspectionPlanFileUploads/items/properties/defraFormUploadedFileId/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .samplingInspectionPlanFileUploads.items
                              .properties.defraFormUploadedFileId.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .samplingInspectionPlanFileUploads.items
                              .properties.defraFormUploadedFileId,
                          data: data230
                        }
                        if (vErrors === null) {
                          vErrors = [err387]
                        } else {
                          vErrors.push(err387)
                        }
                        errors++
                      }
                    }
                    if (data229.defraFormUserDownloadLink !== undefined) {
                      var data231 = data229.defraFormUserDownloadLink
                      if (typeof data231 === 'string') {
                        if (!formats14(data231)) {
                          var err388 = {
                            instancePath:
                              instancePath +
                              '/accreditations/' +
                              i16 +
                              '/samplingInspectionPlanFileUploads/' +
                              i24 +
                              '/defraFormUserDownloadLink',
                            schemaPath:
                              '#/properties/accreditations/items/properties/samplingInspectionPlanFileUploads/items/properties/defraFormUserDownloadLink/format',
                            keyword: 'format',
                            params: { format: 'uri' },
                            message: 'must match format "' + 'uri' + '"',
                            schema: 'uri',
                            parentSchema:
                              schema38.properties.accreditations.items
                                .properties.samplingInspectionPlanFileUploads
                                .items.properties.defraFormUserDownloadLink,
                            data: data231
                          }
                          if (vErrors === null) {
                            vErrors = [err388]
                          } else {
                            vErrors.push(err388)
                          }
                          errors++
                        }
                      } else {
                        var err389 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/samplingInspectionPlanFileUploads/' +
                            i24 +
                            '/defraFormUserDownloadLink',
                          schemaPath:
                            '#/properties/accreditations/items/properties/samplingInspectionPlanFileUploads/items/properties/defraFormUserDownloadLink/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .samplingInspectionPlanFileUploads.items
                              .properties.defraFormUserDownloadLink.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .samplingInspectionPlanFileUploads.items
                              .properties.defraFormUserDownloadLink,
                          data: data231
                        }
                        if (vErrors === null) {
                          vErrors = [err389]
                        } else {
                          vErrors.push(err389)
                        }
                        errors++
                      }
                    }
                    if (data229.s3Uri !== undefined) {
                      var data232 = data229.s3Uri
                      if (typeof data232 !== 'string') {
                        var err390 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/samplingInspectionPlanFileUploads/' +
                            i24 +
                            '/s3Uri',
                          schemaPath:
                            '#/properties/accreditations/items/properties/samplingInspectionPlanFileUploads/items/properties/s3Uri/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .samplingInspectionPlanFileUploads.items
                              .properties.s3Uri.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .samplingInspectionPlanFileUploads.items
                              .properties.s3Uri,
                          data: data232
                        }
                        if (vErrors === null) {
                          vErrors = [err390]
                        } else {
                          vErrors.push(err390)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err391 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/samplingInspectionPlanFileUploads/' +
                        i24,
                      schemaPath:
                        '#/properties/accreditations/items/properties/samplingInspectionPlanFileUploads/items/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .samplingInspectionPlanFileUploads.items.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .samplingInspectionPlanFileUploads.items,
                      data: data229
                    }
                    if (vErrors === null) {
                      vErrors = [err391]
                    } else {
                      vErrors.push(err391)
                    }
                    errors++
                  }
                }
              } else {
                var err392 = {
                  instancePath:
                    instancePath +
                    '/accreditations/' +
                    i16 +
                    '/samplingInspectionPlanFileUploads',
                  schemaPath:
                    '#/properties/accreditations/items/properties/samplingInspectionPlanFileUploads/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .samplingInspectionPlanFileUploads.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .samplingInspectionPlanFileUploads,
                  data: data228
                }
                if (vErrors === null) {
                  vErrors = [err392]
                } else {
                  vErrors.push(err392)
                }
                errors++
              }
            }
            if (data151.orsFileUploads !== undefined) {
              var data233 = data151.orsFileUploads
              if (Array.isArray(data233)) {
                var len25 = data233.length
                for (var i25 = 0; i25 < len25; i25++) {
                  var data234 = data233[i25]
                  if (
                    data234 &&
                    typeof data234 == 'object' &&
                    !Array.isArray(data234)
                  ) {
                    if (data234.defraFormUploadedFileId === undefined) {
                      var err393 = {
                        instancePath:
                          instancePath +
                          '/accreditations/' +
                          i16 +
                          '/orsFileUploads/' +
                          i25,
                        schemaPath:
                          '#/properties/accreditations/items/properties/orsFileUploads/items/required',
                        keyword: 'required',
                        params: { missingProperty: 'defraFormUploadedFileId' },
                        message:
                          "must have required property '" +
                          'defraFormUploadedFileId' +
                          "'",
                        schema:
                          schema38.properties.accreditations.items.properties
                            .orsFileUploads.items.required,
                        parentSchema:
                          schema38.properties.accreditations.items.properties
                            .orsFileUploads.items,
                        data: data234
                      }
                      if (vErrors === null) {
                        vErrors = [err393]
                      } else {
                        vErrors.push(err393)
                      }
                      errors++
                    }
                    if (data234.defraFormUserDownloadLink === undefined) {
                      var err394 = {
                        instancePath:
                          instancePath +
                          '/accreditations/' +
                          i16 +
                          '/orsFileUploads/' +
                          i25,
                        schemaPath:
                          '#/properties/accreditations/items/properties/orsFileUploads/items/required',
                        keyword: 'required',
                        params: {
                          missingProperty: 'defraFormUserDownloadLink'
                        },
                        message:
                          "must have required property '" +
                          'defraFormUserDownloadLink' +
                          "'",
                        schema:
                          schema38.properties.accreditations.items.properties
                            .orsFileUploads.items.required,
                        parentSchema:
                          schema38.properties.accreditations.items.properties
                            .orsFileUploads.items,
                        data: data234
                      }
                      if (vErrors === null) {
                        vErrors = [err394]
                      } else {
                        vErrors.push(err394)
                      }
                      errors++
                    }
                    for (var key40 in data234) {
                      if (
                        !(
                          key40 === 'defraFormUploadedFileId' ||
                          key40 === 'defraFormUserDownloadLink' ||
                          key40 === 's3Uri'
                        )
                      ) {
                        var err395 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/orsFileUploads/' +
                            i25,
                          schemaPath:
                            '#/properties/accreditations/items/properties/orsFileUploads/items/additionalProperties',
                          keyword: 'additionalProperties',
                          params: { additionalProperty: key40 },
                          message: 'must NOT have additional properties',
                          schema: false,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .orsFileUploads.items,
                          data: data234
                        }
                        if (vErrors === null) {
                          vErrors = [err395]
                        } else {
                          vErrors.push(err395)
                        }
                        errors++
                      }
                    }
                    if (data234.defraFormUploadedFileId !== undefined) {
                      var data235 = data234.defraFormUploadedFileId
                      if (typeof data235 !== 'string') {
                        var err396 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/orsFileUploads/' +
                            i25 +
                            '/defraFormUploadedFileId',
                          schemaPath:
                            '#/properties/accreditations/items/properties/orsFileUploads/items/properties/defraFormUploadedFileId/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .orsFileUploads.items.properties
                              .defraFormUploadedFileId.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .orsFileUploads.items.properties
                              .defraFormUploadedFileId,
                          data: data235
                        }
                        if (vErrors === null) {
                          vErrors = [err396]
                        } else {
                          vErrors.push(err396)
                        }
                        errors++
                      }
                    }
                    if (data234.defraFormUserDownloadLink !== undefined) {
                      var data236 = data234.defraFormUserDownloadLink
                      if (typeof data236 === 'string') {
                        if (!formats14(data236)) {
                          var err397 = {
                            instancePath:
                              instancePath +
                              '/accreditations/' +
                              i16 +
                              '/orsFileUploads/' +
                              i25 +
                              '/defraFormUserDownloadLink',
                            schemaPath:
                              '#/properties/accreditations/items/properties/orsFileUploads/items/properties/defraFormUserDownloadLink/format',
                            keyword: 'format',
                            params: { format: 'uri' },
                            message: 'must match format "' + 'uri' + '"',
                            schema: 'uri',
                            parentSchema:
                              schema38.properties.accreditations.items
                                .properties.orsFileUploads.items.properties
                                .defraFormUserDownloadLink,
                            data: data236
                          }
                          if (vErrors === null) {
                            vErrors = [err397]
                          } else {
                            vErrors.push(err397)
                          }
                          errors++
                        }
                      } else {
                        var err398 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/orsFileUploads/' +
                            i25 +
                            '/defraFormUserDownloadLink',
                          schemaPath:
                            '#/properties/accreditations/items/properties/orsFileUploads/items/properties/defraFormUserDownloadLink/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .orsFileUploads.items.properties
                              .defraFormUserDownloadLink.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .orsFileUploads.items.properties
                              .defraFormUserDownloadLink,
                          data: data236
                        }
                        if (vErrors === null) {
                          vErrors = [err398]
                        } else {
                          vErrors.push(err398)
                        }
                        errors++
                      }
                    }
                    if (data234.s3Uri !== undefined) {
                      var data237 = data234.s3Uri
                      if (typeof data237 !== 'string') {
                        var err399 = {
                          instancePath:
                            instancePath +
                            '/accreditations/' +
                            i16 +
                            '/orsFileUploads/' +
                            i25 +
                            '/s3Uri',
                          schemaPath:
                            '#/properties/accreditations/items/properties/orsFileUploads/items/properties/s3Uri/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                          schema:
                            schema38.properties.accreditations.items.properties
                              .orsFileUploads.items.properties.s3Uri.type,
                          parentSchema:
                            schema38.properties.accreditations.items.properties
                              .orsFileUploads.items.properties.s3Uri,
                          data: data237
                        }
                        if (vErrors === null) {
                          vErrors = [err399]
                        } else {
                          vErrors.push(err399)
                        }
                        errors++
                      }
                    }
                  } else {
                    var err400 = {
                      instancePath:
                        instancePath +
                        '/accreditations/' +
                        i16 +
                        '/orsFileUploads/' +
                        i25,
                      schemaPath:
                        '#/properties/accreditations/items/properties/orsFileUploads/items/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                      schema:
                        schema38.properties.accreditations.items.properties
                          .orsFileUploads.items.type,
                      parentSchema:
                        schema38.properties.accreditations.items.properties
                          .orsFileUploads.items,
                      data: data234
                    }
                    if (vErrors === null) {
                      vErrors = [err400]
                    } else {
                      vErrors.push(err400)
                    }
                    errors++
                  }
                }
              } else {
                var err401 = {
                  instancePath:
                    instancePath + '/accreditations/' + i16 + '/orsFileUploads',
                  schemaPath:
                    '#/properties/accreditations/items/properties/orsFileUploads/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                  schema:
                    schema38.properties.accreditations.items.properties
                      .orsFileUploads.type,
                  parentSchema:
                    schema38.properties.accreditations.items.properties
                      .orsFileUploads,
                  data: data233
                }
                if (vErrors === null) {
                  vErrors = [err401]
                } else {
                  vErrors.push(err401)
                }
                errors++
              }
            }
          } else {
            var err402 = {
              instancePath: instancePath + '/accreditations/' + i16,
              schemaPath: '#/properties/accreditations/items/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
              schema: schema38.properties.accreditations.items.type,
              parentSchema: schema38.properties.accreditations.items,
              data: data151
            }
            if (vErrors === null) {
              vErrors = [err402]
            } else {
              vErrors.push(err402)
            }
            errors++
          }
        }
      } else {
        var err403 = {
          instancePath: instancePath + '/accreditations',
          schemaPath: '#/properties/accreditations/type',
          keyword: 'type',
          params: { type: 'array' },
          message: 'must be array',
          schema: schema38.properties.accreditations.type,
          parentSchema: schema38.properties.accreditations,
          data: data150
        }
        if (vErrors === null) {
          vErrors = [err403]
        } else {
          vErrors.push(err403)
        }
        errors++
      }
    }
  } else {
    var err404 = {
      instancePath: instancePath,
      schemaPath: '#/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
      schema: schema38.type,
      parentSchema: schema38,
      data: data
    }
    if (vErrors === null) {
      vErrors = [err404]
    } else {
      vErrors.push(err404)
    }
    errors++
  }
  validate20.errors = vErrors
  return errors === 0
}
