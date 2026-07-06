import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Link2, QrCode, MousePointerClick } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import { getDashboardSummary } from '../api/analytics'
import { formatNumber, truncate } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardSummary()
      .then(({ data }) => setSummary(data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Short URLs', value: summary?.total_urls ?? 0, icon: Link2, color: 'text-blue-600', bg: 'bg-blue-50', to: '/urls' },
    { label: 'QR Codes', value: summary?.total_qr_codes ?? 0, icon: QrCode, color: 'text-purple-600', bg: 'bg-purple-50', to: '/qr' },
    { label: 'Total Clicks', value: summary?.total_clicks ?? 0, icon: MousePointerClick, color: 'text-green-600', bg: 'bg-green-50', to: '/analytics' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <span className={summary?.plan === 'pro' ? 'badge-pro' : 'badge-free'}>
            {summary?.plan === 'pro' ? '⚡ Pro' : 'Free Plan'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg, to }) => (
            <Link key={label} to={to} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '—' : formatNumber(value)}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Upgrade banner */}
        {!loading && summary?.plan === 'free' && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-lg">Upgrade to Pro</p>
              <p className="text-indigo-200 text-sm mt-0.5">Unlimited URLs, QR codes, 1-year analytics, custom slugs &amp; more</p>
            </div>
            <Link to="/pricing"
              className="bg-white text-indigo-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors text-sm whitespace-nowrap shrink-0">
              Upgrade — ₹499/mo →
            </Link>
          </div>
        )}

        {/* Recent URLs */}
        {(summary?.recent_urls?.length > 0) && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Recent URLs</h2>
              <Link to="/urls" className="text-sm text-indigo-600 hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {summary.recent_urls.map((url) => (
                <div key={url.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{url.title || url.short_code}</p>
                    <p className="text-xs text-gray-400 truncate">{truncate(url.original_url, 50)}</p>
                  </div>
                  <span className="text-sm text-gray-500 ml-4 shrink-0 font-medium">{formatNumber(url.click_count)} clicks</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions (empty state) */}
        {!loading && summary?.total_urls === 0 && (
          <div className="card text-center py-12">
            <QrCode className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="font-medium text-gray-700 mb-2">You're all set! Start by creating a short URL.</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Link to="/urls" className="btn-primary">Create Short URL</Link>
              <Link to="/qr" className="btn-secondary">Create QR Code</Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

