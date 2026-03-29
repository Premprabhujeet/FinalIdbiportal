export function PortalContentPage({ title, summary, columns }) {
  return (
    <section className="portal-section">
      <h1 className="portal-section__title">{title}</h1>
      <p className="portal-section__summary">{summary}</p>

      <div className="portal-table-card">
        <div className="portal-table-card__header">
          {columns.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>

        <div className="portal-table-card__row">
          {columns.map((column, index) => (
            <span key={column}>
              {index === 0 ? title : 'Sample data'}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
