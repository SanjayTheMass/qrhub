import axios from 'axios'
import { supabase } from '../lib/supabase'

const API_BASE = import.meta.env.VITE_API_BASE_URL

// Fail loudly if the base URL wasn't baked in at build time
if (!API_BASE) {
  // eslint-disable-next-line no-console
  console.error(
    '[QrHub] VITE_API_BASE_URL is NOT set. ' +
    'API calls will fail. Set it as a GitHub Actions secret and re-deploy.'
  )
} else {
  // eslint-disable-next-line no-console
  console.info('[QrHub] API base URL:', API_BASE)
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
})

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Handle 401 globally — refresh once, retry the original request, else login
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err.config || {}
    const url = `${cfg.baseURL || ''}${cfg.url || ''}`
    // eslint-disable-next-line no-console
    console.error(
      `[QrHub API error] ${cfg.method?.toUpperCase() || 'GET'} ${url} → ` +
      `${err.response?.status || err.code || 'NETWORK'}`,
      err.response?.data || err.message
    )

    if (err.response?.status === 401 && !cfg._retry) {
      cfg._retry = true
      try {
        const { data: { session } } = await supabase.auth.refreshSession()
        if (session?.access_token) {
          // Retry original request with the fresh token
          cfg.headers = cfg.headers || {}
          cfg.headers.Authorization = `Bearer ${session.access_token}`
          return api.request(cfg)
        }
      } catch (_) {
        // fall through to login redirect
      }
      window.location.hash = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

