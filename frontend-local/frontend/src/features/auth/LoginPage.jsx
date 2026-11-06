import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Alert from '../../components/ui/Alert.jsx'
import { CheckIcon } from '../../components/ui/icons.jsx'
import { homePathFor } from '../../config/roles.js'
import AuthShell from './AuthShell.jsx'
import LoginForm from './LoginForm.jsx'
import RecoverForm from './RecoverForm.jsx'
import RegisterForm from './RegisterForm.jsx'
import { useAuth } from './useAuth.js'

const COPY = {
  login: { title: 'Acceso al gimnasio', subtitle: 'Socios, recepción, entrenadores y administración ingresan con su correo.' },
  register: { title: 'Crea tu cuenta de socio', subtitle: 'Regístrate para consultar tu membresía y reservar clases.' },
  recover: { title: 'Recuperar contraseña', subtitle: 'Te ayudamos a volver a entrar.' },
}

function ModeTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function LoginPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [registeredEmail, setRegisteredEmail] = useState('')

  if (isAuthenticated) return <Navigate to={homePathFor(user.rol)} replace />

  function handleLoggedIn(session) {
    const from = location.state?.from
    navigate(from && from !== '/login' ? from : homePathFor(session.rol), { replace: true })
  }

  function handleRegistered(socio) {
    setRegisteredEmail(socio.correo)
    setMode('login')
  }

  const copy = COPY[mode]

  return (
    <AuthShell
      title={copy.title}
      subtitle={copy.subtitle}
      wide={mode === 'register'}
      footer="¿Problemas para acceder? Contacta a la recepción del gimnasio."
    >
      {mode !== 'recover' && (
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-slate-900/60 p-1">
          <ModeTab active={mode === 'login'} onClick={() => setMode('login')}>
            Iniciar sesión
          </ModeTab>
          <ModeTab active={mode === 'register'} onClick={() => setMode('register')}>
            Crear cuenta
          </ModeTab>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
        {mode === 'login' && (
          <div className="space-y-5">
            {registeredEmail && (
              <Alert tone="success" icon={<CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />}>
                Cuenta creada. Inicia sesión con {registeredEmail}.
              </Alert>
            )}
            <LoginForm
              key={registeredEmail}
              initialEmail={registeredEmail}
              onLoggedIn={handleLoggedIn}
              onForgot={() => setMode('recover')}
            />
          </div>
        )}
        {mode === 'register' && <RegisterForm onRegistered={handleRegistered} />}
        {mode === 'recover' && <RecoverForm onBack={() => setMode('login')} />}
      </section>
    </AuthShell>
  )
}

export default LoginPage
