import api from './client'

export const listURLs       = (page = 1, per_page = 20) => api.get('/api/urls', { params: { page, per_page } })
export const createURL      = (data) => api.post('/api/urls', data)
export const updateURL      = (id, data) => api.put(`/api/urls/${id}`, data)
export const deleteURL      = (id) => api.delete(`/api/urls/${id}`)
export const getURLAnalytics = (id, days = 30) => api.get(`/api/urls/${id}/analytics`, { params: { days } })

