import { useEffect, useMemo, useState } from 'react'
import { authStorageKeys } from '../../config/authConfig'
import { apiConfig } from '../../config/apiConfig'
import { LoaderOverlay } from '../../components/ui/LoaderOverlay'
import { Snackbar } from '../../components/ui/Snackbar'

// List of months for monthly filter dropdown
const monthlyOptions = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Table column configuration (key -> API field, label -> UI header)
const reportColumns = [
  { key: 'Account_Number', label: 'Account Number' },
  { key: 'VPA_ID', label: 'VPA ID' },
  { key: 'Date_&_Time', label: 'Date & Time' },
  { key: 'Transaction_Amount', label: 'Transaction Amount' },
  { key: 'Transaction_Id', label: 'Transaction ID' },
  { key: 'RRN', label: 'RRN' },
]

const excelExportColumns = [
  { key: 'serialNumber', label: 'S. No.', type: 'Number' },
  { key: 'Account_Number', label: 'Account Number', type: 'String' },
  { key: 'VPA_ID', label: 'VPA ID', type: 'String' },
  { key: 'Date_&_Time', label: 'Date & Time', type: 'String' },
  { key: 'Transaction_Amount', label: 'Transaction Amount', type: 'Number' },
  { key: 'Transaction_Id', label: 'Transaction ID', type: 'String' },
  { key: 'RRN', label: 'RRN', type: 'String' },
]

// Convert YYYY-MM-DD → DD/MM/YYYY (API expected format)
function formatDateForApi(dateValue) {
  if (!dateValue) {
    return ''
  }

  const [year, month, day] = dateValue.split('-')
  if (!year || !month || !day) {
    return ''
  }

  return `${day}/${month}/${year}`
}

// Get today's date in input[type=date] format
function getTodayInputValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Format Date object → YYYY-MM-DD
function formatInputDate(dateValue) {
  const year = dateValue.getFullYear()
  const month = String(dateValue.getMonth() + 1).padStart(2, '0')
  const day = String(dateValue.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Get start & end date for selected month (current year)
function getMonthDateRange(monthName) {
  const monthIndex = monthlyOptions.indexOf(monthName)

  if (monthIndex < 0) {
    return null
  }

  const today = new Date()
  const currentYear = today.getFullYear()
  const isCurrentMonth = monthIndex === today.getMonth()

  return {
    startDate: formatInputDate(new Date(currentYear, monthIndex, 1)),
    endDate: isCurrentMonth
      ? formatInputDate(today)
      : formatInputDate(new Date(currentYear, monthIndex + 1, 0)),
  }
}

// Fetch user details from sessionStorage and normalize structure
function getStoredUserDetailsRecord() {
  const storedUserDetails = window.sessionStorage.getItem(authStorageKeys.userDetails)

  if (!storedUserDetails) {
    return null
  }

  try {
    const parsedUserDetails = JSON.parse(storedUserDetails)

    if (Array.isArray(parsedUserDetails)) {
      return parsedUserDetails[0] ?? null
    }

    if (parsedUserDetails?.data && Array.isArray(parsedUserDetails.data)) {
      return parsedUserDetails.data[0] ?? null
    }

    return parsedUserDetails
  } catch (error) {
    console.error('[Reports] Failed to parse stored user details', error)
    return null
  }
}

// Ensure rows is always an array
function normalizeReportRows(rows) {
  return Array.isArray(rows) ? rows : []
}

// Extract meaningful error message
function getErrorMessage(error, fallbackMessage) {
  return error?.statusDescription || error?.message || fallbackMessage
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getExcelCellXml(value, type) {
  if (type === 'Number') {
    const numericValue = Number(value)

    if (Number.isFinite(numericValue)) {
      return `<Data ss:Type="Number">${numericValue}</Data>`
    }
  }

  return `<Data ss:Type="String">${escapeXml(value)}</Data>`
}

// Download report as Excel workbook XML so Excel preserves text values like account number and RRN.
function downloadReportRowsAsExcel(rows) {
  if (!rows.length) {
    return false
  }

  const headerRow = excelExportColumns
    .map((column) => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`)
    .join('')

  const dataRows = rows
    .map(
      (row, index) =>
        `<Row>${excelExportColumns
          .map((column) => {
            const cellValue =
              column.key === 'serialNumber' ? index + 1 : row?.[column.key] ?? '-'
            return `<Cell ss:StyleID="${column.type === 'Number' ? 'cell' : 'text'}">${getExcelCellXml(cellValue, column.type)}</Cell>`
          })
          .join('')}</Row>`,
    )
    .join('')

  const workbookContent = `<?xml version="1.0"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook
      xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
    >
      <Styles>
        <Style ss:ID="header">
          <Font ss:Bold="1" />
        </Style>
        <Style ss:ID="text">
          <NumberFormat ss:Format="@" />
        </Style>
        <Style ss:ID="cell" />
      </Styles>
      <Worksheet ss:Name="Reports">
        <Table>
          <Row>${headerRow}</Row>
          ${dataRows}
        </Table>
      </Worksheet>
    </Workbook>
  `

  const blob = new Blob([workbookContent], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  })

  const downloadUrl = window.URL.createObjectURL(blob)
  const downloadLink = document.createElement('a')
  downloadLink.href = downloadUrl
  downloadLink.download = 'idbi-reports.xls'

  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)

  window.URL.revokeObjectURL(downloadUrl)
  return true
}

// API call to fetch reports
async function fetchReports({ startDate, endDate, vpaId }) {
  const response = await fetch(apiConfig.reportsQuerySubmitUserEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      vpa_id: vpaId,
      mode: 'both',
    }),
  })

  const responseData = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(
      responseData?.statusDescription ||
      responseData?.message ||
      `API request failed with status ${response.status}`,
    )
    error.statusDescription = responseData?.statusDescription ?? ''
    throw error
  }

  return responseData
}

export function ReportsPage() {
  // Initial values
  const todayInputValue = useMemo(() => getTodayInputValue(), [])
  const currentMonthIndex = useMemo(() => new Date().getMonth(), [])

  // Filter states
  const [filterType, setFilterType] = useState('custom')
  const [searchValue, setSearchValue] = useState('')
  const [monthlySelection, setMonthlySelection] = useState(monthlyOptions[0])

  // Pagination states
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [goToPageInput, setGoToPageInput] = useState('1')

  // Date filters
  const [startDate, setStartDate] = useState(todayInputValue)
  const [endDate, setEndDate] = useState(todayInputValue)

  // API response states
  const [reportResponse, setReportResponse] = useState(null)
  const [reportRows, setReportRows] = useState([])
  const [isFetchingReports, setIsFetchingReports] = useState(false)

  // Snackbar
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    autoClose: true,
    colorType: 'danger',
  })

  // -----------------------------
  // Fetch Reports
  // -----------------------------
  const loadReports = async ({ nextStartDate, nextEndDate }) => {
    const userDetailsRecord = getStoredUserDetailsRecord()
    const vpaId = userDetailsRecord?.vpa_id ?? ''

    if (!vpaId) {
      setReportResponse(null)
      setReportRows([])
      setSnackbarState({
        open: true,
        message: 'Unable to fetch reports',
        autoClose: true,
        colorType: 'danger',
      })
      return
    }

    try {
      setIsFetchingReports(true)

      const response = await fetchReports({
        startDate: formatDateForApi(nextStartDate),
        endDate: formatDateForApi(nextEndDate),
        vpaId,
      })

      console.log('[Reports] querysubmit_user response', response)
      setReportResponse(response)
      setReportRows(normalizeReportRows(response?.data))

      // Reset pagination
      setCurrentPage(1)
      setGoToPageInput('1')
    } catch (error) {
      console.error('[Reports] Failed to fetch reports', error)
      setReportResponse(null)
      setReportRows([])
      setSnackbarState({
        open: true,
        message: getErrorMessage(error, 'Unable to fetch reports'),
        autoClose: true,
        colorType: 'danger',
      })
    } finally {
      setIsFetchingReports(false)
    }
  }

  // Auto-fetch for "Today"
  useEffect(() => {
    if (filterType !== 'today') {
      return
    }

    setStartDate(todayInputValue)
    setEndDate(todayInputValue)

    loadReports({
      nextStartDate: todayInputValue,
      nextEndDate: todayInputValue,
    })
  }, [filterType, todayInputValue])

  // Search filtering
  const filteredRows = useMemo(() => {
    const term = searchValue.trim().toLowerCase()

    if (!term) {
      return reportRows
    }

    return reportRows.filter((row) =>
      reportColumns.some(({ key }) => String(row?.[key] ?? '').toLowerCase().includes(term)),
    )
  }, [reportRows, searchValue])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchValue, rowsPerPage, reportRows])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
      return
    }

    setGoToPageInput(String(currentPage))
  }, [currentPage, totalPages])

  // Get current page rows
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return filteredRows.slice(startIndex, startIndex + rowsPerPage)
  }, [currentPage, filteredRows, rowsPerPage])

  // Pagination UI logic
  const paginationItems = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 'ellipsis', totalPages]
    }

    if (currentPage >= totalPages - 2) {
      return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, 'ellipsis-left', currentPage, 'ellipsis-right', totalPages]
  }, [currentPage, totalPages])

  // -----------------------------
  // Handlers
  // -----------------------------
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) {
      return
    }

    setCurrentPage(page)
  }

  const handleGoToPageBlur = () => {
    const nextPage = Number(goToPageInput)

    if (Number.isNaN(nextPage)) {
      setGoToPageInput(String(currentPage))
      return
    }

    handlePageChange(nextPage)
  }

  const handleCustomSubmit = () => {
    if (!startDate || !endDate) {
      setSnackbarState({
        open: true,
        message: 'Select both start date and end date',
        autoClose: true,
        colorType: 'warning',
      })
      return
    }

    loadReports({
      nextStartDate: startDate,
      nextEndDate: endDate,
    })
  }

  const handleMonthlySubmit = () => {
    const monthDateRange = getMonthDateRange(monthlySelection)

    if (!monthDateRange) {
      setSnackbarState({
        open: true,
        message: 'Select a valid month',
        autoClose: true,
        colorType: 'warning',
      })
      return
    }

    setStartDate(monthDateRange.startDate)
    setEndDate(monthDateRange.endDate)

    loadReports({
      nextStartDate: monthDateRange.startDate,
      nextEndDate: monthDateRange.endDate,
    })
  }

  const handleDownloadAll = () => {
    const hasDownloaded = downloadReportRowsAsExcel(reportRows)

    if (!hasDownloaded) {
      setSnackbarState({
        open: true,
        message: 'No report data available to download',
        autoClose: true,
        colorType: 'warning',
      })
    }
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    // UI remains unchanged (only comments added above)
    <section className="portal-section reports-page">
          {/* Loader for API calls */}
      <LoaderOverlay open={isFetchingReports} text="IDBI Bank Loading........" />

      {/* Snackbar for error/warning messages */}
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

      <h1 className="portal-section__title">Transaction Reports</h1>

      {/* -----------------------------
          Filter Section (Today / Monthly / Custom)
      ----------------------------- */}
      <div className="reports-filter-card">
        <p className="reports-filter-card__label">Select a Report Filter</p>

        {/* Radio buttons for filter selection */}
        <div className="reports-filter-card__options">
          <label className="reports-radio">
            <input
              checked={filterType === 'today'}
              name="report-filter"
              type="radio"
              onChange={() => setFilterType('today')}
            />
            <span>Today</span>
          </label>

          <label className="reports-radio">
            <input
              checked={filterType === 'monthly'}
              name="report-filter"
              type="radio"
              onChange={() => setFilterType('monthly')}
            />
            <span>Monthly</span>
          </label>

          <label className="reports-radio">
            <input
              checked={filterType === 'custom'}
              name="report-filter"
              type="radio"
              onChange={() => setFilterType('custom')}
            />
            <span>Custom Range</span>
          </label>
        </div>

        {/* Show controls only if NOT "Today" */}
        {filterType !== 'today' ? (
          <div className="reports-filter-card__controls">

            {/* Monthly dropdown */}
            {filterType === 'monthly' ? (
              <label className="reports-input-group reports-input-group--wide">
                <span>Monthly Range</span>
                <select
                  value={monthlySelection}
                  onChange={(event) => setMonthlySelection(event.target.value)}
                >
                  {monthlyOptions.map((option, index) => (
                    <option key={option} value={option} disabled={index > currentMonthIndex}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                {/* Custom Date Range */}
                <label className="reports-input-group">
                  <span>Start Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </label>

                <label className="reports-input-group">
                  <span>End Date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </label>
              </>
            )}

            {/* Submit button */}
            <button
              className="reports-action-button"
              type="button"
              onClick={
                filterType === 'custom'
                  ? handleCustomSubmit
                  : filterType === 'monthly'
                    ? handleMonthlySubmit
                    : undefined
              }
              disabled={filterType !== 'custom' && filterType !== 'monthly'}
            >
              Submit
            </button>
          </div>
        ) : null}
      </div>

      {/* -----------------------------
          Table Section
      ----------------------------- */}
      <div className="reports-table-card">

        {/* Toolbar (Search + Summary + Download) */}
        <div className="reports-table-card__toolbar">
          <label className="reports-search">
            <input
              type="search"
              placeholder="Search here..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </label>

          {/* Summary info */}
          <div className="reports-summary">
            <span>Rows: {reportResponse?.row_count ?? reportRows.length}</span>
            <span>Total Amount: {reportResponse?.total_amount ?? 0}</span>

            {/* Download all rows */}
            <button
              className="reports-action-button reports-action-button--small"
              type="button"
              onClick={handleDownloadAll}
            >
              Download All
            </button>
          </div>
        </div>

        {/* Table Wrapper */}
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                {/* Serial Number Column */}
                <th>S. No.</th>

                {/* Dynamic columns */}
                {reportColumns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedRows.length ? (
                paginatedRows.map((row, index) => (
                  <tr key={`${row.Transaction_Id ?? 'row'}-${index}`}>
                    {/* Serial Number */}
                    <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>

                    {/* Row Data */}
                    {reportColumns.map((column) => (
                      <td key={column.key}>{String(row?.[column.key] ?? '-')}</td>
                    ))}
                  </tr>
                ))
              ) : (
                // Empty State
                <tr>
                  <td colSpan={reportColumns.length + 1} className="reports-table__empty">
                    No report data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* -----------------------------
            Pagination Section
        ----------------------------- */}
        <div className="reports-table-card__footer">

          {/* Pagination Controls */}
          <div className="reports-table-card__meta">
            <span>Row per page</span>

            {/* Rows per page selector */}
            <select
              value={rowsPerPage}
              onChange={(event) => setRowsPerPage(Number(event.target.value))}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>

            {/* Go to page input */}
            <span>Go to</span>
            <input
              type="text"
              value={goToPageInput}
              onChange={(event) => setGoToPageInput(event.target.value)}
              onBlur={handleGoToPageBlur}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleGoToPageBlur()
                }
              }}
            />
          </div>

          {/* Pagination Buttons */}
          <div className="reports-pagination">
            {/* Previous Button */}
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              &lt;
            </button>

            {/* Page Numbers */}
            {paginationItems.map((item, index) =>
              typeof item === 'number' ? (
                <button
                  key={`${item}-${index}`}
                  className={item === currentPage ? 'is-active' : ''}
                  type="button"
                  onClick={() => handlePageChange(item)}
                >
                  {item}
                </button>
              ) : (
                <span key={`${item}-${index}`}>...</span>
              ),
            )}

            {/* Next Button */}
            <button
              type="button"
              aria-label="Next page"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
