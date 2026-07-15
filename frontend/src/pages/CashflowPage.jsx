import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import PeriodFilter from '../components/PeriodFilter'

export default function CashflowPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Filters
  const [periodType, setPeriodType] = useState('monthly')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Data
  const [summary, setSummary] = useState({ total_cash_in: 0, total_cash_out: 0, saldo: 0 })
  const [ledger, setLedger] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  // Handlers
  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
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
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const getSourceLabel = (type) => {
    switch (type) {
      case 'transaction': return 'Penjualan'
      case 'expense': return 'Pengeluaran'
      default: return type
    }
  }

  const getEffectiveDates = () => {
      if (periodType === 'daily') {
          return { start_date: date, end_date: date };
      } else if (periodType === 'monthly') {
          const d = new Date(year, month, 0); // last day of month
          const start_date = `${year}-${String(month).padStart(2, '0')}-01`;
          const end_date = `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return { start_date, end_date };
      } else {
          return { start_date: startDate, end_date: endDate };
      }
  }

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
        const summaryParams = { period: periodType }
        if (periodType === 'daily') summaryParams.date = date;
        if (periodType === 'monthly') {
            summaryParams.month = month;
            summaryParams.year = year;
        }
        if (periodType === 'custom') {
            summaryParams.start_date = startDate;
            summaryParams.end_date = endDate;
        }
        
        const { start_date, end_date } = getEffectiveDates();
        const ledgerParams = { page, start_date, end_date };
        if (typeFilter) ledgerParams.type = typeFilter;

        const [summaryRes, ledgerRes] = await Promise.all([
            api.get('/cashflow/summary', { params: summaryParams }),
            api.get('/cashflow', { params: ledgerParams })
        ]);

        setSummary(summaryRes.data.data);
        setLedger(ledgerRes.data.data.data);
        setCurrentPage(ledgerRes.data.data.current_page);
        setTotalPages(ledgerRes.data.data.last_page);
    } catch (err) {
        console.error('Failed to fetch cashflow data', err);
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    if (periodType === 'custom' && (!startDate || !endDate)) return;
    fetchData(1) // reset to page 1 on filter change
  }, [periodType, date, month, year, startDate, endDate, typeFilter])


  return (
    <div className="w-full">

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        
        <PeriodFilter 
          periodType={periodType} setPeriodType={setPeriodType}
          date={date} setDate={setDate}
          month={month} setMonth={setMonth}
          year={year} setYear={setYear}
          startDate={startDate} setStartDate={setStartDate}
          endDate={endDate} setEndDate={setEndDate}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-green-500/30 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
            <p className="text-slate-400 text-sm font-medium mb-1">Total Uang Masuk</p>
            <h3 className="text-3xl font-bold text-green-400">{formatRupiah(summary.total_cash_in)}</h3>
            <div className="mt-4 flex items-center text-xs text-green-500 bg-green-500/10 w-fit px-2 py-1 rounded-md">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Pemasukan
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-red-500/30 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors"></div>
            <p className="text-slate-400 text-sm font-medium mb-1">Total Uang Keluar</p>
            <h3 className="text-3xl font-bold text-red-400">{formatRupiah(summary.total_cash_out)}</h3>
            <div className="mt-4 flex items-center text-xs text-red-500 bg-red-500/10 w-fit px-2 py-1 rounded-md">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
              Pengeluaran
            </div>
          </div>

          <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group transition-colors ${summary.saldo < 0 ? 'hover:border-red-500/30' : 'hover:border-cyan-500/30'}`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-colors ${summary.saldo < 0 ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-cyan-500/10 group-hover:bg-cyan-500/20'}`}></div>
            <p className="text-slate-400 text-sm font-medium mb-1">Saldo Bersih</p>
            <h3 className={`text-3xl font-bold ${summary.saldo < 0 ? 'text-red-400' : 'text-cyan-400'}`}>
              {formatRupiah(summary.saldo)}
            </h3>
            <div className={`mt-4 flex items-center text-xs w-fit px-2 py-1 rounded-md ${summary.saldo < 0 ? 'text-red-500 bg-red-500/10' : 'text-cyan-500 bg-cyan-500/10'}`}>
              {summary.saldo < 0 ? 'Defisit' : 'Surplus'}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="font-bold text-lg">Buku Kas (Ledger)</h2>
            <select 
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Semua Transaksi</option>
              <option value="in">Uang Masuk</option>
              <option value="out">Uang Keluar</option>
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium">Tipe</th>
                  <th className="px-6 py-4 font-medium">Sumber</th>
                  <th className="px-6 py-4 font-medium">Harga Satuan</th>
                  <th className="px-6 py-4 font-medium">Qty</th>
                  <th className="px-6 py-4 font-medium">Deskripsi</th>
                  <th className="px-6 py-4 font-medium text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : ledger.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-slate-500">
                      Tidak ada pergerakan kas di periode ini.
                    </td>
                  </tr>
                ) : (
                  ledger.map(row => (
                    <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-slate-300">{formatDate(row.date)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                          row.type === 'in' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {row.type === 'in' ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{getSourceLabel(row.source_type)}</td>
                      <td className="px-6 py-4 text-slate-300">{row.unit_price ? formatRupiah(row.unit_price) : '-'}</td>
                      <td className="px-6 py-4 text-slate-300">{row.quantity || '-'}</td>
                      <td className="px-6 py-4 text-slate-300 max-w-md truncate">{row.description}</td>
                      <td className={`px-6 py-4 font-bold text-right ${
                        row.type === 'in' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {row.type === 'in' ? '+' : '-'}{formatRupiah(row.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/30">
              <span className="text-sm text-slate-400">Halaman {currentPage} dari {totalPages}</span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => fetchData(currentPage - 1)}
                  className="px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm"
                >
                  Prev
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => fetchData(currentPage + 1)}
                  className="px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
