import { Copy, Pencil, Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { copyToClipboard, formatDate, truncate } from '../utils/helpers'

export default function URLCard({ url, onEdit, onDelete }) {
  const handleCopy = async () => {
    await copyToClipboard(url.short_url)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-gray-900">{url.title || url.short_code}</span>
            {!url.is_active && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Inactive</span>
            )}
          </div>
          <p className="text-sm text-indigo-600 font-mono mb-1 truncate">{url.short_url}</p>
          <p className="text-xs text-gray-400 truncate">{truncate(url.original_url, 65)}</p>
          <p className="text-xs text-gray-400 mt-1.5">
            {url.click_count} click{url.click_count !== 1 ? 's' : ''} · Created {formatDate(url.created_at)}
            {url.expires_at && ` · Expires ${formatDate(url.expires_at)}`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleCopy} title="Copy short URL"
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <Copy className="w-4 h-4" />
          </button>
          <a href={url.short_url} target="_blank" rel="noreferrer" title="Open short URL"
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
          <button onClick={onEdit} title="Edit URL"
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} title="Delete URL"
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

