import api from './client'

export const getDashboardSummary = () => api.get('/api/analytics/summary')
export const getURLAnalytics     = (urlId, days = 30) => api.get(`/api/urls/${urlId}/analytics`, { params: { days } })

