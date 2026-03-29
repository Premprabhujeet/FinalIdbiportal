import { useEffect } from 'react'

const variantClassMap = {
  success: 'ui-snackbar--success',
  danger: 'ui-snackbar--danger',
  warning: 'ui-snackbar--warning',
  info: 'ui-snackbar--info',
}

export function Snackbar({
  open,
  message,
  autoClose = true,
  colorType = 'info',
  onClose,
  duration = 5000,
}) {
  useEffect(() => {
    if (!open || !autoClose) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      onClose?.()
    }, duration)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [autoClose, duration, onClose, open])

  if (!open || !message) {
    return null
  }

  const colorClass = variantClassMap[colorType] ?? variantClassMap.info

  return (
    <div className={`ui-snackbar ${colorClass}`} role="status" aria-live="polite">
      <span className="ui-snackbar__message">{message}</span>

      {!autoClose ? (
        <button
          type="button"
          className="ui-snackbar__close"
          onClick={() => onClose?.()}
          aria-label="Close notification"
        >
          x
        </button>
      ) : null}
    </div>
  )
}
