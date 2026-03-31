import { useMemo, useState } from 'react'
import '../../components/portal/styles/HelpSupportPage.css'

const initialTickets = [
  {
    id: '#352355',
    transactionId: '1238719163291',
    raisedOn: '15/01/2026, 11:23:32 AM',
    raisedDate: '2026-03-15',
    number: '+91 9349872421',
    operation: 'Transaction Declined',
    status: 'Pending',
    reasonType: 'Transaction Issue',
    description:
      'The user reported that a payment was marked as declined even though the amount appears to have been debited from the customer side.',
    messages: [
      {
        id: 'm1',
        author: 'Program Manager',
        initials: 'PM',
        sentAt: '01 Mar, 2024 02:42 PM',
        text:
          'Hello Support Team, I hope this message finds you well. I recently found out that my transaction has been declined and I need help understanding why.',
      },
      {
        id: 'm2',
        author: 'Support Team',
        initials: 'ST',
        sentAt: '02 Mar, 2024 10:12 AM',
        text:
          'Hi Shubham, thank you for reaching out. We are reviewing the transaction logs and will update you shortly with our findings.',
      },
    ],
  },
  {
    id: '#352356',
    transactionId: '1238719163292',
    raisedOn: '15/01/2026, 11:23:32 AM',
    raisedDate: '2026-03-15',
    number: '+91 9349872421',
    operation: 'Transaction Declined',
    status: 'Unresolved',
    reasonType: 'Settlement Delay',
    description:
      'The merchant has raised a concern that the settlement amount is not reflecting in the bank account despite a successful transaction.',
    messages: [
      {
        id: 'm3',
        author: 'Program Manager',
        initials: 'PM',
        sentAt: '03 Mar, 2024 09:10 AM',
        text:
          'The settlement has not reached the account yet. Please confirm whether the payout is still under processing.',
      },
    ],
  },
  {
    id: '#352357',
    transactionId: '1238719163293',
    raisedOn: '15/01/2026, 11:23:32 AM',
    raisedDate: '2026-03-15',
    number: '+91 9349872421',
    operation: 'Transaction Declined',
    status: 'Resolved',
    reasonType: 'Soundbox Issue',
    description:
      'The soundbox did not announce the incoming payment and the merchant wants confirmation that the transaction was successful.',
    messages: [
      {
        id: 'm4',
        author: 'Support Team',
        initials: 'ST',
        sentAt: '04 Mar, 2024 12:20 PM',
        text:
          'We confirmed that the payment was successful and shared troubleshooting steps for the soundbox announcement issue.',
      },
    ],
  },
  {
    id: '#352358',
    transactionId: '1238719163294',
    raisedOn: '15/01/2026, 11:23:32 AM',
    raisedDate: '2026-03-15',
    number: '+91 9349872421',
    operation: 'Transaction Declined',
    status: 'Resolved',
    reasonType: 'QR Issue',
    description:
      'The static QR was not scanning consistently across apps, and the merchant needed a status check on the QR mapping.',
    messages: [
      {
        id: 'm5',
        author: 'Support Team',
        initials: 'ST',
        sentAt: '05 Mar, 2024 01:15 PM',
        text:
          'The QR mapping has been refreshed and the issue has now been resolved successfully.',
      },
    ],
  },
]

const reasonOptions = [
  'Transaction Issue',
  'Settlement Delay',
  'Soundbox Issue',
  'QR Issue',
  'Other',
]

const statusOptions = ['All', 'Pending', 'Unresolved', 'Resolved', 'Open', 'Closed']

const initialRaiseForm = {
  reason: '',
  transactionId: '',
  description: '',
  attachmentName: '',
}

function getStatusClassName(status) {
  switch (status) {
    case 'Pending':
      return 'help-support-status help-support-status--pending'
    case 'Unresolved':
      return 'help-support-status help-support-status--unresolved'
    case 'Resolved':
      return 'help-support-status help-support-status--resolved'
    case 'Open':
      return 'help-support-status help-support-status--open'
    case 'Closed':
      return 'help-support-status help-support-status--closed'
    default:
      return 'help-support-status'
  }
}

export function HelpSupportPage() {
  const [tickets, setTickets] = useState(initialTickets)
  const [activeTicketId, setActiveTicketId] = useState('')
  const [isRaiseTicketOpen, setIsRaiseTicketOpen] = useState(false)
  const [isCloseTicketOpen, setIsCloseTicketOpen] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'All',
    search: '',
  })
  const [submittedFilters, setSubmittedFilters] = useState(null)
  const [raiseForm, setRaiseForm] = useState(initialRaiseForm)
  const [replyMessage, setReplyMessage] = useState('')

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === activeTicketId) ?? null,
    [activeTicketId, tickets],
  )

  const filteredTickets = useMemo(() => {
    if (!submittedFilters?.startDate || !submittedFilters?.endDate) {
      return []
    }

    return tickets.filter((ticket) => {
      const matchesStatus =
        submittedFilters.status === 'All'
          ? true
          : ticket.status.toLowerCase() === submittedFilters.status.toLowerCase()
      const searchTerm = submittedFilters.search.trim().toLowerCase()
      const matchesSearch = searchTerm
        ? [
            ticket.transactionId,
            ticket.number,
            ticket.operation,
            ticket.status,
            ticket.reasonType,
          ].some((value) => String(value).toLowerCase().includes(searchTerm))
        : true

      return matchesStatus && matchesSearch
    })
  }, [submittedFilters, tickets])

  const handleRaiseTicketSubmit = (event) => {
    event.preventDefault()

    const nextTicket = {
      id: `#3523${60 + tickets.length}`,
      transactionId: raiseForm.transactionId || `2139${Date.now()}`.slice(0, 13),
      raisedOn: '31/03/2026, 05:20:00 PM',
      raisedDate: '2026-03-31',
      number: '+91 9349872421',
      operation: raiseForm.reason || 'Other',
      status: 'Pending',
      reasonType: raiseForm.reason || 'Other',
      description: raiseForm.description || 'No description added.',
      messages: [
        {
          id: `m-${Date.now()}`,
          author: 'Program Manager',
          initials: 'PM',
          sentAt: '31 Mar, 2026 05:20 PM',
          text: raiseForm.description || 'No description added.',
        },
      ],
    }

    setTickets((current) => [nextTicket, ...current])
    setRaiseForm(initialRaiseForm)
    setIsRaiseTicketOpen(false)
  }

  const handleFilterSubmit = () => {
    if (!filters.startDate || !filters.endDate) {
      return
    }

    const normalizedStartDate =
      filters.startDate <= filters.endDate ? filters.startDate : filters.endDate
    const normalizedEndDate =
      filters.startDate <= filters.endDate ? filters.endDate : filters.startDate

    setFilters((current) => ({
      ...current,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
    }))
    setSubmittedFilters({
      ...filters,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
    })
  }

  const handleSendReply = () => {
    if (!replyMessage.trim() || !activeTicket) {
      return
    }

    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === activeTicket.id
          ? {
              ...ticket,
              messages: [
                ...ticket.messages,
                {
                  id: `m-${Date.now()}`,
                  author: 'Program Manager',
                  initials: 'PM',
                  sentAt: '31 Mar, 2026 05:35 PM',
                  text: replyMessage.trim(),
                },
              ],
            }
          : ticket,
      ),
    )
    setReplyMessage('')
  }

  const handleCloseTicket = () => {
    if (!activeTicket) {
      return
    }

    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === activeTicket.id
          ? {
              ...ticket,
              status: 'Closed',
            }
          : ticket,
      ),
    )
    setIsCloseTicketOpen(false)
  }

  const handleReopenTicket = () => {
    if (!activeTicket) {
      return
    }

    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === activeTicket.id
          ? {
              ...ticket,
              status: 'Open',
            }
          : ticket,
      ),
    )
  }

  return (
    <section className="portal-section help-support-page">
      <div className="help-support-page__header">
        <div className="help-support-page__title-block">
          <h1 className="portal-section__title">Help &amp; Support</h1>
          {activeTicket ? (
            <button
              className="help-support-page__back"
              type="button"
              onClick={() => setActiveTicketId('')}
            >
              Back to tickets
            </button>
          ) : null}
        </div>

        <button
          className="help-support-page__ticket-button"
          type="button"
          onClick={() => setIsRaiseTicketOpen(true)}
        >
          Raise a ticket
        </button>
      </div>

      {!activeTicket ? (
        <>
          <div className="help-support-filters">
            <div className="help-support-filters__grid">
              <label className="help-support-field">
                <span>Start Date</span>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, startDate: event.target.value }))
                  }
                />
              </label>

              <label className="help-support-field">
                <span>End Date</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, endDate: event.target.value }))
                  }
                />
              </label>

              <label className="help-support-field">
                <span>Ticket Status</span>
                <select
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="help-support-submit"
                type="button"
                onClick={handleFilterSubmit}
              >
                Submit
              </button>
            </div>
          </div>

          <div className="help-support-table-card">
            <div className="help-support-table-card__toolbar">
              <label className="help-support-search">
                <input
                  type="search"
                  placeholder="Enter Username"
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, search: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="help-support-table-wrapper">
              <table className="help-support-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Raised On</th>
                    <th>Number</th>
                    <th>Operation</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.length ? (
                    filteredTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{ticket.transactionId}</td>
                        <td>{ticket.raisedOn}</td>
                        <td>{ticket.number}</td>
                        <td>{ticket.operation}</td>
                        <td>
                          <span className={getStatusClassName(ticket.status)}>{ticket.status}</span>
                        </td>
                        <td>
                          <button
                            className="help-support-table__link"
                            type="button"
                            onClick={() => setActiveTicketId(ticket.id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="help-support-table__empty" colSpan="6">
                        No tickets found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="help-support-table-card__footer">
              <div className="help-support-table-card__meta">
                <span>Row per page</span>
                <select defaultValue="10">
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <span>Go to</span>
                <input defaultValue="1" type="text" />
              </div>

              <div className="help-support-pagination">
                <button type="button">&lt;</button>
                <button type="button">1</button>
                <button type="button">...</button>
                <button type="button">4</button>
                <button type="button">5</button>
                <button className="is-active" type="button">
                  6
                </button>
                <button type="button">7</button>
                <button type="button">8</button>
                <button type="button">...</button>
                <button type="button">50</button>
                <button type="button">&gt;</button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="help-support-detail-card">
            <div className="help-support-detail-card__header">
              <strong>Ticket ID: {activeTicket.id}</strong>

              {activeTicket.status === 'Closed' ? (
                <button
                  className="help-support-detail-card__success"
                  type="button"
                  onClick={handleReopenTicket}
                >
                  Reopen
                </button>
              ) : (
                <button
                  className="help-support-detail-card__neutral"
                  type="button"
                  onClick={() => setIsCloseTicketOpen(true)}
                >
                  Close Ticket
                </button>
              )}
            </div>

            <div className="help-support-detail-card__grid">
              <div>
                <span>Reason Type</span>
                <strong>{activeTicket.reasonType}</strong>
              </div>
              <div>
                <span>Transaction ID</span>
                <strong>{activeTicket.transactionId}</strong>
              </div>
              <div>
                <span>Description</span>
                <p>{activeTicket.description}</p>
              </div>
              <div>
                <span>Raised Date</span>
                <strong>01 Mar, 2024</strong>
              </div>
              <div>
                <span>Status</span>
                <strong className={getStatusClassName(activeTicket.status)}>{activeTicket.status}</strong>
              </div>
            </div>
          </div>

          <div className="help-support-messages-card">
            <div className="help-support-messages-card__header">Messages</div>

            <div className="help-support-messages-card__older">
              <button type="button">Show Older Messages</button>
            </div>

            <div className="help-support-thread">
              {activeTicket.messages.map((message) => (
                <article className="help-support-message" key={message.id}>
                  <div className="help-support-message__avatar">{message.initials}</div>
                  <div className="help-support-message__body">
                    <strong>{message.author}</strong>
                    <span>{message.sentAt}</span>
                    <p>{message.text}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="help-support-reply">
              <input
                type="text"
                placeholder="Reply here..."
                value={replyMessage}
                onChange={(event) => setReplyMessage(event.target.value)}
              />
              <button type="button" onClick={handleSendReply}>
                &gt;
              </button>
            </div>
          </div>
        </>
      )}

      {isRaiseTicketOpen ? (
        <div className="help-support-modal-overlay" role="presentation">
          <div className="help-support-modal" role="dialog" aria-modal="true">
            <div className="help-support-modal__header">Raise a Query</div>

            <form className="help-support-modal__body" onSubmit={handleRaiseTicketSubmit}>
              <label className="help-support-field">
                <span>Reason</span>
                <select
                  value={raiseForm.reason}
                  onChange={(event) =>
                    setRaiseForm((current) => ({ ...current, reason: event.target.value }))
                  }
                  required
                >
                  <option value="">Please Select Reason</option>
                  {reasonOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="help-support-field">
                <span>Transaction ID</span>
                <input
                  type="text"
                  placeholder="Enter the Transaction ID"
                  value={raiseForm.transactionId}
                  onChange={(event) =>
                    setRaiseForm((current) => ({
                      ...current,
                      transactionId: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="help-support-field">
                <span>Description</span>
                <textarea
                  placeholder="Any additional details..."
                  value={raiseForm.description}
                  onChange={(event) =>
                    setRaiseForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="help-support-field">
                <span>Attachment</span>
                <label className="help-support-attachment">
                  <input
                    type="file"
                    onChange={(event) =>
                      setRaiseForm((current) => ({
                        ...current,
                        attachmentName: event.target.files?.[0]?.name ?? '',
                      }))
                    }
                  />
                  <span>{raiseForm.attachmentName || 'Please Add Attachment'}</span>
                </label>
              </label>

              <div className="help-support-modal__actions">
                <button
                  className="help-support-modal__cancel"
                  type="button"
                  onClick={() => {
                    setRaiseForm(initialRaiseForm)
                    setIsRaiseTicketOpen(false)
                  }}
                >
                  Cancel
                </button>
                <button className="help-support-modal__submit" type="submit">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isCloseTicketOpen && activeTicket ? (
        <div className="help-support-modal-overlay" role="presentation">
          <div className="help-support-modal help-support-modal--compact" role="dialog" aria-modal="true">
            <div className="help-support-modal__header">Close Ticket?</div>

            <div className="help-support-modal__body">
              <div className="help-support-close-summary">
                <div>
                  <span>Ticket ID</span>
                  <strong>{activeTicket.id}</strong>
                </div>
                <div>
                  <span>Reason Type</span>
                  <strong>{activeTicket.reasonType}</strong>
                </div>
                <div>
                  <span>Raised Date</span>
                  <strong>01 Mar, 2024</strong>
                </div>
                <div>
                  <span>Transaction ID</span>
                  <strong>{activeTicket.transactionId}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong className={getStatusClassName(activeTicket.status)}>{activeTicket.status}</strong>
                </div>
              </div>

              <div className="help-support-modal__actions">
                <button
                  className="help-support-modal__cancel"
                  type="button"
                  onClick={() => setIsCloseTicketOpen(false)}
                >
                  Cancel
                </button>
                <button className="help-support-modal__danger" type="button" onClick={handleCloseTicket}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
