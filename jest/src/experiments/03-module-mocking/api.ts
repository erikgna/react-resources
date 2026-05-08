export interface User {
  id: number
  name: string
  email: string
}

export async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`https://api.example.com/users/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function formatUser(user: User): string {
  return `[${user.id}] ${user.name} <${user.email}>`
}

export const BASE_URL = 'https://api.example.com'
