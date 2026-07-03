import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { listQRCodes, createQRCode, updateQRCode, deleteQRCode } from '../api/qr'

export function useQRCodes() {
  const [qrCodes, setQRCodes] = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchQRCodes = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await listQRCodes(p)
      setQRCodes(data.data)
      setTotal(data.total)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load QR codes')
    } finally {
      setLoading(false)
    }
  }, [])

  const addQRCode = async (formData) => {
    const { data } = await createQRCode(formData)
    setQRCodes((prev) => [data, ...prev])
    setTotal((t) => t + 1)
    return data
  }

  const editQRCode = async (id, formData) => {
    const { data } = await updateQRCode(id, formData)
    setQRCodes((prev) => prev.map((q) => (q.id === id ? data : q)))
    return data
  }

  const removeQRCode = async (id) => {
    await deleteQRCode(id)
    setQRCodes((prev) => prev.filter((q) => q.id !== id))
    setTotal((t) => t - 1)
  }

  return { qrCodes, total, loading, fetchQRCodes, addQRCode, editQRCode, removeQRCode }
}

