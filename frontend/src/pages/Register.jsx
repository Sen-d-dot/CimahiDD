import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API, { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Field, Spinner } from '../components/ui';
import { homeFor } from './Login';

const ROLES = [
    { key: 'investor', title: 'Investor', desc: 'Lihat data keuangan & peluang pendanaan' },
    { key: 'company', title: 'Perusahaan', desc: 'Laporkan data & cari investor' },
];

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [role, setRole] = useState(params.get('role') === 'company' ? 'company' : 'investor');
    const [form, setForm] = useState({ name: '', email: '', phone: '', organization: '', company_name: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await API.post('/auth/register', { ...form, role });
            login(data);
            navigate(homeFor(data.user.role), { replace: true });
        } catch (err) {
            setError(errMsg(err, 'Pendaftaran gagal.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="glass w-full max-w-xl p-6 md:p-8 fade-up">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-extrabold text-white">Buat akun baru</h1>
                    <p className="text-sm text-slate-400 mt-1">Pilih jenis akun yang sesuai dengan kebutuhan Anda</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    {ROLES.map((r) => (
                        <button key={r.key} type="button" onClick={() => setRole(r.key)}
                            className={`text-left rounded-2xl p-4 border transition-all duration-300 cursor-pointer ${role === r.key ? 'border-accent bg-accent/15 shadow-lg shadow-sky-500/20 -translate-y-0.5' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}>
                            <p className="font-bold text-white text-sm">{r.title}</p>
                            <p className="text-xs text-slate-400 mt-1 leading-snug">{r.desc}</p>
                        </button>
                    ))}
                </div>

                {error && <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-400/40 text-red-200 text-xs text-center font-medium fade-up">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {role === 'company' && (
                        <Field label="Nama Perusahaan"><input className="field fade-up" required placeholder="PT Contoh Indonesia" value={form.company_name} onChange={set('company_name')} /></Field>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label={role === 'company' ? 'Nama Penanggung Jawab' : 'Nama Lengkap'}><input className="field" required placeholder="Nama Anda" value={form.name} onChange={set('name')} /></Field>
                        <Field label="No WhatsApp"><input className="field" placeholder="08xxxxxxxxxx" value={form.phone} onChange={set('phone')} /></Field>
                    </div>
                    {role === 'investor' && (
                        <Field label="Institusi / Perusahaan (opsional)"><input className="field fade-up" placeholder="Nama institusi investasi" value={form.organization} onChange={set('organization')} /></Field>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Email"><input className="field" type="email" required autoComplete="email" placeholder="email@domain.com" value={form.email} onChange={set('email')} /></Field>
                        <Field label="Password" hint="Minimal 8 karakter"><input className="field" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">{loading ? <><Spinner /> Mendaftarkan...</> : `Daftar sebagai ${role === 'company' ? 'Perusahaan' : 'Investor'}`}</button>
                </form>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Sudah punya akun? <Link to="/login" className="text-accent font-semibold hover:underline">Masuk</Link>
                </p>
            </div>
        </div>
    );
}
