import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function resolveHomePath(role) {
  return role === 'kasir' ? '/pos' : '/dashboard'
}

function hasRoleAccess(userRole, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true
  }

  if (userRole === 'admin' && allowedRoles.includes('owner')) {
    return true
  }

  return allowedRoles.includes(userRole)
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!hasRoleAccess(user.role, allowedRoles)) {
    return <Navigate to={resolveHomePath(user.role)} replace />
  }

  return children
}