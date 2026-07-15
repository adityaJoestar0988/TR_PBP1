import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardPage from './pages/DashboardPage'
import ExpenseListPage from './pages/ExpenseListPage'
import LoginPage from './pages/LoginPage'
import POSInterfacePage from './pages/POSInterfacePage'
import RawMaterialListPage from './pages/RawMaterialListPage'
import TransactionHistoryPage from './pages/TransactionHistoryPage'
import CashflowPage from './pages/CashflowPage'
import ProductListPage from './pages/ProductListPage'
import CategoryListPage from './pages/CategoryListPage'
import ReportsPage from './pages/ReportsPage'
import StoreSettingsPage from './pages/StoreSettingsPage'

function RootRedirect() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={user.role === 'kasir' ? '/pos' : '/dashboard'} replace />
}

import SidebarLayout from './components/SidebarLayout'

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={user.role === 'kasir' ? '/pos' : '/dashboard'} replace /> : <LoginPage />}
      />
      <Route path="/" element={<RootRedirect />} />
      
      <Route element={<SidebarLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/raw-materials"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <RawMaterialListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <ExpenseListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <ProductListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <CategoryListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <ProtectedRoute allowedRoles={['kasir']}>
              <POSInterfacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute allowedRoles={['owner', 'kasir']}>
              <TransactionHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashflow"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <CashflowPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <StoreSettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
