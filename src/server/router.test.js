import { beforeEach, describe, expect, test, vi } from 'vitest'
import { router } from './router.js'

const { mockConfigGet } = vi.hoisted(() => ({
  mockConfigGet: vi.fn((key) => {
    if (key === 'featureFlags.overseasSites') {
      return false
    }

    return undefined
  })
}))

const { mockInert } = vi.hoisted(() => ({
  mockInert: { plugin: { name: 'inert' } }
}))

const { mockHealth } = vi.hoisted(() => ({
  mockHealth: { plugin: { name: 'health' } }
}))

const { mockServeStaticFiles } = vi.hoisted(() => ({
  mockServeStaticFiles: { plugin: { name: 'serve-static-files' } }
}))

const { mockOrsUpload } = vi.hoisted(() => ({
  mockOrsUpload: { plugin: { name: 'ors-upload' } }
}))

vi.mock('@hapi/inert', () => ({
  default: mockInert
}))

vi.mock('#config/config.js', () => ({
  config: {
    get: mockConfigGet
  }
}))

vi.mock('./routes/home/index.js', () => ({
  home: { plugin: { name: 'home' } }
}))
vi.mock('./routes/organisations/index.js', () => ({
  organisations: { plugin: { name: 'organisations' } }
}))
vi.mock('./routes/organisation/index.js', () => ({
  organisation: { plugin: { name: 'organisation' } }
}))
vi.mock('./routes/health/index.js', () => ({
  health: mockHealth
}))
vi.mock('./routes/auth/index.js', () => ({
  auth: { plugin: { name: 'auth' } }
}))
vi.mock('./routes/defra-forms-submission/index.js', () => ({
  defraFormsSubmission: { plugin: { name: 'defra-forms-submission' } }
}))
vi.mock('./routes/system-logs/index.js', () => ({
  systemLogs: { plugin: { name: 'system-logs' } }
}))
vi.mock('./routes/public-register/index.js', () => ({
  publicRegister: { plugin: { name: 'public-register' } }
}))
vi.mock('./routes/tonnage-monitoring/index.js', () => ({
  tonnageMonitoring: { plugin: { name: 'tonnage-monitoring' } }
}))
vi.mock('./routes/prn-tonnage/index.js', () => ({
  prnTonnage: { plugin: { name: 'prn-tonnage' } }
}))
vi.mock('./routes/waste-balance-availability/index.js', () => ({
  wasteBalanceAvailability: {
    plugin: { name: 'waste-balance-availability' }
  }
}))
vi.mock('./routes/linked-organisations/index.js', () => ({
  linkedOrganisations: { plugin: { name: 'linked-organisations' } }
}))
vi.mock('./routes/prn-activity/index.js', () => ({
  prnActivity: { plugin: { name: 'prn-activity' } }
}))
vi.mock('./routes/summary-log/index.js', () => ({
  summaryLogUploadsReport: { plugin: { name: 'summary-log' } }
}))
vi.mock('./routes/ors-upload/index.js', () => ({
  orsUpload: mockOrsUpload
}))
vi.mock('./common/helpers/serve-static-files.js', () => ({
  serveStaticFiles: mockServeStaticFiles
}))

describe('router plugin', () => {
  let server

  beforeEach(() => {
    vi.clearAllMocks()
    server = {
      register: vi.fn().mockResolvedValue(undefined)
    }
  })

  test('does not register ORS upload routes when feature flag is disabled', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'featureFlags.overseasSites') {
        return false
      }

      return undefined
    })

    await router.plugin.register(server)

    expect(server.register).toHaveBeenCalledTimes(4)
    expect(mockConfigGet).toHaveBeenCalledWith('featureFlags.overseasSites')
    expect(server.register).not.toHaveBeenCalledWith([mockOrsUpload])
  })

  test('registers ORS upload routes when feature flag is enabled', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'featureFlags.overseasSites') {
        return true
      }

      return undefined
    })

    await router.plugin.register(server)

    expect(server.register).toHaveBeenCalledTimes(5)
    expect(mockConfigGet).toHaveBeenCalledWith('featureFlags.overseasSites')
    expect(server.register).toHaveBeenCalledWith([mockOrsUpload])
  })
})
