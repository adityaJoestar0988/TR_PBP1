import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

function emptyForm() {
  return { id: null, name: '', category_id: '', price: '', stock: '', is_active: true, image: null }
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

export default function ProductListPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState(null)
  
  const [filters, setFilters] = useState({ search: '', category_id: '' })
  
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const isEditing = useMemo(() => form.id !== null, [form.id])

  async function loadData(params = {}) {
    setError('')
    const { data } = await api.get('/products', { params })
    setItems(data.data ?? [])
    setPagination(data)
  }

  async function loadCategories() {
    const { data } = await api.get('/categories')
    setCategories(data.data ?? [])
  }

  useEffect(() => {
    Promise.all([loadData(filters), loadCategories()]).catch((err) => {
      if (err?.response?.status === 401) {
        logout().finally(() => navigate('/login', { replace: true }))
      }
    })
  }, [])

  async function handleSearch(event) {
    event.preventDefault()
    await loadData(filters)
  }

  function startCreate() {
    setForm(emptyForm())
    setError('')
  }

  function startEdit(item) {
    setForm({ 
      id: item.id, 
      name: item.name, 
      category_id: item.category_id || '', 
      price: item.price, 
      stock: item.stock, 
      is_active: item.is_active,
      image: null
    })
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const payload = new FormData()
    payload.append('name', form.name)
    payload.append('category_id', form.category_id)
    payload.append('price', form.price)
    payload.append('stock', form.stock)
    payload.append('is_active', form.is_active ? 1 : 0)
    
    if (form.image) {
      payload.append('image', form.image)
    }

    try {
      if (isEditing) {
        payload.append('_method', 'PUT')
        await api.post(`/products/${form.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await api.post('/products', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      setForm(emptyForm())
      await loadData(filters)
    } catch (err) {
      const responseMessage = err?.response?.data?.message
      const validationMessages = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : ''
      setError(responseMessage || validationMessages || 'Gagal menyimpan produk.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus produk ${item.name}?`)) {
      return
    }

    try {
      await api.delete(`/products/${item.id}`)
      await loadData(filters)
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menghapus produk.')
    }
  }

  return (
    <div className="w-full">
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
            <form onSubmit={handleSearch} className="mb-4 grid gap-3 md:grid-cols-3">
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Cari produk..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-500"
              />
              <select 
                value={filters.category_id} 
                onChange={(event) => setFilters((current) => ({ ...current, category_id: event.target.value }))} 
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button className="flex-1 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-400 transition-colors">Cari</button>
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
                    <th className="px-4 py-3">Gambar</th>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Harga</th>
                    <th className="px-4 py-3">Stok</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-700/50">
                      <td className="px-4 py-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-800" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                            No Img
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">{item.name}</td>
                      <td className="px-4 py-3 text-slate-300">{item.category?.name || '-'}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">{formatRupiah(item.price)}</td>
                      <td className="px-4 py-3 text-slate-300">
                        <span className={item.stock <= 5 ? 'text-orange-400 font-bold' : ''}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.is_active ? (
                          <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs">Aktif</span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs">Nonaktif</span>
                        )}
                      </td>
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
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                        Belum ada produk.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {pagination ? <p className="mt-3 text-xs text-slate-400">Halaman {pagination.current_page} dari {pagination.last_page}</p> : null}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit Produk' : 'Tambah Produk'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Nama Produk</label>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" required />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Kategori</label>
                <select value={form.category_id} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" required>
                  <option value="">Pilih kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Harga (Rp)</label>
                <input type="number" min="1" step="1" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none hide-arrows" required />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Stok</label>
                <input type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none hide-arrows" required />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Gambar (Opsional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(event) => setForm((current) => ({ ...current, image: event.target.files[0] }))} 
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-500 hover:file:bg-cyan-500/20" 
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={form.is_active} 
                  onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} 
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500" 
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-300 cursor-pointer">Produk Aktif (Tersedia di Kasir)</label>
              </div>

              <button disabled={loading} className="w-full rounded-2xl bg-cyan-500 hover:bg-cyan-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-50 transition-colors mt-2">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </form>
          </section>
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-arrows {
          -moz-appearance: textfield;
        }
      `}} />
    </div>
  )
}
