import { useEffect, useState } from 'react'
import { Plus, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import URLCard from '../components/URLCard'
import URLForm from '../components/URLForm'
import { useURLs } from '../hooks/useURLs'

export default function URLs() {
  const { urls, total, loading, fetchURLs, addURL, editURL, removeURL } = useURLs()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)

  useEffect(() => { fetchURLs() }, [fetchURLs])

  const handleSubmit = async (formData) => {
    try {
      if (editing) {
        await editURL(editing.id, formData)
        toast.success('URL updated!')
      } else {
        await addURL(formData)
        toast.success('Short URL created!')
      }
      setShowForm(false)
      setEditing(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save URL')
      throw err   // keep modal open on error
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this URL and all its analytics?')) return
    try {
      await removeURL(id)
      toast.success('URL deleted')
    } catch {
      toast.error('Failed to delete URL')
    }
  }

  const openCreate = () => { setEditing(null); setShowForm(true) }
  const openEdit   = (url) => { setEditing(url); setShowForm(true) }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Short URLs</h1>
            <p className="text-sm text-gray-500">{total} URL{total !== 1 ? 's' : ''} total</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Create URL
          </button>
        </div>

        {loading ? (
          <div className="card text-center py-12 text-gray-400">Loading…</div>
        ) : urls.length === 0 ? (
          <div className="card text-center py-16">
            <Link2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="font-medium text-gray-600 mb-1">No short URLs yet</p>
            <p className="text-gray-400 text-sm mb-6">Create your first short URL to get started</p>
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Create URL
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {urls.map((url) => (
              <URLCard key={url.id} url={url}
                onEdit={() => openEdit(url)}
                onDelete={() => handleDelete(url.id)} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <URLForm
          initial={editing}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </DashboardLayout>
  )
}

