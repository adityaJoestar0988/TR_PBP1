import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import PeriodFilter from '../components/PeriodFilter'

export default function ReportsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Tabs
  const [activeTab, setActiveTab] = useState('sales') // sales, raw-materials, stock, cashflow, profit-loss

  // Period Filter State
  const [periodType, setPeriodType] = useState('monthly')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Report Data State
  const [salesData, setSalesData] = useState(null)
  const [rawMaterialData, setRawMaterialData] = useState(null)
  const [stockData, setStockData] = useState(null)
  const [profitLossData, setProfitLossData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Sub-filters
  const [stockCategory, setStockCategory] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [categories, setCategories] = useState([])

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

  const fetchReport = async () => {
    if (activeTab === 'cashflow') return; // Cashflow handled by external page
    
    setLoading(true)
    try {
        const params = getEffectiveDates()
        
        if (activeTab === 'sales') {
            const res = await api.get('/reports/sales', { params })
            setSalesData(res.data.data)
        } else if (activeTab === 'raw-materials') {
            const res = await api.get('/reports/raw-material-purchases', { params })
            setRawMaterialData(res.data.data)
        } else if (activeTab === 'profit-loss') {
            const res = await api.get('/reports/profit-loss', { params })
            setProfitLossData(res.data.data)
        } else if (activeTab === 'stock') {
            // Fetch categories if empty
            if (categories.length === 0) {
                const catRes = await api.get('/pos/categories') // Using the POS category endpoint as it is read-only public
                setCategories(catRes.data.data)
            }
            const stockParams = {}
            if (stockCategory) stockParams.category_id = stockCategory;
            if (lowStockOnly) stockParams.low_stock_only = true;
            
            const res = await api.get('/reports/stock', { params: stockParams })
            setStockData(res.data.data)
        }
    } catch (err) {
        console.error('Failed to fetch report', err)
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    if (periodType === 'custom' && (!startDate || !endDate) && activeTab !== 'stock') return;
    fetchReport()
  }, [activeTab, periodType, date, month, year, startDate, endDate, stockCategory, lowStockOnly])


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

  return (
    <div className="w-full">

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-800">
            {[
                { id: 'sales', label: 'Penjualan' },
                { id: 'raw-materials', label: 'Pembelian Bahan Baku' },
                { id: 'stock', label: 'Stok Produk' },
                { id: 'profit-loss', label: 'Laba Rugi' },
                { id: 'cashflow', label: 'Arus Kas' },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap px-6 py-3 font-medium transition-all border-b-2 ${
                        activeTab === tab.id 
                            ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' 
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Period Filter (Hidden for Stock and Cashflow) */}
        {activeTab !== 'stock' && activeTab !== 'cashflow' && (
            <PeriodFilter 
                periodType={periodType} setPeriodType={setPeriodType}
                date={date} setDate={setDate}
                month={month} setMonth={setMonth}
                year={year} setYear={setYear}
                startDate={startDate} setStartDate={setStartDate}
                endDate={endDate} setEndDate={setEndDate}
            />
        )}

        {loading && (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        )}

        {/* 1. Laporan Penjualan */}
        {!loading && activeTab === 'sales' && salesData && (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <p className="text-slate-400 text-sm font-medium mb-1">Total Pendapatan</p>
                        <h3 className="text-3xl font-bold text-cyan-400">{formatRupiah(salesData.total_revenue)}</h3>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <p className="text-slate-400 text-sm font-medium mb-1">Jumlah Transaksi</p>
                        <h3 className="text-3xl font-bold text-white">{salesData.total_transactions}</h3>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <p className="text-slate-400 text-sm font-medium mb-1">Produk Terjual</p>
                        <h3 className="text-3xl font-bold text-white">{salesData.total_items_sold} <span className="text-sm font-normal text-slate-500">item</span></h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* By Product Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-800">
                            <h2 className="font-bold">Penjualan per Produk</h2>
                        </div>
                        <div className="overflow-auto max-h-96 custom-scrollbar">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-950/50 text-slate-400 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Produk</th>
                                        <th className="px-4 py-3 font-medium text-right">Terjual</th>
                                        <th className="px-4 py-3 font-medium text-right">Pendapatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {salesData.by_product.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/30">
                                            <td className="px-4 py-3 font-medium text-slate-200">{item.product_name}</td>
                                            <td className="px-4 py-3 text-right">{item.quantity_sold}</td>
                                            <td className="px-4 py-3 text-right font-medium text-cyan-400">{formatRupiah(item.revenue)}</td>
                                        </tr>
                                    ))}
                                    {salesData.by_product.length === 0 && <tr><td colSpan="3" className="text-center py-6 text-slate-500">Belum ada penjualan</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* By Day Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-800">
                            <h2 className="font-bold">Tren Harian</h2>
                        </div>
                        <div className="overflow-auto max-h-96 custom-scrollbar">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-950/50 text-slate-400 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Tanggal</th>
                                        <th className="px-4 py-3 font-medium text-right">Transaksi</th>
                                        <th className="px-4 py-3 font-medium text-right">Pendapatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {salesData.by_day.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/30">
                                            <td className="px-4 py-3 text-slate-300">{formatDate(item.date)}</td>
                                            <td className="px-4 py-3 text-right">{item.transaction_count}</td>
                                            <td className="px-4 py-3 text-right text-cyan-400">{formatRupiah(item.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* 2. Laporan Pembelian Bahan Baku */}
        {!loading && activeTab === 'raw-materials' && rawMaterialData && (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <p className="text-slate-400 text-sm font-medium mb-1">Total Pengeluaran Bahan Baku</p>
                        <h3 className="text-3xl font-bold text-red-400">{formatRupiah(rawMaterialData.total_purchases)}</h3>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <p className="text-slate-400 text-sm font-medium mb-1">Frekuensi Pembelian</p>
                        <h3 className="text-3xl font-bold text-white">{rawMaterialData.total_transactions} <span className="text-sm font-normal text-slate-500">kali</span></h3>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-800">
                        <h2 className="font-bold">Pembelian per Bahan Baku</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-950/50 text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Nama Bahan Baku</th>
                                    <th className="px-6 py-4 font-medium text-right">Frekuensi Pembelian</th>
                                    <th className="px-6 py-4 font-medium text-right">Total Biaya</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {rawMaterialData.by_raw_material.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30">
                                        <td className="px-6 py-4 font-medium text-slate-200">{item.raw_material_name}</td>
                                        <td className="px-6 py-4 text-right">{item.purchase_count} kali</td>
                                        <td className="px-6 py-4 text-right font-medium text-red-400">{formatRupiah(item.total_amount)}</td>
                                    </tr>
                                ))}
                                {rawMaterialData.by_raw_material.length === 0 && <tr><td colSpan="3" className="text-center py-6 text-slate-500">Belum ada pembelian bahan baku</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* 3. Laporan Stok Produk */}
        {!loading && activeTab === 'stock' && stockData && (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-xl text-sm flex gap-2 items-center">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Laporan stok adalah gambaran real-time (saat ini) dan tidak terpengaruh oleh filter rentang tanggal.
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-end flex-wrap">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Kategori</label>
                        <select 
                            value={stockCategory}
                            onChange={e => setStockCategory(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2">
                        <input 
                            type="checkbox" 
                            id="lowStock"
                            checked={lowStockOnly}
                            onChange={e => setLowStockOnly(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
                        />
                        <label htmlFor="lowStock" className="text-sm font-medium text-slate-300 cursor-pointer">
                            Hanya Tampilkan Stok Menipis
                        </label>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-950/50 text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Produk</th>
                                    <th className="px-6 py-4 font-medium">Kategori</th>
                                    <th className="px-6 py-4 font-medium text-right">Harga Jual</th>
                                    <th className="px-6 py-4 font-medium text-right">Stok Tersedia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {stockData.map(item => (
                                    <tr key={item.id} className={`hover:bg-slate-800/30 ${!item.is_active ? 'opacity-50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-200">{item.product_name}</div>
                                            {!item.is_active && <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 mt-1 inline-block">Nonaktif</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">{item.category_name}</td>
                                        <td className="px-6 py-4 text-right text-slate-300">{formatRupiah(item.price)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                item.is_low_stock 
                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                                    : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            }`}>
                                                {item.current_stock}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {stockData.length === 0 && <tr><td colSpan="4" className="text-center py-6 text-slate-500">Tidak ada data stok</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* 4. Laporan Arus Kas (Embed via Button link to maintain clean state) */}
        {activeTab === 'cashflow' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center animate-fade-in">
                <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-500 mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Buku Laporan Arus Kas</h2>
                <p className="text-slate-400 mb-8 max-w-md">
                    Modul Arus Kas dikelola secara terpisah dengan tampilan ledger yang komprehensif. Silakan menuju halaman Arus Kas untuk melihat detail.
                </p>
                <button 
                    onClick={() => navigate('/cashflow')}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8 py-3 rounded-xl transition-colors"
                >
                    Buka Modul Arus Kas
                </button>
            </div>
        )}

        {/* 5. Laporan Laba Rugi */}
        {!loading && activeTab === 'profit-loss' && profitLossData && (
            <div className="space-y-6 animate-fade-in">
                
                <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-3 rounded-xl text-sm flex gap-3">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p>{profitLossData.note}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <p className="text-slate-400 text-sm font-medium mb-1">Total Penjualan</p>
                        <h3 className="text-2xl font-bold text-cyan-400">{formatRupiah(profitLossData.total_revenue)}</h3>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <p className="text-slate-400 text-sm font-medium mb-1">Total Pengeluaran</p>
                        <h3 className="text-2xl font-bold text-red-400">{formatRupiah(profitLossData.total_expenses)}</h3>
                        <div className="mt-3 space-y-1 text-xs text-slate-400">
                            <div className="flex justify-between">
                                <span>Bahan Baku</span>
                                <span>{formatRupiah(profitLossData.total_raw_material_expenses)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Operasional</span>
                                <span>{formatRupiah(profitLossData.total_operational_expenses)}</span>
                            </div>
                        </div>
                    </div>
                    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden ${profitLossData.net_profit < 0 ? 'border-red-500/30' : 'border-green-500/30'}`}>
                        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${profitLossData.net_profit < 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Laba Bersih</p>
                        <h3 className={`text-3xl font-bold ${profitLossData.net_profit < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {formatRupiah(profitLossData.net_profit)}
                        </h3>
                    </div>
                </div>

                {/* By Day Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-800">
                        <h2 className="font-bold">Rincian Laba Rugi Harian</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-950/50 text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Tanggal</th>
                                    <th className="px-6 py-4 font-medium text-right">Penjualan</th>
                                    <th className="px-6 py-4 font-medium text-right">Pengeluaran</th>
                                    <th className="px-6 py-4 font-medium text-right">Laba/Rugi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {profitLossData.by_day.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30">
                                        <td className="px-6 py-4 text-slate-300">{formatDate(item.date)}</td>
                                        <td className="px-6 py-4 text-right text-cyan-400">{formatRupiah(item.revenue)}</td>
                                        <td className="px-6 py-4 text-right text-red-400">{formatRupiah(item.expenses)}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${item.net_profit < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                            {formatRupiah(item.net_profit)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}
