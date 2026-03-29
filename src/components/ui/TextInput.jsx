export function TextInput({
  id,
  label,
  required = false,
  className = '',
  ...props
}) {
  const classes = ['ui-input', className].filter(Boolean).join(' ')

  return (
    <div className="ui-field">
      <label className="ui-label" htmlFor={id}>
        {label}
        {required ? <span className="ui-label__required">*</span> : null}
      </label>

      <input className={classes} id={id} {...props} />
    </div>
  )
}
