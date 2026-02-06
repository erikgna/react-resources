import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../app/providers/auth-provider'
import { Input } from '../shared/ui/input'
import { Button } from '../shared/ui/button'
import { Card } from '../shared/ui/card'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    navigate('/orders', { replace: true })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      login(username.trim())
      navigate('/orders')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Restaurant Queue System
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="username"
            label="Username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </Card>
    </div>
  )
}
