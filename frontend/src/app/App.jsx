import { HashRouter } from 'react-router-dom'
import AuthProvider from '../features/auth/AuthProvider.jsx'
import AppRoutes from './AppRoutes.jsx'

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}

export default App
