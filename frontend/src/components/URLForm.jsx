import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function URLForm({ initial, onSubmit, onClose }) {
  const { profile } = useAuth()
  const isPro = profile?.plan === 'pro'
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    original_url: initial?.original_url || '',
    title: initial?.title || '',
    custom_slug: '',
    expires_at: '',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        original_url: form.original_url,
        ...(form.title ? { title: form.title } : {}),
        ...(form.custom_slug && isPro && !initial ? { custom_slug: form.custom_slug } : {}),
        ...(form.expires_at && isPro ? { expires_at: new Date(form.expires_at).toISOString() } : {}),
      }
      await onSubmit(payload)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{initial ? 'Edit URL' : 'Create Short URL'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Destination URL *</label>
            <input className="input" type="url" value={form.original_url} onChange={set('original_url')}
              placeholder="https://example.com/your-long-link" required />
          </div>
          <div>
            <label className="label">Title <span className="text-gray-400 font-normal">(optional)</span></label>
            <input className="input" type="text" value={form.title} onChange={set('title')}
              placeholder="e.g. Summer Campaign" />
          </div>
          {!initial && (
            <div>
              <label className="label">
                Custom Slug
                {!isPro && <span className="ml-2 text-xs font-normal text-indigo-500">Pro only</span>}
              </label>
              <input className="input" type="text" value={form.custom_slug} onChange={set('custom_slug')}
                placeholder="my-promo" pattern="[a-zA-Z0-9-]{4,30}" disabled={!isPro} />
            </div>
          )}
          <div>
            <label className="label">
              Expires At
              {!isPro && <span className="ml-2 text-xs font-normal text-indigo-500">Pro only</span>}
            </label>
            <input className="input" type="datetime-local" value={form.expires_at}
              onChange={set('expires_at')} disabled={!isPro} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving…' : initial ? 'Update URL' : 'Create URL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

