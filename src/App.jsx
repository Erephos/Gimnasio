import { useEffect, useState } from 'react'
import Login from './page/login.jsx'
import Memberships from './page/memberships.jsx'

function getPageFromHash() {
  return window.location.hash.startsWith('#/memberships')
    ? 'memberships'
    : 'login'
}

function App() {
  const [page, setPage] = useState(getPageFromHash)

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return page === 'memberships' ? <Memberships /> : <Login />
}

export default App
