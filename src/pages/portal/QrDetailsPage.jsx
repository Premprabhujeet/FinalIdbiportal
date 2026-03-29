import { useEffect, useMemo, useState } from 'react'
import { authStorageKeys } from '../../config/authConfig'
import { apiConfig } from '../../config/apiConfig'
import { LoaderOverlay } from '../../components/ui/LoaderOverlay'
import { Snackbar } from '../../components/ui/Snackbar'
import { apiRequest } from '../../services/apiClient'

const paymentApps = ['CRED', 'navi', 'paytm']
const DYNAMIC_QR_VALIDITY_SECONDS = 60

function formatAmount(amount) {
  return `\u20b9 ${Number(amount || 0).toLocaleString('en-IN')}`
}

function formatCountdown(secondsLeft) {
  const safeSeconds = Math.max(0, secondsLeft)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function toPngDataUrl(base64Image) {
  if (!base64Image || typeof base64Image !== 'string') {
    return ''
  }

  if (base64Image.startsWith('data:image')) {
    return base64Image
  }

  return `data:image/png;base64,${base64Image}`
}

export function QrDetailsPage() {
  const [qrType, setQrType] = useState('static')
  const [amountInput, setAmountInput] = useState('')
  const [generatedAmount, setGeneratedAmount] = useState('')
  const [staticQrImageUrl, setStaticQrImageUrl] = useState('')
  const [showStaticQr, setShowStaticQr] = useState(false)
  const [showDynamicQr, setShowDynamicQr] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(DYNAMIC_QR_VALIDITY_SECONDS)
  const [isFetchingStaticQr, setIsFetchingStaticQr] = useState(false)
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    autoClose: true,
    colorType: 'warning',
  })

  const trimmedAmount = amountInput.trim()
  const numericAmount = Number(trimmedAmount)

  const qrTitle = useMemo(() => {
    return qrType === 'dynamic' ? 'Amount to be Collected' : 'Select The Type Of QR'
  }, [qrType])

  const handleStaticSubmit = async () => {
    const storedUserDetails = window.sessionStorage.getItem(authStorageKeys.userDetails)
    const parsedUserDetails = storedUserDetails ? JSON.parse(storedUserDetails) : null
    const firstUserDetails = Array.isArray(parsedUserDetails)
      ? parsedUserDetails[0] ?? null
      : parsedUserDetails?.data && Array.isArray(parsedUserDetails.data)
        ? parsedUserDetails.data[0] ?? null
        : parsedUserDetails
    const qrString = firstUserDetails?.qr_string ?? ''

    if (!qrString) {
      setSnackbarState({
        open: true,
        message: 'Unable to fetch QR',
        autoClose: true,
        colorType: 'danger',
      })
      setStaticQrImageUrl('')
      setShowStaticQr(false)
      return
    }

    try {
      setIsFetchingStaticQr(true)

      const response = await apiRequest(apiConfig.staticQrEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          qrString,
        }),
      })

      console.log('[QR Details] static QR response', response)
      const base64Image = response?.base64Image ?? response?.data?.base64Image ?? ''

      if (!base64Image) {
        throw new Error('Missing base64Image in QR response')
      }

      window.sessionStorage.setItem(authStorageKeys.staticQrResponse, JSON.stringify(response))
      setStaticQrImageUrl(toPngDataUrl(base64Image))
      setShowStaticQr(true)
    } catch (error) {
      console.error('[QR Details] Failed to fetch static QR', error)
      setSnackbarState({
        open: true,
        message: 'Unable to fetch QR',
        autoClose: true,
        colorType: 'danger',
      })
      setStaticQrImageUrl('')
      setShowStaticQr(false)
    } finally {
      setIsFetchingStaticQr(false)
    }
  }

  const handleDownloadStaticQr = () => {
    if (!staticQrImageUrl) {
      setSnackbarState({
        open: true,
        message: 'Unable to fetch QR',
        autoClose: true,
        colorType: 'danger',
      })
      return
    }

    const downloadLink = document.createElement('a')
    downloadLink.href = staticQrImageUrl
    downloadLink.download = 'idbi-static-qr.png'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  useEffect(() => {
    if (qrType !== 'dynamic' || !showDynamicQr) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId)
          setShowDynamicQr(false)
          setSnackbarState({
            open: true,
            message: 'QR expired generate a new QR',
            autoClose: true,
            colorType: 'warning',
          })
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [qrType, showDynamicQr])

  const handleGenerateQr = () => {
    if (!trimmedAmount) {
      setSnackbarState({
        open: true,
        message: 'Amount is required.',
        autoClose: true,
        colorType: 'warning',
      })
      setShowDynamicQr(false)
      return
    }

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setSnackbarState({
        open: true,
        message: 'Enter a valid amount greater than 0.',
        autoClose: true,
        colorType: 'warning',
      })
      setShowDynamicQr(false)
      return
    }

    setGeneratedAmount(trimmedAmount)
    setSecondsRemaining(DYNAMIC_QR_VALIDITY_SECONDS)
    setShowDynamicQr(true)
  }

  return (
    <section className="portal-section qr-details-page">
      <LoaderOverlay open={isFetchingStaticQr} text="IDBI Bank Loading........" />
      <Snackbar
        open={snackbarState.open}
        message={snackbarState.message}
        autoClose={snackbarState.autoClose}
        colorType={snackbarState.colorType}
        onClose={() =>
          setSnackbarState((current) => ({
            ...current,
            open: false,
          }))
        }
      />

      <h1 className="portal-section__title">QR Details</h1>

      <div className="qr-details-panel">
        <div className="qr-details-panel__header">
          <div>
            <p className="qr-details-panel__label">Select The Type of QR</p>

            <div className="qr-details-toggle">
              <label className="reports-radio">
                <input
                  checked={qrType === 'static'}
                  name="qr-type"
                  type="radio"
                  onChange={() => {
                    setQrType('static')
                    setShowDynamicQr(false)
                  }}
                />
                <span>Static</span>
              </label>

              <label className="reports-radio">
                <input
                  checked={qrType === 'dynamic'}
                  name="qr-type"
                  type="radio"
                  onChange={() => {
                    setQrType('dynamic')
                    setStaticQrImageUrl('')
                    setShowStaticQr(false)
                  }}
                />
                <span>Dynamic</span>
              </label>
            </div>
          </div>

          {qrType === 'static' ? (
            <button className="reports-action-button" type="button" onClick={handleStaticSubmit}>
              Submit
            </button>
          ) : null}
        </div>

        {qrType === 'dynamic' ? (
          <div className="qr-details-controls">
            <p className="qr-details-controls__hint">
              Enter an amount to instantly generate your dynamic QR code
            </p>

            <div className="qr-details-controls__row">
              <label className="qr-details-controls__field">
                <span>Amount to be collected</span>
                <input
                  type="number"
                  min="0"
                  value={amountInput}
                  onChange={(event) => {
                    setAmountInput(event.target.value)
                    setShowDynamicQr(false)
                    setSecondsRemaining(DYNAMIC_QR_VALIDITY_SECONDS)
                  }}
                />
              </label>

              <button
                className="reports-action-button"
                type="button"
                onClick={handleGenerateQr}
              >
                Generate QR
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {(qrType === 'static' && showStaticQr) || showDynamicQr ? (
        <div className="qr-preview-card">
        <div className="qr-preview-card__inner">
          <p className="qr-preview-card__eyebrow">{qrTitle}</p>
          {qrType === 'dynamic' ? (
            <strong className="qr-preview-card__amount">{formatAmount(generatedAmount)}</strong>
          ) : null}

          <div className={`qr-ticket${qrType === 'static' ? ' qr-ticket--static' : ''}`}>
            {qrType === 'static' ? (
              <img className="qr-ticket__image" src={staticQrImageUrl} alt="Static merchant QR code" />
            ) : null}

            {qrType === 'dynamic' ? (
              <>
                <div className="qr-ticket__merchant">KRIPA SINDHU PAIRA</div>
                <div className="qr-ticket__subtitle">Scan &amp; Pay</div>

                <div className="qr-ticket__code" aria-hidden="true">
                  <span className="qr-ticket__finder qr-ticket__finder--top-left" />
                  <span className="qr-ticket__finder qr-ticket__finder--top-right" />
                  <span className="qr-ticket__finder qr-ticket__finder--bottom-left" />
                </div>

                <div className="qr-ticket__upi">UPI Id: 20250602000094.iserveuprsbrp@cbin</div>

                <div className="qr-ticket__brands">
                  <span>BHIM</span>
                  <span>UPI</span>
                </div>

                <div className="qr-ticket__payments">
                  <span>Cent ez</span>
                  <span>PhonePe</span>
                  <span>G Pay</span>
                </div>

                <div className="qr-ticket__payments qr-ticket__payments--secondary">
                  {paymentApps.map((app) => (
                    <span key={app}>{app}</span>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {qrType === 'dynamic' ? (
            <p className="qr-preview-card__validity">
              Valid till {formatCountdown(secondsRemaining)}
            </p>
          ) : (
            <button
              className="reports-action-button reports-action-button--small"
              type="button"
              onClick={handleDownloadStaticQr}
            >
              Download QR
            </button>
          )}
        </div>
        </div>
      ) : null}
    </section>
  )
}
