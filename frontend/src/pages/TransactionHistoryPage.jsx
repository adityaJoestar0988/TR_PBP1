import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import ReceiptView from '../components/ReceiptView'

export default function TransactionHistoryPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  
  // Settings for methods & receipt
  const [storeSettings, setStoreSettings] = useState(null)
  
  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get('/pos/settings')
        setStoreSettings(res.data.data)
      } catch (err) {
        console.error('Failed to fetch settings', err)
      }
    }
    fetchSettings()
  }, [])

  const fetchTransactions = async (page = 1) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const params = { page }
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      if (paymentMethod) params.payment_method = paymentMethod

      const res = await api.get('/transactions', { params })
      setTransactions(res.data.data.data)
      setCurrentPage(res.data.data.current_page)
      setTotalPages(res.data.data.last_page)
    } catch (err) {
      console.error('Failed to fetch transactions', err)
      setErrorMsg('Gagal memuat riwayat transaksi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [startDate, endDate, paymentMethod])

  const openDetail = async (id) => {
    setDetailLoading(true)
    setSelectedTransaction(null)
    setErrorMsg('')
    try {
      const res = await api.get(`/transactions/${id}`)
      setSelectedTransaction(res.data.data)
    } catch (err) {
        const msg = err.response?.data?.message || 'Gagal memuat detail transaksi.'
        alert(msg)
    } finally {
      setDetailLoading(false)
    }
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="w-full">

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        
        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Dari Tanggal</label>
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Sampai Tanggal</label>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Metode Pembayaran</label>
            <select 
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Semua</option>
              {storeSettings?.payment_methods?.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => {setStartDate(''); setEndDate(''); setPaymentMethod('');}}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors ml-auto"
          >
            Reset Filter
          </button>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/50 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">No. Transaksi</th>
                  <th className="px-6 py-4 font-medium">Waktu</th>
                  {user?.role !== 'kasir' && <th className="px-6 py-4 font-medium">Kasir</th>}
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Metode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                      Tidak ada transaksi ditemukan.
                    </td>
                  </tr>
                ) : (
                  transactions.map(trx => (
                    <tr 
                      key={trx.id} 
                      onClick={() => openDetail(trx.id)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-cyan-400">{trx.transaction_number}</td>
                      <td className="px-6 py-4 text-slate-300">{formatDate(trx.created_at)}</td>
                      {user?.role !== 'kasir' && <td className="px-6 py-4 text-slate-300">{trx.user?.name || '-'}</td>}
                      <td className="px-6 py-4 font-bold">{formatRupiah(trx.total)}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-800 px-2.5 py-1 rounded-md text-xs">{trx.payment_method}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-sm text-slate-400">Halaman {currentPage} dari {totalPages}</span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => fetchTransactions(currentPage - 1)}
                  className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  Prev
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => fetchTransactions(currentPage + 1)}
                  className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Detail / Receipt */}
      {(selectedTransaction || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          {detailLoading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="absolute -right-12 top-0 text-slate-400 hover:text-white transition-colors bg-slate-900 rounded-full p-2 print:hidden"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="max-h-[90vh] overflow-y-auto rounded-xl">
                <ReceiptView transaction={selectedTransaction} settings={storeSettings} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
