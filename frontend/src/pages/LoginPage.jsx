import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function getHomePath(role) {
  return role === 'kasir' ? '/pos' : '/dashboard'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const authenticatedUser = await login(email, password)
      navigate(getHomePath(authenticatedUser.role), { replace: true })
    } catch (err) {
      const message = err?.response?.data?.message || 'Terjadi kesalahan.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return <Navigate to={getHomePath(user.role)} replace />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white/10 border border-white/15 backdrop-blur p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">SMART POS</p>
          <h1 className="mt-2 text-3xl font-semibold">Login</h1>
          <p className="mt-2 text-sm text-slate-300">Masuk untuk melanjutkan ke dashboard atau POS.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 outline-none ring-0 focus:border-amber-300"
              placeholder="aditya@mail.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 outline-none ring-0 focus:border-amber-300"
              placeholder="Password"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-amber-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}