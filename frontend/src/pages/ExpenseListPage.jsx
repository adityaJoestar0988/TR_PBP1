import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

function emptyExpenseForm() {
  return {
    id: null,
    date: new Date().toISOString().slice(0, 10),
    type: 'pembelian_bahan_baku',
    raw_material_id: '',
    amount: '',
    description: '',
  }
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

export default function ExpenseListPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [items, setItems] = useState([])
  const [rawMaterials, setRawMaterials] = useState([])
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ start_date: '', end_date: '', type: '' })
  const [form, setForm] = useState(emptyExpenseForm())
  const [loading, setLoading] = useState(false)

  const isEditing = useMemo(() => form.id !== null, [form.id])
  const maxDate = new Date().toISOString().slice(0, 10)

  function getRawMaterialName(item) {
    return item.rawMaterial?.name || item.raw_material?.name || '-'
  }

  async function loadExpenses(params = {}) {
    const { data } = await api.get('/expenses', { params })
    setItems(data.data ?? [])
    setPagination(data)
  }

  async function loadRawMaterials() {
    const { data } = await api.get('/raw-materials')
    setRawMaterials(data.data ?? [])
  }

  useEffect(() => {
    Promise.all([loadExpenses(), loadRawMaterials()]).catch((err) => {
      if (err?.response?.status === 401) {
        logout().finally(() => navigate('/login', { replace: true }))
      } else {
        setError(err?.response?.data?.message || 'Gagal memuat pengeluaran.')
      }
    })
  }, [])

  function startCreate() {
    setForm(emptyExpenseForm())
    setError('')
  }

  function startEdit(item) {
    setForm({
      id: item.id,
      date: item.date?.slice?.(0, 10) || item.date,
      type: item.type,
      raw_material_id: item.raw_material_id || item.rawMaterial?.id || '',
      amount: item.amount,
      description: item.description || '',
    })
    setError('')
  }

  async function handleFilterSubmit(event) {
    event.preventDefault()
    await loadExpenses(filters)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      date: form.date,
      type: form.type,
      amount: Number(form.amount),
      description: form.description || null,
    }

    if (form.type === 'pembelian_bahan_baku') {
      payload.raw_material_id = form.raw_material_id ? Number(form.raw_material_id) : null
    }

    try {
      if (isEditing) {
        await api.put(`/expenses/${form.id}`, payload)
      } else {
        await api.post('/expenses', payload)
      }

      setForm(emptyExpenseForm())
      await Promise.all([loadExpenses(filters), loadRawMaterials()])
    } catch (err) {
      const responseMessage = err?.response?.data?.message
      const validationMessages = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : ''
      setError(responseMessage || validationMessages || 'Gagal menyimpan pengeluaran.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('Hapus pengeluaran ini?')) {
      return
    }

    try {
      await api.delete(`/expenses/${item.id}`)
      await loadExpenses(filters)
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menghapus pengeluaran.')
    }
  }

  return (
    <div className="w-full">

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
            <form onSubmit={handleFilterSubmit} className="mb-4 grid gap-3 md:grid-cols-4">
              <input type="date" value={filters.start_date} onChange={(event) => setFilters((current) => ({ ...current, start_date: event.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" style={{ colorScheme: 'dark' }} />
              <input type="date" value={filters.end_date} onChange={(event) => setFilters((current) => ({ ...current, end_date: event.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" style={{ colorScheme: 'dark' }} />
              <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none">
                <option value="">Semua Tipe</option>
                <option value="pembelian_bahan_baku">Pembelian Bahan Baku</option>
                <option value="operasional">Operasional</option>
              </select>
              <div className="flex gap-2">
                <button className="flex-1 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-400 transition-colors">Filter</button>
                <button type="button" onClick={startCreate} className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
                  Tambah
                </button>
              </div>
            </form>

            {error ? <div className="mb-4 rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div> : null}

            <div className="overflow-hidden rounded-2xl border border-slate-700">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Bahan Baku</th>
                    <th className="px-4 py-3">Jumlah</th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-700/50">
                      <td className="px-4 py-3 text-slate-300">{item.date}</td>
                      <td className="px-4 py-3 text-slate-300">{item.type === 'pembelian_bahan_baku' ? 'Pembelian Bahan Baku' : 'Operasional'}</td>
                      <td className="px-4 py-3 text-slate-300">{getRawMaterialName(item)}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">{formatRupiah(item.amount)}</td>
                      <td className="px-4 py-3 text-slate-300">{item.description || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(item)} className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(item)} className="rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!items.length ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                        Belum ada pengeluaran.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {pagination ? <p className="mt-3 text-xs text-slate-400">Halaman {pagination.current_page} dari {pagination.last_page}</p> : null}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Tanggal</label>
                <input type="date" max={maxDate} value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Tipe</label>
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value, raw_material_id: event.target.value === 'operasional' ? '' : current.raw_material_id }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none">
                  <option value="pembelian_bahan_baku">Pembelian Bahan Baku</option>
                  <option value="operasional">Operasional</option>
                </select>
              </div>

              {form.type === 'pembelian_bahan_baku' ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Bahan Baku</label>
                  <select value={form.raw_material_id} onChange={(event) => setForm((current) => ({ ...current, raw_material_id: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none">
                    <option value="">Pilih bahan baku</option>
                    {rawMaterials.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.unit})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Jumlah</label>
                <input type="number" min="1" step="1" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Deskripsi</label>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" rows="4" />
              </div>

              <button disabled={loading} className="w-full rounded-2xl bg-cyan-500 hover:bg-cyan-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-50 transition-colors">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}