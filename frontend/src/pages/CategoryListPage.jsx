import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

function emptyForm() {
  return { id: null, name: '' }
}

export default function CategoryListPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const isEditing = useMemo(() => form.id !== null, [form.id])

  async function loadData(params = {}) {
    setError('')
    const { data } = await api.get('/categories', { params })
    setItems(data.data ?? [])
    setPagination(data)
  }

  useEffect(() => {
    loadData().catch((err) => {
      if (err?.response?.status === 401) {
        logout().finally(() => navigate('/login', { replace: true }))
      }
    })
  }, [])

  async function handleSearch(event) {
    event.preventDefault()
    await loadData({ search })
  }

  function startCreate() {
    setForm(emptyForm())
    setError('')
  }

  function startEdit(item) {
    setForm({ id: item.id, name: item.name })
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isEditing) {
        await api.put(`/categories/${form.id}`, { name: form.name })
      } else {
        await api.post('/categories', { name: form.name })
      }

      setForm(emptyForm())
      await loadData({ search })
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menyimpan kategori.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus kategori ${item.name}?`)) {
      return
    }

    try {
      await api.delete(`/categories/${item.id}`)
      await loadData({ search })
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menghapus kategori. Pastikan tidak ada produk yang menggunakan kategori ini.')
    }
  }

  return (
    <div className="w-full">
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
            <form onSubmit={handleSearch} className="mb-4 flex gap-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kategori..."
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-500"
              />
              <button className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-400 transition-colors">Cari</button>
              <button type="button" onClick={startCreate} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
                Tambah
              </button>
            </form>

            {error ? <div className="mb-4 rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div> : null}

            <div className="overflow-hidden rounded-2xl border border-slate-700">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Nama Kategori</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-700/50">
                      <td className="px-4 py-3 font-medium text-slate-200">{item.name}</td>
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
                      <td colSpan="2" className="px-4 py-8 text-center text-slate-500">
                        Belum ada kategori.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {pagination ? <p className="mt-3 text-xs text-slate-400">Halaman {pagination.current_page} dari {pagination.last_page}</p> : null}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm h-fit">
            <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Nama</label>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" required />
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
