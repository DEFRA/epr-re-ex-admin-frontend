import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

process.env.LOG_FORMAT = 'ecs'

vi.mock('ioredis')
