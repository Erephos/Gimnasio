import { HashRouter } from 'react-router-dom'
import AuthProvider from '../features/auth/AuthProvider.jsx'
import AppRoutes from './AppRoutes.jsx'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}
