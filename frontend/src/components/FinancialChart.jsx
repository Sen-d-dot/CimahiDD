import { useMemo, useState } from 'react';
import { rupiah, rupiahShort } from '../utils/format';

const VIEWS = {
    income: { label: 'Pendapatan & Laba', a: { key: 'revenue', label: 'Pendapatan', color: '#38bdf8' }, b: { key: 'net_profit', label: 'Laba bersih', color: '#34d399' } },
    balance: { label: 'Aset & Kewajiban', a: { key: 'total_assets', label: 'Total aset', color: '#818cf8' }, b: { key: 'total_liabilities', label: 'Total kewajiban', color: '#fbbf24' } },
};
const W = 640, H = 300, L = 68, R = 12, T = 14, B = 34;
const pct = (n) => (n === null ? '-' : `${n > 0 ? '+' : ''}${n.toFixed(1).replace('.', ',')}%`);

export default function FinancialChart({ rows }) {
    const [view, setView] = useState('income');
    const [hover, setHover] = useState(null);

    const data = useMemo(() => [...rows].sort((a, b) => a.year - b.year).map((r) => ({
        year: r.year, revenue: +r.revenue, net_profit: +r.net_profit, total_assets: +r.total_assets, total_liabilities: +r.total_liabilities,
    })), [rows]);
    if (!data.length) return null;

    const v = VIEWS[view];
    const vals = data.flatMap((r) => [r[v.a.key], r[v.b.key]]);
    const lo = Math.min(0, ...vals);
    const hi = Math.max(0, ...vals) || 1;
    const raw = (hi - lo) / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
    const top = Math.ceil(hi / step) * step;
    const bottom = Math.floor(lo / step) * step;
    const ticks = Array.from({ length: Math.round((top - bottom) / step) + 1 }, (_, i) => bottom + i * step);

    const plotW = W - L - R;
    const plotH = H - T - B;
    const y = (val) => T + plotH * (1 - (val - bottom) / (top - bottom));
    const groupW = plotW / data.length;
    const barW = Math.min(36, groupW / 3);
    const shown = data[hover ?? data.length - 1];

    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    const growth = prev && prev.revenue ? ((last.revenue - prev.revenue) / Math.abs(prev.revenue)) * 100 : null;
    const margin = last.revenue ? (last.net_profit / last.revenue) * 100 : null;
    const leverage = last.total_assets ? (last.total_liabilities / last.total_assets) * 100 : null;
    const kpis = [
        { label: `Pertumbuhan pendapatan ${prev ? `${prev.year}→${last.year}` : ''}`, value: pct(growth), tone: growth === null ? '' : growth >= 0 ? 'text-emerald-300' : 'text-red-300' },
        { label: `Margin laba bersih ${last.year}`, value: pct(margin), tone: margin === null ? '' : margin >= 0 ? 'text-emerald-300' : 'text-red-300' },
        { label: `Kewajiban terhadap aset ${last.year}`, value: leverage === null ? '-' : `${leverage.toFixed(1).replace('.', ',')}%`, tone: leverage !== null && leverage > 70 ? 'text-amber-300' : 'text-sky-300' },
    ];

    const bar = (val, x, color, delay) => {
        const h = Math.max(Math.abs(y(val) - y(0)), 1);
        return <rect x={x} y={val >= 0 ? y(val) : y(0)} width={barW} height={h} rx="4" fill={color} className="rise" style={{ transformOrigin: val >= 0 ? 'bottom' : 'top', animationDelay: `${delay}ms` }} />;
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex gap-2">
                    {Object.entries(VIEWS).map(([key, item]) => (
                        <button key={key} onClick={() => setView(key)} className={`chip ${view === key ? 'active' : ''}`}>{item.label}</button>
                    ))}
                </div>
                <div className="flex gap-4 text-[11px] text-slate-300">
                    {[v.a, v.b].map((s) => <span key={s.key} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{s.label}</span>)}
                </div>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Grafik ${v.label} per tahun`}>
                {ticks.map((t) => (
                    <g key={t}>
                        <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,.08)" />
                        <text x={L - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8">{rupiahShort(t)}</text>
                    </g>
                ))}
                <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,.35)" />
                {data.map((r, i) => {
                    const cx = L + groupW * i + groupW / 2;
                    const active = (hover ?? data.length - 1) === i;
                    return (
                        <g key={`${view}-${r.year}`} opacity={active ? 1 : 0.55} style={{ transition: 'opacity .2s' }}>
                            {bar(r[v.a.key], cx - barW - 2, v.a.color, i * 90)}
                            {bar(r[v.b.key], cx + 2, view === 'income' && r.net_profit < 0 ? '#f87171' : v.b.color, i * 90 + 60)}
                            <text x={cx} y={H - 12} textAnchor="middle" fontSize="11" fontWeight={active ? 700 : 500} fill={active ? '#fff' : '#94a3b8'}>{r.year}</text>
                            <rect x={cx - groupW / 2} y={T} width={groupW} height={plotH + B} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)} style={{ cursor: 'pointer' }} />
                        </g>
                    );
                })}
            </svg>

            <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="font-bold text-white">{shown.year}</span>
                {[v.a, v.b].map((s) => (
                    <span key={s.key} className="text-slate-300"><i className="inline-block h-2 w-2 rounded-sm mr-1.5" style={{ background: s.color }} />{s.label}: <b className="text-white">{rupiah(shown[s.key])}</b></span>
                ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-4">
                {kpis.map((k) => (
                    <div key={k.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className={`text-xl font-extrabold font-display ${k.tone}`}>{k.value}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{k.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
