import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import ContactUs from '../components/ContactUs';
import { Reveal, CountUp } from '../components/ui';

const PER_PAGE = 9;

function CompanyCard({ c, index }) {
    return (
        <Reveal delay={(index % 3) * 90}>
            <article className="glass glass-hover h-full p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-white leading-snug">{c.name}</h3>
                    <span className="badge badge-company shrink-0">{c.category_name || 'Umum'}</span>
                </div>
                <p className="text-sm text-slate-300 mt-3 line-clamp-3 flex-grow">{c.description || 'Belum ada deskripsi usaha.'}</p>
                {c.address && (
                    <p className="text-xs text-slate-400 mt-3 flex items-start gap-1.5 line-clamp-1">
                        <span aria-hidden="true">📍</span><span>{c.address}</span>
                    </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/10">
                    <Link to={`/perusahaan/${c.id}`} className="btn btn-primary btn-sm">Lihat Detail</Link>
                    {c.gmaps_url && <a href={c.gmaps_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">Maps</a>}
                    {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">Website</a>}
                </div>
            </article>
        </Reveal>
    );
}

const SkeletonCard = () => <div className="skeleton h-56" />;

export default function Home() {
    const { user } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('Semua');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        Promise.all([API.get('/companies'), API.get('/categories')])
            .then(([comp, cat]) => {
                setCompanies(comp.data.data || []);
                setCategories(cat.data.data || []);
            })
            .catch((err) => console.error('Gagal memuat data:', err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => companies.filter((c) =>
        (category === 'Semua' || c.category_name === category) &&
        (c.name || '').toLowerCase().includes(search.toLowerCase())), [companies, category, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const current = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const pick = (setter) => (value) => { setter(value); setPage(1); };

    return (
        <div className="max-w-6xl mx-auto px-5">
            <section className="pt-14 pb-16 md:pt-24 md:pb-20 text-center">
                <div className="fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-sky-200 mb-6">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Perusahaan terverifikasi · Peluang investasi
                </div>
                <h1 className="fade-up text-4xl md:text-6xl font-extrabold leading-[1.1] text-white" style={{ animationDelay: '.1s' }}>
                    Temukan perusahaan,<br /><span className="gradient-text">hubungkan dengan investor</span>
                </h1>
                <p className="fade-up max-w-2xl mx-auto text-slate-300 mt-6 text-base md:text-lg" style={{ animationDelay: '.2s' }}>
                    TAKHIR mempertemukan perusahaan yang sudah diverifikasi admin dengan investor, lengkap dengan data keuangan, kebutuhan pendanaan, lokasi, dan izin usaha.
                </p>

                <div className="fade-up flex flex-wrap items-center justify-center gap-3 mt-9" style={{ animationDelay: '.3s' }}>
                    {!user && <>
                        <Link to="/register?role=investor" className="btn btn-primary px-7">Daftar sebagai Investor</Link>
                        <Link to="/register?role=company" className="btn btn-ghost px-7">Daftarkan Perusahaan</Link>
                    </>}
                    {user?.role === 'company' && <Link to="/dashboard" className="btn btn-primary px-7">Buka Dashboard Perusahaan</Link>}
                    {user?.role === 'admin' && <Link to="/admin" className="btn btn-primary px-7">Buka Panel Admin</Link>}
                    {user?.role === 'investor' && <a href="#direktori" className="btn btn-primary px-7">Jelajahi Perusahaan</a>}
                </div>

                <div className="fade-up grid grid-cols-3 gap-3 max-w-2xl mx-auto mt-14" style={{ animationDelay: '.45s' }}>
                    {[
                        { v: companies.length, label: 'Perusahaan terverifikasi' },
                        { v: categories.length, label: 'Kategori usaha' },
                        { v: 100, label: '% dicek admin', suffix: true },
                    ].map((s) => (
                        <div key={s.label} className="glass !rounded-2xl py-4 px-2 float-slow" style={{ animationDelay: `${s.v % 3}s` }}>
                            <p className="text-2xl md:text-3xl font-extrabold text-white font-display"><CountUp to={s.v} /></p>
                            <p className="text-[11px] md:text-xs text-slate-400 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section id="direktori" className="scroll-mt-24">
                <Reveal>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Direktori Perusahaan</h2>
                            <p className="text-sm text-slate-400 mt-1">{filtered.length} perusahaan ditemukan</p>
                        </div>
                        <div className="relative w-full md:w-72">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">🔍</span>
                            <input className="field !pl-10" placeholder="Cari nama perusahaan..." value={search} onChange={(e) => pick(setSearch)(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-1 px-1">
                        {['Semua', ...categories.map((c) => c.name)].map((name) => (
                            <button key={name} onClick={() => pick(setCategory)(name)} className={`chip ${category === name ? 'active' : ''}`}>{name}</button>
                        ))}
                    </div>

                    {!user && (
                        <div className="glass !rounded-2xl px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                            <p className="text-slate-300">🔒 Data keuangan, kebutuhan pendanaan, dan dokumen izin hanya terbuka untuk investor terdaftar.</p>
                            <Link to="/register?role=investor" className="btn btn-primary btn-sm self-start sm:self-auto">Daftar Investor</Link>
                        </div>
                    )}
                </Reveal>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}</div>
                ) : current.length ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {current.map((c, i) => <CompanyCard key={c.id} c={c} index={i} />)}
                    </div>
                ) : (
                    <div className="glass text-center py-16 px-6 fade-up">
                        <p className="text-4xl mb-3">🗂️</p>
                        <p className="text-white font-semibold">Tidak ada perusahaan yang cocok</p>
                        <p className="text-sm text-slate-400 mt-1">Coba kata kunci atau kategori lain.</p>
                    </div>
                )}

                {filtered.length > PER_PAGE && (
                    <div className="flex items-center justify-between mt-8">
                        <span className="text-xs text-slate-400">Halaman {page} dari {totalPages}</span>
                        <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Sebelumnya</button>
                            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Berikutnya →</button>
                        </div>
                    </div>
                )}
            </section>

            <div className="mt-20"><Reveal><ContactUs /></Reveal></div>
        </div>
    );
}
