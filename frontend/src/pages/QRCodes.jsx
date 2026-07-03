import { useEffect, useState } from 'react'
import { Plus, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import QRCard from '../components/QRCard'
import QRBuilder from '../components/QRBuilder'
import { useQRCodes } from '../hooks/useQRCodes'

export default function QRCodes() {
  const { qrCodes, total, loading, fetchQRCodes, addQRCode, removeQRCode } = useQRCodes()
  const [showBuilder, setShowBuilder] = useState(false)

  useEffect(() => { fetchQRCodes() }, [fetchQRCodes])

  const handleCreate = async (formData) => {
    try {
      await addQRCode(formData)
      toast.success('QR code created!')
      setShowBuilder(false)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create QR code')
      throw err
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this QR code?')) return
    try {
      await removeQRCode(id)
      toast.success('QR code deleted')
    } catch {
      toast.error('Failed to delete QR code')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QR Codes</h1>
            <p className="text-sm text-gray-500">{total} QR code{total !== 1 ? 's' : ''} total</p>
          </div>
          <button className="btn-primary" onClick={() => setShowBuilder(true)}>
            <Plus className="w-4 h-4" /> Create QR Code
          </button>
        </div>

        {loading ? (
          <div className="card text-center py-12 text-gray-400">Loading…</div>
        ) : qrCodes.length === 0 ? (
          <div className="card text-center py-16">
            <QrCode className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="font-medium text-gray-600 mb-1">No QR codes yet</p>
            <p className="text-gray-400 text-sm mb-6">Create a dynamic QR code linked to any of your short URLs</p>
            <button className="btn-primary" onClick={() => setShowBuilder(true)}>
              <Plus className="w-4 h-4" /> Create QR Code
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((qr) => (
              <QRCard key={qr.id} qr={qr} onDelete={() => handleDelete(qr.id)} />
            ))}
          </div>
        )}
      </div>

      {showBuilder && (
        <QRBuilder onSubmit={handleCreate} onClose={() => setShowBuilder(false)} />
      )}
    </DashboardLayout>
  )
}

