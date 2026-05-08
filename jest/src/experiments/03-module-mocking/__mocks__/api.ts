import type { User } from '../api'

export const fetchUser = jest.fn(async (id: number): Promise<User> => ({
  id,
  name: `Mock User ${id}`,
  email: `user${id}@mock.test`,
}))

export const formatUser = jest.fn((user: User) => `MOCK: [${user.id}] ${user.name}`)

export const BASE_URL = 'https://mock.api.test'
