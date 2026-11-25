import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { errMsg } from '../services/api';
import { useToast } from '../components/Toast';
import { Field, Spinner, StatusBadge, CountUp } from '../components/ui';
import { rupiahShort, dateID, openPermit } from '../utils/format';
import FinancialChart from '../components/FinancialChart';

const TABS = [
    { key: 'profile', label: 'Profil & Lokasi' },
    { key: 'financial', label: 'Laporan Keuangan' },
    { key: 'funding', label: 'Kebutuhan Pendanaan' },
    { key: 'permits', label: 'Izin Usaha' },
];
const PERMIT_TYPES = ['NIB', 'SIUP', 'NPWP Perusahaan', 'Akta Pendirian', 'SK Kemenkumham', 'TDP', 'Izin Lokasi', 'Lainnya'];
const thisYear = new Date().getFullYear();
const EMPTY_FIN = { year: thisYear - 1, revenue: '', net_profit: '', total_assets: '', total_liabilities: '', notes: '' };
const EMPTY_PERMIT = { type: 'NIB', number: '', issued_by: '', expiry_date: '' };
const v = (x) => (x === null || x === undefined ? '' : x);

export default function CompanyDashboard() {
    const toast = useToast();
    const [company, setCompany] = useState(null);
    const [categories, setCategories] = useState([]);
    const [tab, setTab] = useState('profile');
    const [busy, setBusy] = useState(false);
    const [profile, setProfile] = useState({});
    const [funding, setFunding] = useState({});
    const [fin, setFin] = useState(EMPTY_FIN);
    const [permit, setPermit] = useState(EMPTY_PERMIT);
    const [file, setFile] = useState(null);

    const apply = (c) => {
        setCompany(c);
        setProfile({ name: v(c.name), category_id: v(c.category_id), description: v(c.description), website: v(c.website), address: v(c.address), gmaps_url: v(c.gmaps_url) });
        setFunding({ funding_needed: v(c.funding_needed), funding_purpose: v(c.funding_purpose), funding_deadline: c.funding_deadline ? String(c.funding_deadline).slice(0, 10) : '' });
    };

    useEffect(() => {
        Promise.all([API.get('/my-company'), API.get('/categories')])
            .then(([c, cat]) => { apply(c.data.data); setCategories(cat.data.data || []); })
            .catch((err) => toast(errMsg(err, 'Gagal memuat data perusahaan.'), 'error'));
    }, []);

    const run = async (fn, okMsg) => {
        setBusy(true);
        try {
            const res = await fn();
            if (res?.data?.data) apply(res.data.data);
            toast(res?.data?.message || okMsg);
            return true;
        } catch (err) {
            toast(errMsg(err), 'error');
            return false;
        } finally { setBusy(false); }
    };

    if (!company) return <div className="max-w-5xl mx-auto px-5 py-12 space-y-4"><div className="skeleton h-24" /><div className="skeleton h-72" /></div>;

    const checks = [
        { label: 'Profil usaha (kategori & deskripsi)', ok: !!(company.category_id && company.description) },
        { label: 'Alamat lengkap & link Google Maps', ok: !!(company.address && company.gmaps_url) },
        { label: 'Minimal 1 laporan keuangan', ok: company.financials.length > 0 },
        { label: 'Kebutuhan pendanaan', ok: !!(company.funding_needed && company.funding_purpose) },
        { label: 'Minimal 1 izin usaha', ok: company.permits.length > 0 },
    ];
    const done = checks.filter((c) => c.ok).length;
    const pct = Math.round((done / checks.length) * 100);
    const canSubmit = ['draft', 'rejected'].includes(company.status);

    const saveProfile = (e) => { e.preventDefault(); run(() => API.put('/my-company', profile), 'Profil tersimpan.'); };
    const saveFunding = (e) => { e.preventDefault(); run(() => API.put('/my-company', funding), 'Kebutuhan pendanaan tersimpan.'); };
    const saveFin = async (e) => { e.preventDefault(); if (await run(() => API.post('/my-company/financials', fin))) setFin(EMPTY_FIN); };
    const removeFin = (id) => window.confirm('Hapus laporan tahun ini?') && run(() => API.delete(`/my-company/financials/${id}`));
    const addPermit = async (e) => {
        e.preventDefault();
        if (!file) return toast('Pilih file dokumen izin terlebih dahulu.', 'error');
        const body = new FormData();
        Object.entries(permit).forEach(([k, val]) => body.append(k, val));
        body.append('file', file);
        if (await run(() => API.post('/my-company/permits', body))) { setPermit(EMPTY_PERMIT); setFile(null); e.target.reset(); }
    };
    const removePermit = (id) => window.confirm('Hapus izin ini beserta dokumennya?') && run(() => API.delete(`/my-company/permits/${id}`));
    const submit = () => run(() => API.post('/my-company/submit'));

    const setP = (k) => (e) => setProfile({ ...profile, [k]: e.target.value });
    const setF = (k) => (e) => setFin({ ...fin, [k]: e.target.value });
    const setFu = (k) => (e) => setFunding({ ...funding, [k]: e.target.value });
    const setPe = (k) => (e) => setPermit({ ...permit, [k]: e.target.value });

    return (
        <div className="max-w-5xl mx-auto px-5 py-10 space-y-6">
            <div className="glass p-6 md:p-8 fade-up">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Dashboard Perusahaan</p>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">{company.name}</h1>
                        <div className="mt-3 flex items-center gap-3"><StatusBadge status={company.status} />{company.status === 'approved' && <Link to={`/perusahaan/${company.id}`} className="text-xs text-accent hover:underline">Lihat halaman publik →</Link>}</div>
                    </div>
                    <div className="md:w-64">
                        <div className="flex items-end justify-between mb-2"><span className="text-xs text-slate-400">Kelengkapan data</span><span className="text-xl font-extrabold text-white font-display"><CountUp to={pct} duration={900} />%</span></div>
                        <div className="progress"><span style={{ width: `${pct}%` }} /></div>
                    </div>
                </div>

                {company.status === 'rejected' && <p className="mt-5 text-sm text-red-200 bg-red-500/10 border border-red-400/30 rounded-xl p-3">Pengajuan ditolak: {company.rejection_reason}. Perbaiki data lalu ajukan kembali.</p>}
                {company.status === 'pending' && <p className="mt-5 text-sm text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-xl p-3">Data Anda sedang ditinjau admin. Anda tetap bisa memperbarui data selama menunggu.</p>}
                {company.status === 'approved' && <p className="mt-5 text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3">Perusahaan Anda sudah terverifikasi dan tampil di beranda. Investor terdaftar dapat melihat data lengkap Anda.</p>}

                <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                    {checks.map((c) => (
                        <li key={c.label} className={`text-sm flex items-center gap-2 ${c.ok ? 'text-emerald-300' : 'text-slate-400'}`}>
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${c.ok ? 'bg-emerald-400/20' : 'bg-white/10'}`}>{c.ok ? '✓' : ''}</span>{c.label}
                        </li>
                    ))}
                </ul>
                {canSubmit && <button onClick={submit} disabled={busy || done < checks.length} className="btn btn-primary mt-6">{busy ? <Spinner /> : null} Ajukan Verifikasi ke Admin</button>}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {TABS.map((t) => <button key={t.key} onClick={() => setTab(t.key)} className={`tab-btn ${tab === t.key ? 'active' : ''}`}>{t.label}</button>)}
            </div>

            <div key={tab} className="fade-up">
                {tab === 'profile' && (
                    <form onSubmit={saveProfile} className="glass p-6 md:p-8 space-y-5">
                        <div className="grid md:grid-cols-2 gap-5">
                            <Field label="Nama Perusahaan"><input className="field" required value={profile.name} onChange={setP('name')} /></Field>
                            <Field label="Kategori">
                                <select className="field" value={profile.category_id} onChange={setP('category_id')} required>
                                    <option value="">Pilih kategori</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </Field>
                        </div>
                        <Field label="Bergerak di bidang / Deskripsi usaha"><textarea className="field" rows="4" value={profile.description} onChange={setP('description')} placeholder="Jelaskan produk, layanan, dan model bisnis Anda..." /></Field>
                        <Field label="Alamat Lengkap" hint="Tulis selengkap mungkin: jalan, nomor, kelurahan, kecamatan, kota, provinsi, kode pos."><textarea className="field" rows="3" value={profile.address} onChange={setP('address')} placeholder="Jl. Contoh No. 10, Kel. ..., Kec. ..., Kota ..., Provinsi ... 40511" /></Field>
                        <div className="grid md:grid-cols-2 gap-5">
                            <Field label="Link Google Maps" hint="Buka Google Maps → cari lokasi → Bagikan → Salin link."><input className="field" type="url" value={profile.gmaps_url} onChange={setP('gmaps_url')} placeholder="https://maps.app.goo.gl/..." /></Field>
                            <Field label="Website"><input className="field" type="url" value={profile.website} onChange={setP('website')} placeholder="https://perusahaan.com" /></Field>
                        </div>
                        <button className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : null} Simpan Profil</button>
                    </form>
                )}

                {tab === 'financial' && (
                    <div className="space-y-6">
                        <form onSubmit={saveFin} className="glass p-6 md:p-8 space-y-5">
                            <h2 className="font-bold text-white">Tambah / perbarui laporan tahunan</h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                <Field label="Tahun"><input className="field" type="number" min="1990" max={thisYear} required value={fin.year} onChange={setF('year')} /></Field>
                                <Field label="Pendapatan (Rp)"><input className="field" type="number" required value={fin.revenue} onChange={setF('revenue')} placeholder="1500000000" /></Field>
                                <Field label="Laba Bersih (Rp)" hint="Isi negatif jika rugi"><input className="field" type="number" required value={fin.net_profit} onChange={setF('net_profit')} /></Field>
                                <Field label="Total Aset (Rp)"><input className="field" type="number" required value={fin.total_assets} onChange={setF('total_assets')} /></Field>
                                <Field label="Total Kewajiban (Rp)"><input className="field" type="number" required value={fin.total_liabilities} onChange={setF('total_liabilities')} /></Field>
                                <Field label="Catatan (opsional)"><input className="field" maxLength={500} value={fin.notes} onChange={setF('notes')} /></Field>
                            </div>
                            <p className="hint">Tahun yang sama akan diperbarui, bukan diduplikasi.</p>
                            <button className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : null} Simpan Laporan</button>
                        </form>

                        {company.financials.length > 0 && <div className="glass p-6"><h2 className="font-bold text-white mb-4">Grafik Keuangan</h2><FinancialChart rows={company.financials} /></div>}

                        <div className="glass overflow-x-auto">
                            <table className="data">
                                <thead><tr><th>Tahun</th><th>Pendapatan</th><th>Laba Bersih</th><th>Aset</th><th>Kewajiban</th><th /></tr></thead>
                                <tbody>
                                    {company.financials.length ? company.financials.map((r) => (
                                        <tr key={r.id}>
                                            <td className="font-semibold text-white">{r.year}</td>
                                            <td>{rupiahShort(r.revenue)}</td>
                                            <td className={Number(r.net_profit) < 0 ? 'text-red-300' : 'text-emerald-300'}>{rupiahShort(r.net_profit)}</td>
                                            <td>{rupiahShort(r.total_assets)}</td>
                                            <td>{rupiahShort(r.total_liabilities)}</td>
                                            <td className="text-right whitespace-nowrap">
                                                <button className="btn btn-ghost btn-sm mr-2" onClick={() => setFin({ year: r.year, revenue: r.revenue, net_profit: r.net_profit, total_assets: r.total_assets, total_liabilities: r.total_liabilities, notes: v(r.notes) })}>Ubah</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => removeFin(r.id)}>Hapus</button>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan="6" className="text-center text-slate-400 py-8">Belum ada laporan keuangan.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'funding' && (
                    <form onSubmit={saveFunding} className="glass p-6 md:p-8 space-y-5">
                        <div className="grid md:grid-cols-2 gap-5">
                            <Field label="Dana yang Dibutuhkan (Rp)"><input className="field" type="number" min="0" value={funding.funding_needed} onChange={setFu('funding_needed')} placeholder="2500000000" /></Field>
                            <Field label="Target Waktu (opsional)"><input className="field" type="date" value={funding.funding_deadline} onChange={setFu('funding_deadline')} /></Field>
                        </div>
                        <Field label="Rencana Penggunaan Dana" hint="Jelaskan untuk apa dana dipakai (ekspansi, mesin, modal kerja, dll.) dan hasil yang ditargetkan."><textarea className="field" rows="5" value={funding.funding_purpose} onChange={setFu('funding_purpose')} /></Field>
                        <button className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : null} Simpan Kebutuhan Pendanaan</button>
                    </form>
                )}

                {tab === 'permits' && (
                    <div className="space-y-6">
                        <form onSubmit={addPermit} className="glass p-6 md:p-8 space-y-5">
                            <h2 className="font-bold text-white">Tambah izin usaha</h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                <Field label="Jenis Izin"><select className="field" value={permit.type} onChange={setPe('type')}>{PERMIT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
                                <Field label="Nomor Izin"><input className="field" required value={permit.number} onChange={setPe('number')} /></Field>
                                <Field label="Diterbitkan oleh"><input className="field" value={permit.issued_by} onChange={setPe('issued_by')} placeholder="OSS / Kemenkumham / ..." /></Field>
                                <Field label="Masa Berlaku (opsional)"><input className="field" type="date" value={permit.expiry_date} onChange={setPe('expiry_date')} /></Field>
                                <div className="sm:col-span-2">
                                    <Field label="Dokumen (PDF/JPG/PNG, maks 4 MB)"><input className="field file:mr-3 file:rounded-lg file:border-0 file:bg-white/15 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0] || null)} /></Field>
                                </div>
                            </div>
                            <p className="hint">Dokumen hanya bisa dibuka oleh admin dan investor terdaftar, tidak tampil publik.</p>
                            <button className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : null} Unggah Izin</button>
                        </form>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {company.permits.length ? company.permits.map((p) => (
                                <div key={p.id} className="glass !rounded-2xl p-5 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-white">{p.type}</p>
                                        <p className="text-xs text-slate-400 truncate">No. {p.number}{p.issued_by ? ` · ${p.issued_by}` : ''}</p>
                                        {p.expiry_date && <p className="text-[11px] text-slate-500">Berlaku s.d. {dateID(p.expiry_date)}</p>}
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {p.has_file ? <button className="btn btn-ghost btn-sm" onClick={() => openPermit(p.id, toast)}>Lihat</button> : null}
                                        <button className="btn btn-danger btn-sm" onClick={() => removePermit(p.id)}>Hapus</button>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-slate-400 sm:col-span-2 text-center py-6">Belum ada izin yang diunggah.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
