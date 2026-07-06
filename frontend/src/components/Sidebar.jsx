import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Link2, QrCode, BarChart3, CreditCard } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/urls',      label: 'Short URLs', icon: Link2 },
  { to: '/qr',        label: 'QR Codes',   icon: QrCode },
  { to: '/analytics', label: 'Analytics',  icon: BarChart3 },
  { to: '/pricing',   label: 'Pricing',    icon: CreditCard },
]

export default function Sidebar() {
  // HashRouter: location.hash = "#/dashboard"
  const { hash } = useLocation()
  const path = hash.replace('#', '') || '/'

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <Link to="/" className="flex items-center gap-2 px-5 py-5 font-bold text-xl text-indigo-600 border-b border-gray-100">
        <QrCode className="w-7 h-7" /> QrHub
      </Link>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = path === to || path.startsWith(to + '/')
          return (
            <Link key={to} to={to}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}>
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

