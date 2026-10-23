import { useEffect, useState } from 'react'
import { canListMembers, getCurrentSession } from './lib/accounts.js'
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

  const canOpenMemberships =
    page === 'memberships' && canListMembers(getCurrentSession())

  return canOpenMemberships ? <Memberships /> : <Login />
}

export default App
