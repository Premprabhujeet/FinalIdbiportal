export function LoaderOverlay({ open, text = 'IDBI Bank Loading........' }) {
  if (!open) {
    return null
  }

  return (
    <div className="portal-loader-overlay" role="status" aria-live="polite" aria-label={text}>
      <div className="portal-loader">
        <span className="portal-loader__spinner" aria-hidden="true" />
        <span className="portal-loader__text">{text}</span>
      </div>
    </div>
  )
}
