export function Button({ children, className = '', ...props }) {
  const classes = ['ui-button', className].filter(Boolean).join(' ')

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
