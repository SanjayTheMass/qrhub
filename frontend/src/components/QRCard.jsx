import { Trash2, Download } from 'lucide-react'
import { downloadQR, truncate, formatDate } from '../utils/helpers'

export default function QRCard({ qr, onDelete }) {
  const urlData = qr.urls || {}
  return (
    <div className="card hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <span className="font-semibold text-gray-900 truncate mr-2">{qr.name}</span>
        <div className="flex items-center gap-1 shrink-0">
          {qr.qr_image_url && (
            <button onClick={() => downloadQR(qr.qr_image_url, qr.name)}
              title="Download PNG"
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
            </button>
          )}
          <button onClick={onDelete} title="Delete"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {qr.qr_image_url ? (
        <img src={qr.qr_image_url} alt={qr.name}
          className="w-full aspect-square object-contain rounded-xl border border-gray-100 bg-white p-3 mb-3" />
      ) : (
        <div className="w-full aspect-square bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-400 text-sm">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}

      <div className="mt-auto space-y-1">
        <p className="text-xs text-gray-500 truncate">
          → {truncate(urlData.original_url || urlData.short_code || '—', 40)}
        </p>
        <p className="text-xs text-gray-400">
          {qr.scan_count} scan{qr.scan_count !== 1 ? 's' : ''} · {formatDate(qr.created_at)}
        </p>
      </div>
    </div>
  )
}

