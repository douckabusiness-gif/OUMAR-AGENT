import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Auth pages
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Agent pages
import AgentLayout from './pages/agent/AgentLayout'
import Conversations from './pages/agent/Conversations'

// Admin pages
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Agents from './pages/admin/Agents'
import Roles from './pages/admin/Roles'
import Channels from './pages/admin/Channels'
import AIConfig from './pages/admin/AIConfig'
import Automations from './pages/admin/Automations'
import Analytics from './pages/admin/Analytics'
import Settings from './pages/admin/Settings'

// Installer wizard
import SetupWizard from './installer/SetupWizard'

function App() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Setup Wizard - only shown on first install */}
      <Route path="/setup" element={<SetupWizard />} />

      {/* Auth routes */}
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
      />
      <Route 
        path="/forgot-password" 
        element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/" />} 
      />
      <Route 
        path="/reset-password" 
        element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/" />} 
      />

      {/* Agent routes */}
      <Route 
        path="/" 
        element={isAuthenticated ? <AgentLayout /> : <Navigate to="/login" />} 
      >
        <Route index element={<Conversations />} />
        <Route path="conversations/:id" element={<Conversations />} />
      </Route>

      {/* Admin routes */}
      <Route 
        path="/admin" 
        element={isAuthenticated ? <AdminLayout /> : <Navigate to="/login" />} 
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="agents" element={<Agents />} />
        <Route path="roles" element={<Roles />} />
        <Route path="channels" element={<Channels />} />
        <Route path="ai" element={<AIConfig />} />
        <Route path="automations" element={<Automations />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
