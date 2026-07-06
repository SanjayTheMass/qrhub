import api from './client'

export const listQRCodes  = (page = 1, per_page = 20) => api.get('/api/qr', { params: { page, per_page } })
export const createQRCode = (data) => api.post('/api/qr', data)
export const updateQRCode = (id, data) => api.put(`/api/qr/${id}`, data)
export const deleteQRCode = (id) => api.delete(`/api/qr/${id}`)
export const regenerateQR = (id) => api.post(`/api/qr/${id}/regenerate`)

