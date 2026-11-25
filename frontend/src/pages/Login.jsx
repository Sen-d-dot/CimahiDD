import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API, { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Field, Spinner } from '../components/ui';

export const homeFor = (role) => (role === 'admin' ? '/admin' : role === 'company' ? '/dashboard' : '/');

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await API.post('/auth/login', form);
            login(data);
            navigate(location.state?.from || homeFor(data.user.role), { replace: true });
        } catch (err) {
            setError(errMsg(err, 'Email atau password salah.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="glass w-full max-w-md p-8 fade-up">
                <div className="text-center mb-7">
                    <h1 className="text-2xl font-extrabold text-white">Selamat datang kembali</h1>
                    <p className="text-sm text-slate-400 mt-1">Masuk sebagai admin, perusahaan, atau investor</p>
                </div>

                {error && <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-400/40 text-red-200 text-xs text-center font-medium fade-up">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-4">
                    <Field label="Email">
                        <input className="field" type="email" required autoComplete="email" placeholder="email@domain.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </Field>
                    <Field label="Password">
                        <input className="field" type="password" required autoComplete="current-password" placeholder="Masukkan password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    </Field>
                    <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">{loading ? <><Spinner /> Memproses...</> : 'Masuk'}</button>
                </form>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Belum punya akun? <Link to="/register" className="text-accent font-semibold hover:underline">Daftar sekarang</Link>
                </p>
            </div>
        </div>
    );
}
