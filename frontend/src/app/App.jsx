import { HashRouter } from 'react-router-dom'
import AuthProvider from '../features/auth/AuthProvider.jsx'
import AppRoutes from './AppRoutes.jsx'

<<<<<<< HEAD
export default function App() {
=======
function App() {
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}
<<<<<<< HEAD
=======

export default App
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
