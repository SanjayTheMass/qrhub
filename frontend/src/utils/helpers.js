export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(dateStr))
}

export const truncate = (str, n = 45) =>
  str && str.length > n ? str.slice(0, n) + '…' : (str || '')

export const copyToClipboard = (text) => navigator.clipboard.writeText(text)

export const downloadQR = (imageUrl, name) => {
  const a = document.createElement('a')
  a.href = imageUrl
  a.download = `${name || 'qr-code'}.png`
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export const formatNumber = (n = 0) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

