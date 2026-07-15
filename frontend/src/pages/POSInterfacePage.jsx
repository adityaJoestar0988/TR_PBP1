import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import ReceiptView from '../components/ReceiptView'

export default function POSInterfacePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  // Settings & Payment State
  const [storeSettings, setStoreSettings] = useState(null)
  const [allowDiscount, setAllowDiscount] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState(['Cash'])
  
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [allowedDiscountType, setAllowedDiscountType] = useState(null)
  const [discountValue, setDiscountValue] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paidAmount, setPaidAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successReceipt, setSuccessReceipt] = useState(null)

  // Fetch settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get('/pos/settings')
        setStoreSettings(res.data.data)
        setAllowDiscount(res.data.data.allow_kasir_discount)
        setAllowedDiscountType(res.data.data.allowed_discount_type)
        const methods = res.data.data.payment_methods || ['Cash']
        setPaymentMethods(methods)
        if (methods.length > 0) {
            setPaymentMethod(methods[0])
        }
      } catch (err) {
        console.error('Failed to fetch settings', err)
      }
    }
    fetchSettings()
  }, [])

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.get('/pos/categories')
        setCategories(res.data.data)
      } catch (err) {
        console.error('Failed to fetch categories', err)
      }
    }
    fetchCategories()
  }, [])

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const params = {}
        if (search) params.search = search
        if (categoryId) params.category_id = categoryId
        
        const res = await api.get('/pos/products', { params })
        setProducts(res.data.data)
      } catch (err) {
        console.error('Failed to fetch products', err)
      } finally {
        setLoading(false)
      }
    }
    
    const timer = setTimeout(() => {
      fetchProducts()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search, categoryId, refetchTrigger])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  // Cart functions
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (existing.qty >= product.stock) return prev // block increment
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const updateQty = (id, newQty) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        let validQty = parseInt(newQty) || 1
        if (validQty > item.stock) validQty = item.stock
        if (validQty < 1) validQty = 1
        return { ...item, qty: validQty }
      }
      return item
    }))
  }

  const incrementQty = (id) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.qty < item.stock) {
        return { ...item, qty: item.qty + 1 }
      }
      return item
    }))
  }

  const decrementQty = (id) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.qty > 1) {
        return { ...item, qty: item.qty - 1 }
      }
      return item
    }))
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => {
    if (window.confirm('Yakin ingin membatalkan transaksi dan mengosongkan keranjang?')) {
      setCart([])
    }
  }

  // Calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0)
  }, [cart])

  const discountAmount = useMemo(() => {
    let val = parseFloat(discountValue) || 0;
    if (allowedDiscountType === 'percentage') {
        return cartTotal * (val / 100);
    }
    return val;
  }, [discountValue, allowedDiscountType, cartTotal])

  const grandTotal = cartTotal - discountAmount;
  
  const changeAmount = useMemo(() => {
    let paid = parseFloat(paidAmount) || 0;
    return paid - grandTotal;
  }, [paidAmount, grandTotal])

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  // Payment Submit
  const handlePaymentSubmit = async () => {
    if (!window.confirm('Fix bayar?')) return;
    
    setIsSubmitting(true)
    try {
        const payload = {
            items: cart.map(item => ({ product_id: item.id, quantity: item.qty })),
            discount_type: allowDiscount && discountValue ? allowedDiscountType : null,
            discount_value: allowDiscount && discountValue ? parseFloat(discountValue) : null,
            payment_method: paymentMethod,
            paid_amount: parseFloat(paidAmount)
        };
        
        const res = await api.post('/pos/transactions', payload);
        
        setCart([]);
        setSuccessReceipt(res.data.data); // Store the entire transaction object
        setShowPaymentModal(false);
        setRefetchTrigger(prev => prev + 1);
        setDiscountValue('');
        setPaidAmount('');
    } catch (err) {
        let msg = 'Terjadi kesalahan saat memproses pembayaran.';
        if (err.response?.data?.errors) {
            msg = Object.values(err.response.data.errors).flat().join('\n');
        } else if (err.response?.data?.message) {
            msg = err.response.data.message;
        }
        alert(msg);
        setRefetchTrigger(prev => prev + 1);
    } finally {
        setIsSubmitting(false)
    }
  }

  if (successReceipt) {
    return (
        <div className="flex h-screen bg-slate-950 text-white items-center justify-center font-sans p-6 overflow-y-auto">
            <div className="flex flex-col items-center">
                <ReceiptView transaction={successReceipt} settings={storeSettings} />
                
                <div className="mt-8 print:hidden">
                    <button 
                        onClick={() => setSuccessReceipt(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-8 py-3 rounded-xl transition-colors"
                    >
                        Selesai / Transaksi Baru
                    </button>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="flex h-full w-full text-white overflow-hidden font-sans relative">
      {/* LEFT: MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">

        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Controls: Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow placeholder-slate-500"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setCategoryId('')}
                className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  categoryId === '' 
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Semua
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    categoryId === cat.id 
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p>Tidak ada produk ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                {products.map(product => {
                  const inCart = cart.find(c => c.id === product.id)
                  const remaining = product.stock - (inCart ? inCart.qty : 0)
                  
                  return (
                    <div 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="group cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all flex flex-col h-full active:scale-[0.98]"
                    >
                      <div className="aspect-[4/3] bg-slate-800 flex items-center justify-center relative overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <svg className="w-12 h-12 text-slate-600 group-hover:text-cyan-500/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-full text-xs font-medium border border-slate-700">
                          Stok: <span className={remaining === 0 ? 'text-red-400' : 'text-cyan-400'}>{remaining}</span>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <p className="text-xs text-slate-400 mb-1">{product.category?.name || 'Uncategorized'}</p>
                        <h3 className="font-medium text-slate-100 line-clamp-2 leading-tight mb-2 flex-1">{product.name}</h3>
                        <p className="font-bold text-cyan-400">{formatRupiah(product.price)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: CART SIDEBAR */}
      <div className="w-96 border-l border-white/10 bg-slate-900/80 backdrop-blur-xl flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Keranjang
          </h2>
          <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-bold">
            {cart.reduce((a, c) => a + c.qty, 0)} Items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
              <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center">
                <svg className="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p>Keranjang masih kosong</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 relative group">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  
                  <div className="mb-2 pr-4">
                    <h4 className="font-medium text-sm text-slate-200 leading-tight">{item.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{formatRupiah(item.price)} / unit</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                      <button 
                        onClick={() => decrementQty(item.id)}
                        className="px-3 py-1.5 hover:bg-slate-700 text-slate-300 transition-colors"
                      >-</button>
                      <input 
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateQty(item.id, e.target.value)}
                        className="w-10 bg-transparent text-center text-sm font-medium focus:outline-none hide-arrows"
                      />
                      <button 
                        onClick={() => incrementQty(item.id)}
                        disabled={item.qty >= item.stock}
                        className={`px-3 py-1.5 transition-colors ${item.qty >= item.stock ? 'text-slate-600 bg-slate-900 cursor-not-allowed' : 'hover:bg-slate-700 text-slate-300'}`}
                      >+</button>
                    </div>
                    <div className="font-bold text-cyan-400 text-right">
                      {formatRupiah(item.price * item.qty)}
                    </div>
                  </div>
                  {item.qty >= item.stock && (
                    <p className="text-[10px] text-orange-400 mt-2 text-right">Stok maksimal tercapai</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-950/80 border-t border-white/5">
          <div className="flex items-end justify-between mb-6">
            <span className="text-slate-400">Total Tagihan</span>
            <span className="text-3xl font-bold text-white tracking-tight">{formatRupiah(cartTotal)}</span>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              Lanjut ke Pembayaran
            </button>
            <button 
              onClick={clearCart}
              disabled={cart.length === 0}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Batalkan Transaksi
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
                    <h2 className="text-xl font-bold">Review Pembayaran</h2>
                    <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="p-6 flex-1 space-y-6">
                    {/* Summary */}
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                        <div className="flex justify-between text-sm mb-2 text-slate-300">
                            <span>Subtotal ({cart.reduce((a,c)=>a+c.qty,0)} item)</span>
                            <span>{formatRupiah(cartTotal)}</span>
                        </div>
                        {allowDiscount && discountAmount > 0 && (
                            <div className="flex justify-between text-sm mb-2 text-green-400">
                                <span>Diskon</span>
                                <span>-{formatRupiah(discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t border-slate-800">
                            <span>Total</span>
                            <span className="text-cyan-400">{formatRupiah(grandTotal)}</span>
                        </div>
                    </div>

                    {/* Discount */}
                    {allowDiscount && allowedDiscountType && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Diskon Kasir ({allowedDiscountType === 'percentage' ? 'Persen %' : 'Nominal Rp'})
                            </label>
                            <input 
                                type="number"
                                value={discountValue}
                                onChange={e => setDiscountValue(e.target.value)}
                                placeholder={allowedDiscountType === 'percentage' ? '0-100' : '0'}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    )}

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Metode Pembayaran</label>
                        <div className="grid grid-cols-2 gap-2">
                            {paymentMethods.map(method => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                                        paymentMethod === method
                                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                                    }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Paid Amount */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Jumlah Bayar</label>
                        <input 
                            type="number"
                            value={paidAmount}
                            onChange={e => setPaidAmount(e.target.value)}
                            placeholder="0"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 hide-arrows"
                        />
                        
                        {/* Quick cash buttons */}
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                            {[20000, 50000, 100000, grandTotal].map((amt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setPaidAmount(amt.toString())}
                                    className="whitespace-nowrap px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors"
                                >
                                    {amt === grandTotal ? 'Uang Pas' : formatRupiah(amt)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Change Amount */}
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                        <span className="text-slate-400">Kembalian</span>
                        <span className={`text-xl font-bold ${changeAmount >= 0 ? 'text-white' : 'text-red-400'}`}>
                            {changeAmount < 0 ? 'Kurang ' : ''}{formatRupiah(Math.abs(changeAmount))}
                        </span>
                    </div>
                </div>
                
                <div className="p-6 border-t border-slate-800 sticky bottom-0 bg-slate-900">
                    <button 
                        onClick={handlePaymentSubmit}
                        disabled={isSubmitting || changeAmount < 0 || !paidAmount}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-slate-950"></div>
                        ) : 'Konfirmasi & Bayar'}
                    </button>
                </div>
            </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-arrows {
          -moz-appearance: textfield;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />
    </div>
  )
}