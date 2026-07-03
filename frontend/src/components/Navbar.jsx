import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end gap-4 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="text-sm leading-tight">
          <p className="font-medium text-gray-900">
            {profile?.full_name || user?.email?.split('@')[0]}
          </p>
          <p className="text-gray-400 text-xs">
            {profile?.plan === 'pro' ? '⚡ Pro' : 'Free Plan'}
          </p>
        </div>
      </div>
      <button onClick={handleSignOut}
        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Sign out">
        <LogOut className="w-4 h-4" />
      </button>
    </header>
  )
}

