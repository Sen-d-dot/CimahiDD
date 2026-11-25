import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import API, { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Chat from '../components/Chat';

export default function Messages() {
    const { user } = useAuth();
    const toast = useToast();
    const [params] = useSearchParams();
    const [messages, setMessages] = useState(null);
    const topic = params.get('topik');

    const load = useCallback(() => API.get('/messages/thread').then((r) => setMessages(r.data.data)).catch(() => {}), []);
    useEffect(() => {
        load();
        const t = setInterval(load, 10000);
        return () => clearInterval(t);
    }, [load]);

    const send = async (body) => {
        try { await API.post('/messages/thread', { body }); await load(); return true; }
        catch (err) { toast(errMsg(err), 'error'); return false; }
    };

    return (
        <div className="max-w-3xl mx-auto px-5 py-10 space-y-5">
            <div className="fade-up">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">Pesan ke Admin</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Percakapan Anda dengan admin TAKHIR. {user.role === 'investor' ? 'Admin menjadi penghubung antara Anda dan perusahaan.' : 'Admin akan membalas pertanyaan dan hasil verifikasi data Anda di sini.'}
                </p>
            </div>
            <div className="glass p-4 md:p-6 fade-up" style={{ animationDelay: '.1s' }}>
                {messages === null
                    ? <div className="skeleton h-[26rem]" />
                    : <Chat messages={messages} isMine={(m) => !m.from_admin} onSend={send} otherLabel="Admin"
                        initialText={topic ? `Halo admin, saya tertarik dengan ${topic}. Mohon informasi lebih lanjut.` : ''} />}
            </div>
        </div>
    );
}
