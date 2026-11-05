import { useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import Field from '../../components/ui/Field.jsx'
import Input from '../../components/ui/Input.jsx'
import InputAction from '../../components/ui/InputAction.jsx'
import Select from '../../components/ui/Select.jsx'
import { WarningIcon } from '../../components/ui/icons.jsx'
import { GENEROS } from '../../config/constants.js'
import { errorMessage, ApiError } from '../../services/api.js'
import { registerSocio } from '../../services/socios.js'
import {
  compactErrors,
  normalizeEmail,
  validateDni,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from '../../utils/validators.js'

const EMPTY = {
  nombre: '',
  apellido: '',
  correo: '',
  password: '',
  dni: '',
  telefono: '',
  genero: 'MASCULINO',
  direccion: '',
  contactoEmergencia: '',
}

function validate(form) {
  return compactErrors({
    nombre: validateName(form.nombre, 'El nombre'),
    apellido: validateName(form.apellido, 'El apellido'),
    correo: validateEmail(form.correo),
    password: validatePassword(form.password),
    dni: validateDni(form.dni),
    telefono: validatePhone(form.telefono),
  })
}

// Registro público de socios. El mismo formulario sirve para el alta hecha por el personal.
function RegisterForm({ onRegistered, submit = registerSocio, submitLabel = 'Crear cuenta' }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      const socio = await submit({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: normalizeEmail(form.correo),
        password: form.password,
        dni: form.dni.trim(),
        telefono: form.telefono.trim() || null,
        genero: form.genero,
        direccion: form.direccion.trim() || null,
        contactoEmergencia: form.contactoEmergencia.trim() || null,
      })
      setForm(EMPTY)
      onRegistered(socio)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrors({ correo: 'Revisa el correo y el DNI: alguno ya está registrado.' })
      }
      setFormError(errorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const field = (name, label, props = {}) => (
    <Field id={`reg-${name}`} label={label} error={errors[name]} errorId={`reg-${name}-error`} hint={props.hint}>
      <Input
        id={`reg-${name}`}
        name={name}
        value={form[name]}
        onChange={handleChange}
        invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `reg-${name}-error` : undefined}
        {...props.input}
      />
    </Field>
  )

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <Alert tone="error" icon={<WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />}>
          {formError}
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {field('nombre', 'Nombre', { input: { autoComplete: 'given-name' } })}
        {field('apellido', 'Apellido', { input: { autoComplete: 'family-name' } })}
        {field('dni', 'DNI', { input: { inputMode: 'numeric', maxLength: 8, placeholder: '8 dígitos' } })}
        {field('telefono', 'Teléfono (opcional)', { input: { inputMode: 'numeric', maxLength: 9, placeholder: '9 dígitos' } })}
        {field('correo', 'Correo electrónico', { input: { type: 'email', autoComplete: 'email' } })}

        <Field id="reg-genero" label="Género">
          <Select id="reg-genero" name="genero" value={form.genero} onChange={handleChange}>
            {GENEROS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="reg-password"
          label="Contraseña"
          error={errors.password}
          errorId="reg-password-error"
          hint="Mínimo 8 caracteres."
          className="sm:col-span-2"
        >
          <div className="relative">
            <Input
              id="reg-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="pr-20"
              value={form.password}
              onChange={handleChange}
              invalid={Boolean(errors.password)}
            />
            <InputAction onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </InputAction>
          </div>
        </Field>

        <div className="sm:col-span-2">{field('direccion', 'Dirección (opcional)', { input: { autoComplete: 'street-address' } })}</div>
        <div className="sm:col-span-2">
          {field('contactoEmergencia', 'Contacto de emergencia (opcional)', {
            input: { placeholder: 'Nombre y teléfono' },
          })}
        </div>
      </div>

      <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={isSubmitting}>
        {isSubmitting ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}

export default RegisterForm
