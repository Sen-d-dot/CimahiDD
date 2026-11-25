import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="mt-20 border-t border-white/10 bg-ink-950/60 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
                <div>
                    <p className="font-display font-bold text-white tracking-wide">TAKHIR</p>
                    <p className="text-xs text-slate-400 mt-1">Direktori perusahaan & peluang investasi · Created by Husein</p>
                </div>
                <div className="flex items-center gap-5 text-xs text-slate-400">
                    <Link to="/" className="hover:text-white transition">Beranda</Link>
                    <Link to="/login" className="hover:text-white transition">Masuk</Link>
                    <Link to="/register" className="hover:text-white transition">Daftar</Link>
                </div>
                <p className="text-xs text-slate-500">&copy; 2026 TAKHIR. All rights reserved.</p>
            </div>
        </footer>
    );
}
