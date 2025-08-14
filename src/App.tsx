import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Index from './pages/Index'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Costs from './pages/Costs'
import CsvImport from './pages/CsvImport'
import NotFound from './pages/NotFound'
import AuthPage from './pages/AuthPage'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const location = useLocation()
  const PrivateRoute = (children: JSX.Element) => {
    if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>
    return session ? children : <Navigate to="/auth" replace state={{ from: location }} />
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={session ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/dashboard" element={PrivateRoute(<Dashboard />)} />
      <Route path="/transactions" element={PrivateRoute(<Transactions />)} />
      <Route path="/costs" element={PrivateRoute(<Costs />)} />
      <Route path="/csv-import" element={PrivateRoute(<CsvImport />)} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
