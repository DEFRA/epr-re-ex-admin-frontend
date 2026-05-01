import { vi } from 'vitest'

process.env.LOG_FORMAT = 'ecs'

vi.mock('ioredis')
