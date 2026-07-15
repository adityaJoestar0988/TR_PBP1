import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function StoreSettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('identity')

  // Store Identity
  const [storeName, setStoreName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [receiptFooter, setReceiptFooter] = useState('')

  // Kasir Config
  const [allowDiscount, setAllowDiscount] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [newMethod, setNewMethod] = useState('')

  // Kasir Accounts
  const [kasirs, setKasirs] = useState([])
  const [kasirPage, setKasirPage] = useState(1)
  const [kasirTotalPages, setKasirTotalPages] = useState(1)
  const [showKasirForm, setShowKasirForm] = useState(false)
  const [editingKasir, setEditingKasir] = useState(null)
  const [kasirName, setKasirName] = useState('')
  const [kasirEmail, setKasirEmail] = useState('')
  const [kasirPassword, setKasirPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchSettings()
    fetchKasirs()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await api.get('/store-settings')
      const s = res.data.data
      setStoreName(s.store_name || '')
      setAddress(s.address || '')
      setPhone(s.phone || '')
      setReceiptFooter(s.receipt_footer || '')
      setAllowDiscount(s.allow_kasir_discount || false)
      setPaymentMethods(s.payment_methods || ['Cash'])
    } catch (err) {
      console.error('Failed to fetch settings', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchKasirs = async (page = 1) => {
    try {
      const res = await api.get('/users', { params: { role: 'kasir', page } })
      setKasirs(res.data.data.data)
      setKasirPage(res.data.data.current_page)
      setKasirTotalPages(res.data.data.last_page)
    } catch (err) {
      console.error('Failed to fetch kasirs', err)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setSuccessMsg('')
    try {
      await api.put('/store-settings', {
        store_name: storeName,
        address,
        phone,
        receipt_footer: receiptFooter,
        allow_kasir_discount: allowDiscount,
        payment_methods: paymentMethods,
      })
      setSuccessMsg('Pengaturan berhasil disimpan!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      let msg = 'Gagal menyimpan pengaturan.'
      if (err.response?.data?.errors) {
        msg = Object.values(err.response.data.errors).flat().join('\n')
      } else if (err.response?.data?.message) {
        msg = err.response.data.message
      }
      alert(msg)
    } finally {
      setSaving(false)
    }
  }

  const addPaymentMethod = () => {
    const trimmed = newMethod.trim()
    if (!trimmed) return
    if (paymentMethods.includes(trimmed)) {
      alert('Metode pembayaran sudah ada.')
      return
    }
    setPaymentMethods([...paymentMethods, trimmed])
    setNewMethod('')
  }

  const removePaymentMethod = (method) => {
    if (paymentMethods.length <= 1) {
      alert('Minimal harus ada satu metode pembayaran.')
      return
    }
    setPaymentMethods(paymentMethods.filter(m => m !== method))
  }

  const handleCreateKasir = async () => {
    try {
      await api.post('/users', { name: kasirName, email: kasirEmail, password: kasirPassword })
      setShowKasirForm(false)
      resetKasirForm()
      fetchKasirs()
      setSuccessMsg('Akun kasir berhasil dibuat!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      let msg = 'Gagal membuat akun kasir.'
      if (err.response?.data?.errors) {
        msg = Object.values(err.response.data.errors).flat().join('\n')
      } else if (err.response?.data?.message) {
        msg = err.response.data.message
      }
      alert(msg)
    }
  }

  const handleUpdateKasir = async () => {
    try {
      await api.put(`/users/${editingKasir.id}`, { name: kasirName, email: kasirEmail })
      setEditingKasir(null)
      resetKasirForm()
      fetchKasirs()
      setSuccessMsg('Akun kasir berhasil diperbarui!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      let msg = 'Gagal memperbarui akun kasir.'
      if (err.response?.data?.errors) {
        msg = Object.values(err.response.data.errors).flat().join('\n')
      } else if (err.response?.data?.message) {
        msg = err.response.data.message
      }
      alert(msg)
    }
  }

  const handleToggleActive = async (kasir) => {
    if (!window.confirm(`${kasir.is_active ? 'Nonaktifkan' : 'Aktifkan'} akun ${kasir.name}?`)) return
    try {
      await api.patch(`/users/${kasir.id}/toggle-active`)
      fetchKasirs()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status.')
    }
  }

  const handleDeleteKasir = async (kasir) => {
    if (!window.confirm(`Hapus akun kasir "${kasir.name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      await api.delete(`/users/${kasir.id}`)
      fetchKasirs()
      setSuccessMsg('Akun kasir berhasil dihapus.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus akun kasir.')
    }
  }

  const startEditKasir = (kasir) => {
    setEditingKasir(kasir)
    setKasirName(kasir.name)
    setKasirEmail(kasir.email)
    setShowKasirForm(false)
  }

  const resetKasirForm = () => {
    setKasirName('')
    setKasirEmail('')
    setKasirPassword('')
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="w-full">

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Success Banner */}
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800">
          {[
            { id: 'identity', label: 'Identitas Toko' },
            { id: 'config', label: 'Konfigurasi Kasir' },
            { id: 'accounts', label: 'Kelola Akun Kasir' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Identitas Toko */}
        {activeTab === 'identity' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nama Toko <span className="text-red-400">*</span></label>
              <input value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Alamat</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">No. Telepon</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Footer Struk</label>
              <input value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Terima Kasih Atas Kunjungan Anda!" />
            </div>
            <button onClick={saveSettings} disabled={saving || !storeName} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8 py-3 rounded-xl disabled:opacity-50 transition-colors">
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        )}

        {/* TAB 2: Konfigurasi Kasir */}
        {activeTab === 'config' && (
          <div className="space-y-6 animate-fade-in">
            {/* Discount Toggle */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Izinkan Kasir Memberikan Diskon</h3>
                  <p className="text-sm text-slate-400 mt-1">Jika dimatikan, kasir tidak bisa menerapkan diskon saat transaksi POS.</p>
                </div>
                <button
                  onClick={() => setAllowDiscount(!allowDiscount)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${allowDiscount ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${allowDiscount ? 'left-8' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold mb-4">Metode Pembayaran</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {paymentMethods.map(method => (
                  <div key={method} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm">
                    <span>{method}</span>
                    <button
                      onClick={() => removePaymentMethod(method)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Hapus"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newMethod}
                  onChange={e => setNewMethod(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPaymentMethod()}
                  placeholder="Tambah metode baru..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button onClick={addPaymentMethod} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-colors">
                  Tambah
                </button>
              </div>
            </div>

            <button onClick={saveSettings} disabled={saving} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8 py-3 rounded-xl disabled:opacity-50 transition-colors">
              {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </button>
          </div>
        )}

        {/* TAB 3: Kelola Akun Kasir */}
        {activeTab === 'accounts' && (
          <div className="space-y-6 animate-fade-in">
            {/* Add/Edit Form */}
            {(showKasirForm || editingKasir) && (
              <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold">{editingKasir ? 'Edit Kasir' : 'Tambah Kasir Baru'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nama</label>
                    <input value={kasirName} onChange={e => setKasirName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                    <input type="email" value={kasirEmail} onChange={e => setKasirEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  {!editingKasir && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Password (min 8 karakter)</label>
                      <input type="password" value={kasirPassword} onChange={e => setKasirPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={editingKasir ? handleUpdateKasir : handleCreateKasir}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-colors"
                  >
                    {editingKasir ? 'Simpan Perubahan' : 'Buat Akun'}
                  </button>
                  <button
                    onClick={() => { setShowKasirForm(false); setEditingKasir(null); resetKasirForm() }}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {!showKasirForm && !editingKasir && (
              <button
                onClick={() => { setShowKasirForm(true); resetKasirForm() }}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Tambah Kasir
              </button>
            )}

            {/* Kasir Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/50 text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Nama</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Dibuat</th>
                      <th className="px-6 py-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {kasirs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-slate-500">Belum ada akun kasir.</td>
                      </tr>
                    ) : (
                      kasirs.map(kasir => (
                        <tr key={kasir.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-200">{kasir.name}</td>
                          <td className="px-6 py-4 text-slate-400">{kasir.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                              kasir.is_active
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {kasir.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs">
                            {new Date(kasir.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => startEditKasir(kasir)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleActive(kasir)}
                                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                  kasir.is_active
                                    ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                }`}
                              >
                                {kasir.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                              </button>
                              <button
                                onClick={() => handleDeleteKasir(kasir)}
                                className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs transition-colors"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {kasirTotalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Halaman {kasirPage} dari {kasirTotalPages}</span>
                  <div className="flex gap-2">
                    <button disabled={kasirPage === 1} onClick={() => fetchKasirs(kasirPage - 1)} className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors">Prev</button>
                    <button disabled={kasirPage === kasirTotalPages} onClick={() => fetchKasirs(kasirPage + 1)} className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors">Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}
