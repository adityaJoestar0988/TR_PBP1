import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await api.get('/dashboard/summary')
        setData(res.data.data)
      } catch (err) {
        console.error('Failed to fetch dashboard summary', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

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

  const shortcuts = [
    { label: 'Kategori', path: '/categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
    { label: 'Produk', path: '/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label: 'Bahan Baku', path: '/raw-materials', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { label: 'Pengeluaran', path: '/expenses', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Riwayat Transaksi', path: '/transactions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Arus Kas', path: '/cashflow', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Laporan', path: '/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'Pengaturan', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ]

  const maxRevenue = data?.sales_last_7_days ? Math.max(...data.sales_last_7_days.map(d => d.revenue), 1) : 1

  return (
    <div className="w-full">

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 group hover:border-cyan-500/30 transition-colors">
                <p className="text-xs text-slate-400 mb-1">Penjualan Hari Ini</p>
                <p className="text-xl font-bold text-cyan-400">{formatRupiah(data.today.total_sales)}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 group hover:border-slate-600 transition-colors">
                <p className="text-xs text-slate-400 mb-1">Transaksi</p>
                <p className="text-xl font-bold">{data.today.transaction_count}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 group hover:border-green-500/30 transition-colors">
                <p className="text-xs text-slate-400 mb-1">Cash In</p>
                <p className="text-xl font-bold text-green-400">{formatRupiah(data.today.cash_in)}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 group hover:border-red-500/30 transition-colors">
                <p className="text-xs text-slate-400 mb-1">Cash Out</p>
                <p className="text-xl font-bold text-red-400">{formatRupiah(data.today.cash_out)}</p>
              </div>
              <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 group transition-colors ${data.today.saldo < 0 ? 'hover:border-red-500/30' : 'hover:border-cyan-500/30'}`}>
                <p className="text-xs text-slate-400 mb-1">Saldo</p>
                <p className={`text-xl font-bold ${data.today.saldo < 0 ? 'text-red-400' : 'text-cyan-400'}`}>{formatRupiah(data.today.saldo)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 7-Day Sales Chart */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="font-bold mb-4">Tren Penjualan 7 Hari Terakhir</h2>
                <div className="flex items-end gap-2 h-40">
                  {data.sales_last_7_days.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {day.revenue > 0 ? formatRupiah(day.revenue) : ''}
                      </span>
                      <div 
                        className="w-full bg-cyan-500/20 hover:bg-cyan-500/40 rounded-t-md transition-colors relative group"
                        style={{ height: `${Math.max((day.revenue / maxRevenue) * 100, 4)}%` }}
                      >
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-cyan-500 rounded-t-md transition-all"
                          style={{ height: '100%', opacity: 0.7 }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(day.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Stock Alert */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Stok Menipis
                  </h2>
                  <button 
                    onClick={() => navigate('/reports', { state: { tab: 'stock' } })}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Lihat semua →
                  </button>
                </div>
                {data.low_stock_products.length === 0 ? (
                  <p className="text-slate-500 text-sm py-6 text-center">Semua stok aman 👍</p>
                ) : (
                  <div className="space-y-3">
                    {data.low_stock_products.map(product => (
                      <div key={product.id} className="flex items-center justify-between bg-slate-950/50 rounded-xl px-4 py-3 border border-slate-800">
                        <span className="text-sm font-medium text-slate-200 truncate mr-2">{product.name}</span>
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0">
                          {product.stock}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Shortcuts */}
            <div>
              <h2 className="font-bold mb-4">Menu Cepat</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {shortcuts.map(shortcut => (
                  <button
                    key={shortcut.path}
                    onClick={() => navigate(shortcut.path)}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all group flex flex-col items-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-cyan-500/10 flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={shortcut.icon} />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">{shortcut.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}