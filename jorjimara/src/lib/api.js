import axios from 'axios'
import { supabase } from './supabase.js'

const api = axios.create({ baseURL: import.meta.env.VITE_SUPABASE_URL })

api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
})

export default api


// Usage in any component:
// import api from '../lib/api'
// const { data } = await api.get('/api/products')