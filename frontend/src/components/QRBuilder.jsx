import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import QRCode from 'react-qr-code'
import { listURLs } from '../api/urls'
import { useAuth } from '../contexts/AuthContext'

export default function QRBuilder({ onSubmit, onClose }) {
  const { profile } = useAuth()
  const isPro = profile?.plan === 'pro'

  const [urls, setURLs]     = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    url_id: '',
    name: '',
    foreground_color: '#000000',
    background_color: '#ffffff',
    logo_url: '',
  })

  const previewURL = urls.find((u) => u.id === form.url_id)?.short_url || 'https://qrhub.app'

  useEffect(() => {
    listURLs(1, 100).then(({ data }) => {
      setURLs(data.data)
      if (data.data.length > 0) setForm((f) => ({ ...f, url_id: data.data[0].id }))
    })
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        url_id: form.url_id,
        name: form.name,
        foreground_color: form.foreground_color,
        background_color: form.background_color,
        ...(form.logo_url && isPro ? { logo_url: form.logo_url } : {}),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Create QR Code</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid sm:grid-cols-2 gap-6">
          {/* Form */}
          <form id="qr-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Link to URL *</label>
              <select className="input" value={form.url_id} onChange={set('url_id')} required>
                {urls.length === 0 && <option value="">Create a short URL first</option>}
                {urls.map((u) => (
                  <option key={u.id} value={u.id}>{u.title || u.short_code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">QR Name *</label>
              <input className="input" type="text" value={form.name} onChange={set('name')}
                placeholder="e.g. Store Front QR" required />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Foreground</label>
                <input className="input h-10 p-1 cursor-pointer" type="color"
                  value={form.foreground_color} onChange={set('foreground_color')} />
              </div>
              <div className="flex-1">
                <label className="label">Background</label>
                <input className="input h-10 p-1 cursor-pointer" type="color"
                  value={form.background_color} onChange={set('background_color')} />
              </div>
            </div>
            <div>
              <label className="label">
                Logo URL
                {!isPro && <span className="ml-2 text-xs font-normal text-indigo-500">Pro only</span>}
              </label>
              <input className="input" type="url" value={form.logo_url} onChange={set('logo_url')}
                placeholder="https://example.com/logo.png" disabled={!isPro} />
            </div>
          </form>

          {/* Live preview */}
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 gap-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Live Preview</p>
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <QRCode
                value={previewURL}
                size={160}
                fgColor={form.foreground_color}
                bgColor={form.background_color}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">Actual PNG generated server-side</p>
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" form="qr-form" disabled={loading || !form.url_id || !form.name}
            className="btn-primary flex-1 justify-center">
            {loading ? 'Creating…' : 'Create QR Code'}
          </button>
        </div>
      </div>
    </div>
  )
}

