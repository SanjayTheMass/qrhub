import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { QrCode } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [searchParams] = useSearchParams()
  const [mode, setMode]         = useState(searchParams.get('signup') ? 'signup' : 'signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading]   = useState(false)
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate('/dashboard') }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/dashboard')
      } else {
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
        toast.success('Account created! Check your email to confirm your address.')
        setMode('signin')
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600 mb-8">
          <QrCode className="w-7 h-7" /> QrHub
        </Link>

        {/* Mode tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          {['signin', 'signup'].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="label">Full Name</label>
              <input className="input" type="text" value={fullName}
                onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" required />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-2" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-indigo-600 font-medium hover:underline">
            {mode === 'signin' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

