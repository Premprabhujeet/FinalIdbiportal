export function HelpSupportPage() {
  return (
    <section className="portal-section help-support-page">
      {/* Matches the requested top-row layout with the title on the left and CTA on the right. */}
      <div className="help-support-page__header">
        <h1 className="portal-section__title">Help &amp; Support</h1>

        <button className="help-support-page__ticket-button" type="button">
          Raise a ticket
        </button>
      </div>
    </section>
  )
}
