import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import logoImage from '../assets/Logo.png';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { RoleBadge } from './ui';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        if (!user) { setUnread(0); return undefined; }
        let off = false;
        const load = () => API.get('/messages/unread').then((r) => { if (!off) setUnread(r.data.count); }).catch(() => {});
        load();
        const t = setInterval(load, 30000);
        return () => { off = true; clearInterval(t); };
    }, [user, location.pathname]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 16);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => { setOpen(false); }, [location.pathname]);

    const dashboard = user?.role === 'admin' ? { to: '/admin', label: 'Panel Admin' }
        : user?.role === 'company' ? { to: '/dashboard', label: 'Dashboard Perusahaan' } : null;

    const Badge = () => (unread > 0 ? <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{unread}</span> : null);
    const handleLogout = () => { logout(); navigate('/'); };
    const linkCls = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`;

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-ink-950/75 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20' : 'bg-transparent border-b border-transparent'}`}>
            <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group" aria-label="Beranda TAKHIR">
                    <img src={logoImage} alt="TAKHIR" className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
                </Link>

                <nav className="hidden md:flex items-center gap-7">
                    <NavLink to="/" end className={linkCls}>Beranda</NavLink>
                    {dashboard && <NavLink to={dashboard.to} className={linkCls}>{dashboard.label}{user.role === 'admin' && <Badge />}</NavLink>}
                    {user && user.role !== 'admin' && <NavLink to="/pesan" className={linkCls}>Pesan<Badge /></NavLink>}
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    {user ? (
                        <>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-300 max-w-[10rem] truncate">{user.name}</span>
                                <RoleBadge role={user.role} />
                            </div>
                            <button onClick={handleLogout} className="btn btn-ghost btn-sm">Keluar</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost btn-sm">Masuk</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Daftar</Link>
                        </>
                    )}
                </div>

                <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition cursor-pointer" aria-label="Menu" aria-expanded={open}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                    </svg>
                </button>
            </div>

            {open && (
                <div className="menu-in md:hidden absolute right-4 top-[4.25rem] w-64 glass !rounded-2xl p-4 flex flex-col gap-3 bg-ink-900/90">
                    {user && <div className="flex items-center justify-between text-sm pb-3 border-b border-white/10"><span className="truncate">{user.name}</span><RoleBadge role={user.role} /></div>}
                    <NavLink to="/" end className={linkCls}>Beranda</NavLink>
                    {dashboard && <NavLink to={dashboard.to} className={linkCls}>{dashboard.label}{user.role === 'admin' && <Badge />}</NavLink>}
                    {user && user.role !== 'admin' && <NavLink to="/pesan" className={linkCls}>Pesan<Badge /></NavLink>}
                    {user ? (
                        <button onClick={handleLogout} className="btn btn-ghost btn-sm mt-1">Keluar</button>
                    ) : (
                        <div className="flex gap-2 mt-1">
                            <Link to="/login" className="btn btn-ghost btn-sm flex-1">Masuk</Link>
                            <Link to="/register" className="btn btn-primary btn-sm flex-1">Daftar</Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
