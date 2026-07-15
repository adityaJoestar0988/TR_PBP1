import React from 'react'

export default function ReceiptView({ transaction, settings }) {
  if (!transaction || !settings) return null;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col items-center">
      {/* The receipt container. We use print utilities so it's the only thing visible on print. */}
      <div className="bg-white text-slate-900 w-full max-w-xs p-6 shadow-xl text-sm font-mono print:shadow-none print:w-full print:max-w-none receipt-content">
        
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 pb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider mb-1">{settings.store_name}</h2>
          <p className="text-xs text-slate-600 mb-1">{settings.address}</p>
          <p className="text-xs text-slate-600">Telp: {settings.phone}</p>
        </div>

        {/* Meta */}
        <div className="mb-4 text-xs">
          <div className="flex justify-between mb-1">
            <span className="text-slate-500">No:</span>
            <span className="font-semibold">{transaction.transaction_number}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-500">Tgl:</span>
            <span>{formatDate(transaction.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Kasir:</span>
            <span>{transaction.user?.name || '-'}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-t-2 border-b-2 border-dashed border-slate-300 py-3 mb-4 space-y-3">
          {transaction.transaction_items?.map(item => (
            <div key={item.id} className="text-xs">
              <div className="font-semibold mb-1">{item.product_name}</div>
              <div className="flex justify-between text-slate-700">
                <span>{item.quantity} x {formatRupiah(item.price)}</span>
                <span>{formatRupiah(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 mb-4 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span>{formatRupiah(transaction.subtotal)}</span>
          </div>
          
          {transaction.discount_value > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>
                Diskon {transaction.discount_type === 'percentage' ? `(${parseFloat(transaction.discount_value)}%)` : ''}
              </span>
              <span>-{formatRupiah(transaction.subtotal - transaction.total)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold text-sm py-2">
            <span>Total</span>
            <span>{formatRupiah(transaction.total)}</span>
          </div>
          
          <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
            <span>Tunai/Bayar ({transaction.payment_method})</span>
            <span>{formatRupiah(transaction.paid_amount)}</span>
          </div>
          
          <div className="flex justify-between font-bold pt-1">
            <span>Kembali</span>
            <span>{formatRupiah(transaction.change_amount)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-slate-500">
          <p>{settings.receipt_footer}</p>
        </div>
      </div>

      {/* Non-printable actions */}
      <div className="mt-6 flex gap-3 print:hidden w-full max-w-xs">
        <button 
          onClick={handlePrint}
          className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Struk
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-content, .receipt-content * {
            visibility: visible;
          }
          .receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 10px;
          }
        }
      `}} />
    </div>
  )
}
