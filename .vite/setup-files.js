import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

process.env.EPR_BACKEND_URL = 'http://epr-backend.test'
process.env.LOG_FORMAT = 'ecs'

vi.mock('ioredis')
