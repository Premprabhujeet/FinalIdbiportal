function EyeIcon({ visible }) {
  return (
    <svg
      aria-hidden="true"
      className="ui-password__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3.2" />
      {visible ? null : <path d="M4 4l16 16" />}
    </svg>
  )
}

export function PasswordInput({
  id,
  label,
  required = false,
  visible = false,
  onToggleVisibility,
  className = '',
  ...props
}) {
  return (
    <div className="ui-field">
      <label className="ui-label" htmlFor={id}>
        {label}
        {required ? <span className="ui-label__required">*</span> : null}
      </label>

      <div className="ui-password">
        <input
          className={['ui-input', 'ui-input--password', className].filter(Boolean).join(' ')}
          id={id}
          type={visible ? 'text' : 'password'}
          {...props}
        />

        <button
          className="ui-password__toggle"
          type="button"
          onClick={onToggleVisibility}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon visible={visible} />
        </button>
      </div>
    </div>
  )
}
