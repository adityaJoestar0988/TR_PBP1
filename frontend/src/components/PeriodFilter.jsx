import React from 'react'

export default function PeriodFilter({ 
    periodType, setPeriodType, 
    date, setDate, 
    month, setMonth, 
    year, setYear, 
    startDate, setStartDate, 
    endDate, setEndDate 
}) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-6 items-start md:items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Periode</label>
            <div className="flex bg-slate-950 rounded-xl border border-slate-700 p-1">
              {['daily', 'monthly', 'custom'].map(type => (
                <button
                  key={type}
                  onClick={() => setPeriodType(type)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    periodType === type ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type === 'daily' ? 'Harian' : type === 'monthly' ? 'Bulanan' : 'Custom'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex gap-4 items-end flex-wrap">
            {periodType === 'daily' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Pilih Tanggal</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            )}

            {periodType === 'monthly' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Bulan</label>
                  <select 
                    value={month}
                    onChange={e => setMonth(parseInt(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tahun</label>
                  <input 
                    type="number" 
                    value={year}
                    onChange={e => setYear(parseInt(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-24"
                  />
                </div>
              </>
            )}

            {periodType === 'custom' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Mulai</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Sampai</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>
    )
}
