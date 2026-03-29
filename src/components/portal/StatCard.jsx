export function StatCard({ icon, label, value }) {
  return (
    <article className="stat-card">
      {/* Keeps the icon and label grouped as the card header content. */}
      <div className="stat-card__header">
        <div className="stat-card__icon" aria-hidden="true">
          {icon}
        </div>
        <span>{label}</span>
      </div>

      {/* The main KPI value is separated visually from the header. */}
      <strong className="stat-card__value">{value}</strong>
    </article>
  )
}
