import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import API, { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Reveal, StatusBadge } from '../components/ui';
import { rupiah, rupiahShort, dateID, mapsEmbed, openPermit } from '../utils/format';
import FinancialChart from '../components/FinancialChart';

const Lock = ({ title }) => (
    <div className="glass p-6 text-center">
        <p className="text-3xl mb-2">🔒</p>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-400 mt-1 mb-4">Khusus investor terdaftar.</p>
        <div className="flex justify-center gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm">Masuk</Link>
            <Link to="/register?role=investor" className="btn btn-primary btn-sm">Daftar Investor</Link>
        </div>
    </div>
);

export default function CompanyDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const toast = useToast();
    const [company, setCompany] = useState(null);
    const [restricted, setRestricted] = useState(true);
    const [state, setState] = useState('loading');

    const load = () => API.get(`/companies/${id}`)
        .then((res) => { setCompany(res.data.data); setRestricted(res.data.restricted); setState('ok'); })
        .catch(() => setState('notfound'));

    useEffect(() => { load(); }, [id, user?.id]);

    const setStatus = async (status) => {
        let reason;
        if (status === 'rejected') {
            reason = window.prompt('Alasan penolakan (akan dilihat perusahaan):');
            if (!reason) return;
        }
        try {
            await API.patch(`/admin/companies/${id}/status`, { status, reason });
            toast(status === 'approved' ? 'Perusahaan disetujui dan tampil di beranda.' : 'Perusahaan ditolak.');
            load();
        } catch (err) { toast(errMsg(err), 'error'); }
    };

    if (state === 'loading') return <div className="max-w-5xl mx-auto px-5 py-12 space-y-4"><div className="skeleton h-12 w-2/3" /><div className="skeleton h-64" /></div>;
    if (state === 'notfound') {
        return (
            <div className="max-w-md mx-auto px-5 py-24 text-center fade-up">
                <p className="text-5xl mb-4">🔎</p>
                <h1 className="text-xl font-bold text-white">Perusahaan tidak ditemukan</h1>
                <Link to="/" className="btn btn-primary mt-6">Kembali ke Beranda</Link>
            </div>
        );
    }

    const c = company;
    const canSeeStatus = user && (user.role === 'admin' || user.role === 'company');

    return (
        <div className="max-w-5xl mx-auto px-5 py-10 space-y-6">
            <Link to="/" className="text-sm text-slate-400 hover:text-white transition inline-block">← Kembali ke direktori</Link>

            <div className="glass p-6 md:p-8 fade-up">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="badge badge-company">{c.category_name || 'Umum'}</span>
                    {canSeeStatus && <StatusBadge status={c.status} />}
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white">{c.name}</h1>
                <p className="text-slate-300 mt-4 leading-relaxed whitespace-pre-line">{c.description || 'Belum ada deskripsi usaha.'}</p>
                {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm mt-5">🔗 Kunjungi Website</a>}

                {user?.role === 'admin' && (
                    <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-400 mr-2">Tindakan admin:</span>
                        {c.status !== 'approved' && <button onClick={() => setStatus('approved')} className="btn btn-success btn-sm">Setujui</button>}
                        {c.status !== 'rejected' && <button onClick={() => setStatus('rejected')} className="btn btn-danger btn-sm">Tolak</button>}
                    </div>
                )}
                {c.status === 'rejected' && c.rejection_reason && (user?.role === 'admin' || user?.role === 'company') && (
                    <p className="mt-4 text-sm text-red-200 bg-red-500/10 border border-red-400/30 rounded-xl p-3">Alasan penolakan: {c.rejection_reason}</p>
                )}
            </div>

            <Reveal>
                <div className="grid md:grid-cols-5 gap-6">
                    <div className="glass p-6 md:col-span-3">
                        <h2 className="font-bold text-white mb-3">Alamat & Lokasi</h2>
                        <p className="text-sm text-slate-300 whitespace-pre-line">{c.address || 'Alamat belum diisi.'}</p>
                        {c.address && (
                            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                                <iframe title="Peta lokasi perusahaan" src={mapsEmbed(c.address)} loading="lazy" className="w-full h-64 bg-ink-800" referrerPolicy="no-referrer-when-downgrade" />
                            </div>
                        )}
                        {c.gmaps_url && <a href={c.gmaps_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm mt-4">📍 Buka di Google Maps</a>}
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        {restricted ? <Lock title="Kebutuhan pendanaan" /> : (
                            <div className="glass p-6">
                                <h2 className="font-bold text-white mb-3">Kebutuhan Pendanaan</h2>
                                <p className="text-3xl font-extrabold font-display gradient-text">{rupiah(c.funding_needed)}</p>
                                <p className="text-sm text-slate-300 mt-3 whitespace-pre-line">{c.funding_purpose || '-'}</p>
                                {c.funding_deadline && <p className="text-xs text-slate-400 mt-3">Target terkumpul: {dateID(c.funding_deadline)}</p>}
                            </div>
                        )}
                        {user?.role === 'admin' && (c.owner_email || c.owner_phone) && (
                            <div className="glass p-6">
                                <h2 className="font-bold text-white mb-3">Kontak Pemilik (admin)</h2>
                                {c.owner_name && <p className="text-sm text-white">{c.owner_name}</p>}
                                {c.owner_email && <p className="text-sm text-slate-300 mt-1">{c.owner_email}</p>}
                                {c.owner_phone && <p className="text-sm text-slate-300 mt-1">{c.owner_phone}</p>}
                            </div>
                        )}
                        {user?.role === 'investor' && (
                            <div className="glass p-6">
                                <h2 className="font-bold text-white mb-2">Tertarik berinvestasi?</h2>
                                <p className="text-xs text-slate-400 mb-4">Hubungi admin TAKHIR. Admin akan menghubungkan Anda dengan perusahaan ini.</p>
                                <Link to={`/pesan?topik=${encodeURIComponent(c.name)}`} className="btn btn-primary btn-sm">Hubungi Admin</Link>
                            </div>
                        )}
                    </div>
                </div>
            </Reveal>

            <Reveal>
                {restricted ? <Lock title="Laporan keuangan & izin usaha" /> : (
                    <div className="space-y-6">
                        <div className="glass p-6">
                            <h2 className="font-bold text-white mb-4">Laporan Keuangan</h2>
                            {c.financials.length ? (
                                <div className="space-y-8">
                                    <FinancialChart rows={c.financials} />
                                    <div className="overflow-x-auto">
                                        <table className="data">
                                            <thead><tr><th>Tahun</th><th>Pendapatan</th><th>Laba Bersih</th><th>Aset</th><th>Kewajiban</th></tr></thead>
                                            <tbody>
                                                {c.financials.map((r) => (
                                                    <tr key={r.id}>
                                                        <td className="font-semibold text-white">{r.year}</td>
                                                        <td>{rupiahShort(r.revenue)}</td>
                                                        <td className={Number(r.net_profit) < 0 ? 'text-red-300' : 'text-emerald-300'}>{rupiahShort(r.net_profit)}</td>
                                                        <td>{rupiahShort(r.total_assets)}</td>
                                                        <td>{rupiahShort(r.total_liabilities)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : <p className="text-sm text-slate-400">Belum ada laporan keuangan.</p>}
                        </div>

                        <div className="glass p-6">
                            <h2 className="font-bold text-white mb-4">Izin Usaha</h2>
                            {c.permits.length ? (
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {c.permits.map((p) => (
                                        <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-white text-sm">{p.type}</p>
                                                <p className="text-xs text-slate-400 truncate">No. {p.number}{p.issued_by ? ` · ${p.issued_by}` : ''}</p>
                                                {p.expiry_date && <p className="text-[11px] text-slate-500">Berlaku s.d. {dateID(p.expiry_date)}</p>}
                                            </div>
                                            {p.has_file ? <button onClick={() => openPermit(p.id, toast)} className="btn btn-ghost btn-sm shrink-0">Lihat</button> : null}
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-slate-400">Belum ada izin yang diunggah.</p>}
                        </div>
                    </div>
                )}
            </Reveal>
        </div>
    );
}
