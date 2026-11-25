import { useCallback, useEffect, useState } from 'react';
import API, { errMsg } from '../services/api';
import { useToast } from './Toast';
import Chat from './Chat';
import { RoleBadge } from './ui';

const who = (u) => (u.role === 'company' && u.company_name ? `${u.company_name}` : u.name);

export default function AdminMessages({ users, activeId, setActiveId, onRead }) {
    const toast = useToast();
    const [threads, setThreads] = useState([]);
    const [chat, setChat] = useState(null);

    const loadThreads = useCallback(() => API.get('/messages/admin/threads').then((r) => setThreads(r.data.data)).catch(() => {}), []);
    const loadChat = useCallback(async (id) => {
        if (!id) return setChat(null);
        try {
            const r = await API.get(`/messages/admin/threads/${id}`);
            setChat({ user: r.data.user, messages: r.data.data });
            loadThreads();
            onRead?.();
        } catch (err) { toast(errMsg(err), 'error'); }
    }, [loadThreads, onRead, toast]);

    useEffect(() => { loadThreads(); const t = setInterval(loadThreads, 10000); return () => clearInterval(t); }, [loadThreads]);
    useEffect(() => {
        loadChat(activeId);
        if (!activeId) return undefined;
        const t = setInterval(() => loadChat(activeId), 8000);
        return () => clearInterval(t);
    }, [activeId, loadChat]);

    const send = async (body) => {
        try { await API.post(`/messages/admin/threads/${activeId}`, { body }); await loadChat(activeId); return true; }
        catch (err) { toast(errMsg(err), 'error'); return false; }
    };

    const startable = users.filter((u) => u.role !== 'admin');

    return (
        <div className="grid lg:grid-cols-3 gap-5">
            <div className="space-y-3">
                <select className="field" value="" onChange={(e) => e.target.value && setActiveId(Number(e.target.value))}>
                    <option value="">+ Mulai percakapan dengan...</option>
                    {startable.map((u) => <option key={u.id} value={u.id}>{who(u)} ({u.role === 'company' ? 'Perusahaan' : 'Investor'})</option>)}
                </select>
                <div className="max-h-[28rem] overflow-y-auto space-y-2 pr-1">
                    {threads.length ? threads.map((t) => (
                        <button key={t.id} onClick={() => setActiveId(t.id)}
                            className={`w-full text-left rounded-xl border p-3 transition cursor-pointer ${activeId === t.id ? 'border-accent bg-accent/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-white text-sm truncate">{who(t)}</p>
                                {t.unread > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">{t.unread}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1"><RoleBadge role={t.role} /></div>
                            <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">{t.last_from_admin ? 'Anda: ' : ''}{t.last_body}</p>
                        </button>
                    )) : <p className="text-sm text-slate-400 text-center py-8">Belum ada percakapan.</p>}
                </div>
            </div>

            <div className="lg:col-span-2">
                {chat ? (
                    <>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <h3 className="font-bold text-white">{who(chat.user)}</h3>
                            <RoleBadge role={chat.user.role} />
                            <span className="text-xs text-slate-400">{chat.user.name} · {chat.user.email}</span>
                        </div>
                        <Chat key={chat.user.id} messages={chat.messages} isMine={(m) => !!m.from_admin} onSend={send} otherLabel={chat.user.role === 'company' ? 'Perusahaan' : 'Investor'} />
                    </>
                ) : (
                    <div className="h-full min-h-[18rem] flex flex-col items-center justify-center text-center text-slate-400 rounded-2xl border border-dashed border-white/15 p-8">
                        <p className="text-4xl mb-2">💬</p>
                        <p className="text-sm">Pilih percakapan di kiri, atau mulai yang baru dengan perusahaan atau investor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
