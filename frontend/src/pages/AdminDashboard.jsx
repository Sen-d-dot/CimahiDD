import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API, { errMsg } from '../services/api';
import { useToast } from '../components/Toast';
import { StatusBadge, RoleBadge, CountUp } from '../components/ui';
import AdminMessages from '../components/AdminMessages';
import { rupiahShort } from '../utils/format';

const STATUS_FILTERS = [['all', 'Semua'], ['pending', 'Menunggu'], ['draft', 'Draf'], ['approved', 'Terverifikasi'], ['rejected', 'Ditolak']];
const ROLE_FILTERS = [['all', 'Semua'], ['company', 'Perusahaan'], ['investor', 'Investor']];
const PER_PAGE = 10;

export default function AdminDashboard() {
    const toast = useToast();
    const [tab, setTab] = useState('companies');
    const [status, setStatus] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [companies, setCompanies] = useState([]);
    const [users, setUsers] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [unread, setUnread] = useState(0);
    const [chatUser, setChatUser] = useState(null);

    const loadUnread = useCallback(() => API.get('/messages/unread').then((r) => setUnread(r.data.count)).catch(() => {}), []);
    const load = useCallback(async () => {
        try {
            const [c, u, m] = await Promise.all([API.get('/admin/companies'), API.get('/admin/users'), API.get('/contact')]);
            setCompanies(c.data.data || []);
            setUsers(u.data.data || []);
            setContacts(m.data.data || []);
            loadUnread();
        } catch (err) { console.error('Gagal ambil data:', err); }
    }, [loadUnread]);

    useEffect(() => {
        load();
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, [load]);

    const act = async (fn, okMsg) => {
        try { const res = await fn(); toast(res?.data?.message || okMsg); load(); }
        catch (err) { toast(errMsg(err), 'error'); }
    };
    const approve = (id) => act(() => API.patch(`/admin/companies/${id}/status`, { status: 'approved' }));
    const reject = (id) => {
        const reason = window.prompt('Alasan penolakan (akan dilihat perusahaan):');
        if (reason) act(() => API.patch(`/admin/companies/${id}/status`, { status: 'rejected', reason }));
    };
    const removeCompany = (id, name) => window.confirm(`Hapus "${name}" beserta data keuangan dan izinnya?`) && act(() => API.delete(`/admin/companies/${id}`));
    const removeUser = (u) => window.confirm(`Hapus akun ${u.role === 'company' ? 'perusahaan' : 'investor'} "${u.name}"?${u.role === 'company' ? ' Data perusahaan, laporan, izin, dan percakapannya ikut terhapus.' : ' Percakapannya ikut terhapus.'}`) && act(() => API.delete(`/admin/users/${u.id}`));
    const removeContact = (id) => window.confirm('Hapus pesan ini?') && act(() => API.delete(`/contact/${id}`));
    const openChat = (id) => { setChatUser(id); setTab('chat'); };

    const counts = useMemo(() => ({
        pending: companies.filter((c) => c.status === 'pending').length,
        approved: companies.filter((c) => c.status === 'approved').length,
        investors: users.filter((u) => u.role === 'investor').length,
    }), [companies, users]);

    const rows = useMemo(() => {
        const q = search.toLowerCase();
        if (tab === 'companies') return companies.filter((c) => (status === 'all' || c.status === status) && `${c.name} ${c.owner_name || ''}`.toLowerCase().includes(q));
        if (tab === 'users') return users.filter((u) => u.role !== 'admin' && (roleFilter === 'all' || u.role === roleFilter) && `${u.name} ${u.email} ${u.company_name || ''}`.toLowerCase().includes(q));
        if (tab === 'contacts') return contacts.filter((m) => `${m.name} ${m.email}`.toLowerCase().includes(q));
        return [];
    }, [tab, status, roleFilter, search, companies, users, contacts]);

    const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    const current = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const reset = (fn) => (val) => { fn(val); setPage(1); };
    const empty = (cols) => <tr><td colSpan={cols} className="text-center text-slate-400 py-10">Tidak ada data.</td></tr>;

    const tabs = [['companies', 'Perusahaan'], ['users', 'Akun Pengguna'], ['chat', 'Percakapan'], ['contacts', `Kotak Kontak (${contacts.length})`]];

    return (
        <div className="max-w-7xl mx-auto px-5 py-10 space-y-6">
            <div className="fade-up">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">Panel Admin</h1>
                <p className="text-sm text-slate-400 mt-1">Verifikasi perusahaan, kelola akun, dan berkomunikasi dengan perusahaan serta investor.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    ['Menunggu verifikasi', counts.pending, 'text-amber-300'],
                    ['Perusahaan terverifikasi', counts.approved, 'text-emerald-300'],
                    ['Investor terdaftar', counts.investors, 'text-sky-300'],
                    ['Pesan belum dibaca', unread, 'text-rose-300'],
                ].map(([label, val, color], i) => (
                    <div key={label} className="glass glass-hover !rounded-2xl p-5 fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                        <p className={`text-3xl font-extrabold font-display ${color}`}><CountUp to={val} duration={900} /></p>
                        <p className="text-xs text-slate-400 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            <div className="glass p-4 md:p-6 fade-up" style={{ animationDelay: '.2s' }}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
                    <div className="flex gap-2 overflow-x-auto">
                        {tabs.map(([key, label]) => (
                            <button key={key} onClick={() => { setTab(key); setPage(1); setSearch(''); }} className={`tab-btn ${tab === key ? 'active' : ''}`}>
                                {label}{key === 'chat' && unread > 0 && <span className="ml-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>}
                            </button>
                        ))}
                    </div>
                    {tab !== 'chat' && <input className="field lg:w-72" placeholder="Cari nama..." value={search} onChange={(e) => reset(setSearch)(e.target.value)} />}
                </div>

                {tab === 'companies' && (
                    <div className="flex gap-2 overflow-x-auto mb-4">
                        {STATUS_FILTERS.map(([key, label]) => <button key={key} onClick={() => reset(setStatus)(key)} className={`chip ${status === key ? 'active' : ''}`}>{label}</button>)}
                    </div>
                )}
                {tab === 'users' && (
                    <div className="flex gap-2 overflow-x-auto mb-4">
                        {ROLE_FILTERS.map(([key, label]) => <button key={key} onClick={() => reset(setRoleFilter)(key)} className={`chip ${roleFilter === key ? 'active' : ''}`}>{label}</button>)}
                    </div>
                )}

                {tab === 'chat' && <AdminMessages users={users} activeId={chatUser} setActiveId={setChatUser} onRead={loadUnread} />}

                {tab !== 'chat' && (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                        {tab === 'companies' && (
                            <table className="data">
                                <thead><tr><th>Perusahaan</th><th>Kategori</th><th>Pemilik</th><th>Kelengkapan</th><th>Dana</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
                                <tbody>
                                    {current.length ? current.map((c) => (
                                        <tr key={c.id}>
                                            <td className="font-semibold text-white">{c.name}</td>
                                            <td>{c.category_name || '-'}</td>
                                            <td><p>{c.owner_name || '-'}</p><p className="text-xs text-slate-500">{c.owner_email}</p></td>
                                            <td className="text-xs text-slate-400">{c.financial_count} laporan · {c.permit_count} izin</td>
                                            <td>{c.funding_needed ? rupiahShort(c.funding_needed) : '-'}</td>
                                            <td><StatusBadge status={c.status} /></td>
                                            <td className="text-right whitespace-nowrap space-x-1.5">
                                                <Link to={`/perusahaan/${c.id}`} className="btn btn-ghost btn-sm">Detail</Link>
                                                {c.status === 'pending' && <><button className="btn btn-success btn-sm" onClick={() => approve(c.id)}>Setujui</button><button className="btn btn-danger btn-sm" onClick={() => reject(c.id)}>Tolak</button></>}
                                                <button className="btn btn-danger btn-sm" onClick={() => removeCompany(c.id, c.name)}>Hapus</button>
                                            </td>
                                        </tr>
                                    )) : empty(7)}
                                </tbody>
                            </table>
                        )}

                        {tab === 'users' && (
                            <table className="data">
                                <thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Kontak</th><th>Terdaftar</th><th className="text-right">Aksi</th></tr></thead>
                                <tbody>
                                    {current.length ? current.map((u) => (
                                        <tr key={u.id}>
                                            <td className="font-semibold text-white">{u.name}{(u.company_name || u.organization) && <p className="text-xs font-normal text-slate-500">{u.company_name || u.organization}</p>}</td>
                                            <td>{u.email}</td>
                                            <td><RoleBadge role={u.role} /></td>
                                            <td>{u.phone || '-'}</td>
                                            <td className="text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                                            <td className="text-right whitespace-nowrap space-x-1.5">
                                                <button className="btn btn-ghost btn-sm" onClick={() => openChat(u.id)}>Pesan</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => removeUser(u)}>Hapus Akun</button>
                                            </td>
                                        </tr>
                                    )) : empty(6)}
                                </tbody>
                            </table>
                        )}

                        {tab === 'contacts' && (
                            <table className="data">
                                <thead><tr><th>Waktu</th><th>Pengirim</th><th>Kontak</th><th>Pesan</th><th className="text-right">Aksi</th></tr></thead>
                                <tbody>
                                    {current.length ? current.map((m) => (
                                        <tr key={m.id}>
                                            <td className="text-xs text-slate-400 whitespace-nowrap">{new Date(m.created_at).toLocaleString('id-ID')}</td>
                                            <td className="font-semibold text-white">{m.name}</td>
                                            <td><p>{m.email}</p><p className="text-xs text-slate-500">{m.whatsapp || '-'}</p></td>
                                            <td className="max-w-sm"><p className="line-clamp-3 whitespace-pre-line" title={m.message}>{m.message}</p></td>
                                            <td className="text-right"><button className="btn btn-danger btn-sm" onClick={() => removeContact(m.id)}>Hapus</button></td>
                                        </tr>
                                    )) : empty(5)}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {tab !== 'chat' && rows.length > PER_PAGE && (
                    <div className="flex items-center justify-between pt-4 mt-2">
                        <span className="text-xs text-slate-400">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, rows.length)} dari {rows.length}</span>
                        <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Sebelumnya</button>
                            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Berikutnya →</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
