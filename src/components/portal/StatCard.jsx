export function StatCard({ icon, label, value }) {
  return (
    <article className="stat-card">
      <div className="stat-card__header">
        <div className="stat-card__icon" aria-hidden="true">
          {icon}
        </div>
        <span>{label}</span>
      </div>

      <strong className="stat-card__value">{value}</strong>
    </article>
  )
}
