import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import AnalyticsChart from '../components/AnalyticsChart'
import { listURLs } from '../api/urls'
import { getURLAnalytics } from '../api/analytics'

export default function Analytics() {
  const [urls, setURLs]             = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [days, setDays]             = useState(30)
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    listURLs(1, 100)
      .then(({ data: res }) => {
        setURLs(res.data)
        if (res.data.length > 0) setSelectedId(res.data[0].id)
      })
      .catch(() => toast.error('Failed to load URLs'))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    getURLAnalytics(selectedId, days)
      .then(({ data: res }) => setData({ ...res, total_clicks: (res.clicks_by_day || []).reduce((s, d) => s + Number(d.click_count), 0) }))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [selectedId, days])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

        <div className="card">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="label">URL</label>
              <select className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                {urls.length === 0 && <option value="">No URLs yet</option>}
                {urls.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title || u.short_code} ({u.click_count} clicks)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Period</label>
              <select className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-16 text-gray-400">Loading analytics…</div>
        ) : data ? (
          <AnalyticsChart data={data} />
        ) : (
          <div className="card text-center py-16 text-gray-400">
            {urls.length === 0 ? 'Create a short URL first to see analytics' : 'Select a URL above'}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

