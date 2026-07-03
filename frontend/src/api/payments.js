import api from './client'

export const getPlans      = () => api.get('/api/payments/plans')
export const getStatus     = () => api.get('/api/payments/status')
export const createOrder   = (data) => api.post('/api/payments/create-order', data)
export const verifyPayment = (data) => api.post('/api/payments/verify', data)

