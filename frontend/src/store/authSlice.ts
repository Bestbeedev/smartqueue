import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '@/api/axios'

export type Role = 'admin' | 'agent' | 'user' | 'super_admin'
export interface User {
  id: number
  name: string
  email: string
  phone?: string | null
  role: Role
  avatar?: string
  establishment_id?: number | null
  pending_subscription?: any
}

interface AuthState { token: string | null; user: User | null; loading: boolean; isAuthenticated: boolean; error?: string }
const persistedUser = localStorage.getItem('user')
let initialUser: User | null = null
try { initialUser = persistedUser ? JSON.parse(persistedUser) as User : null } catch { initialUser = null; localStorage.removeItem('user') }
const initialState: AuthState = {
  token: localStorage.getItem('token'),
  user: initialUser,
  loading: false,
  isAuthenticated: !!localStorage.getItem('token'),
}

export const login = createAsyncThunk('auth/login', async (payload: { email: string; password: string }) => {
  try {
    const { data } = await api.post('/api/auth/login', payload)
    return data as { token: string; user: User }
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Login failed'
    // Use rejectWithValue to pass a controlled message to the reducer
    throw new Error(msg)
  }
})

export const signup = createAsyncThunk('auth/signup', async (payload: { 
  name: string; 
  email: string; 
  password: string; 
  password_confirmation: string; 
  phone?: string; 
}) => {
  try {
    const { data } = await api.post('/api/auth/register', payload)
    return data as { token: string; user: User }
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Signup failed'
    throw new Error(msg)
  }
})

export const registerEstablishment = createAsyncThunk('auth/registerEstablishment', async (payload: { 
  admin_name: string; 
  admin_email: string; 
  admin_password: string; 
  admin_password_confirmation: string; 
  admin_phone?: string; 
}) => {
  try {
    const { data } = await api.post('/api/onboarding/register-establishment', payload)
    return data as { token: string; user: User; next_step: string }
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Registration failed'
    throw new Error(msg)
  }
})

export const subscribe = createAsyncThunk('auth/subscribe', async (payload: { 
  plan: string; 
  paid: boolean;
}) => {
  try {
    const { data } = await api.post('/api/onboarding/subscribe', payload)
    return data as { pending_subscription: any; next_step: string }
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Subscription failed'
    throw new Error(msg)
  }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/api/auth/logout') } catch {}
  return true
})

export const refreshMe = createAsyncThunk('auth/refreshMe', async () => {
  const { data } = await api.get('/api/me')
  return data as User
})

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.loading = true; s.error = undefined })
    b.addCase(login.fulfilled, (s, a: PayloadAction<{ token: string; user: User }>) => {
      s.loading = false; s.user = a.payload.user; s.token = a.payload.token; s.isAuthenticated = true
      localStorage.setItem('token', a.payload.token)
      localStorage.setItem('user', JSON.stringify(a.payload.user))
    })
    b.addCase(login.rejected, (s, a: any) => { s.loading = false; s.error = a?.error?.message || 'Login failed' })

    b.addCase(signup.pending, (s) => { s.loading = true; s.error = undefined })
    b.addCase(signup.fulfilled, (s, a: PayloadAction<{ token: string; user: User }>) => {
      s.loading = false; s.user = a.payload.user; s.token = a.payload.token; s.isAuthenticated = true
      localStorage.setItem('token', a.payload.token)
      localStorage.setItem('user', JSON.stringify(a.payload.user))
    })
    b.addCase(registerEstablishment.pending, (s) => { s.loading = true; s.error = undefined })
    b.addCase(registerEstablishment.fulfilled, (s, a: PayloadAction<{ token: string; user: User; next_step: string }>) => {
      s.loading = false; s.user = a.payload.user; s.token = a.payload.token; s.isAuthenticated = true
      localStorage.setItem('token', a.payload.token)
      localStorage.setItem('user', JSON.stringify(a.payload.user))
    })
    b.addCase(registerEstablishment.rejected, (s, a: any) => { s.loading = false; s.error = a?.error?.message || 'Registration failed' })

    b.addCase(subscribe.pending, (s) => { s.loading = true; s.error = undefined })
    b.addCase(subscribe.fulfilled, (s, a: PayloadAction<{ pending_subscription: any; next_step: string }>) => {
      s.loading = false; 
      if (s.user) {
        s.user.pending_subscription = a.payload.pending_subscription
        localStorage.setItem('user', JSON.stringify(s.user))
      }
    })
    b.addCase(subscribe.rejected, (s, a: any) => { s.loading = false; s.error = a?.error?.message || 'Subscription failed' })

    b.addCase(logout.fulfilled, (s) => {
      s.user = null; s.token = null; s.isAuthenticated = false
      localStorage.removeItem('token'); localStorage.removeItem('user')
    })

    b.addCase(refreshMe.pending, (s) => { s.loading = true })
    b.addCase(refreshMe.rejected, (s) => { s.loading = false })

    b.addCase(refreshMe.fulfilled, (s, a: PayloadAction<User>) => {
      s.loading = false
      s.user = a.payload
      localStorage.setItem('user', JSON.stringify(a.payload))
    })
  }
})

export default slice.reducer
