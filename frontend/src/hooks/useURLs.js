import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { listURLs, createURL, updateURL, deleteURL } from '../api/urls'

export function useURLs() {
  const [urls, setURLs]   = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage]   = useState(1)

  const fetchURLs = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await listURLs(p)
      setURLs(data.data)
      setTotal(data.total)
      setPage(p)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load URLs')
    } finally {
      setLoading(false)
    }
  }, [])

  const addURL = async (formData) => {
    const { data } = await createURL(formData)
    setURLs((prev) => [data, ...prev])
    setTotal((t) => t + 1)
    return data
  }

  const editURL = async (id, formData) => {
    const { data } = await updateURL(id, formData)
    setURLs((prev) => prev.map((u) => (u.id === id ? data : u)))
    return data
  }

  const removeURL = async (id) => {
    await deleteURL(id)
    setURLs((prev) => prev.filter((u) => u.id !== id))
    setTotal((t) => t - 1)
  }

  return { urls, total, loading, page, fetchURLs, addURL, editURL, removeURL }
}

