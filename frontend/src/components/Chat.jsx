import { useEffect, useRef, useState } from 'react';
import { Spinner } from './ui';

const time = (d) => new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Chat({ messages, isMine, onSend, initialText = '', otherLabel = 'Admin', height = 'h-[26rem]' }) {
    const box = useRef(null);
    const [text, setText] = useState(initialText);
    const [sending, setSending] = useState(false);

    useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [messages.length]);

    const send = async (e) => {
        e?.preventDefault();
        if (!text.trim() || sending) return;
        setSending(true);
        const ok = await onSend(text.trim());
        if (ok) setText('');
        setSending(false);
    };
    const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); };

    return (
        <div className="flex flex-col">
            <div ref={box} className={`${height} overflow-y-auto space-y-3 p-4 rounded-2xl bg-black/20 border border-white/10`}>
                {messages.length ? messages.map((m) => {
                    const mine = isMine(m);
                    return (
                        <div key={m.id} className={`bubble-in flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white rounded-br-md' : 'bg-white/10 border border-white/10 text-slate-100 rounded-bl-md'}`}>
                                {!mine && <p className="text-[10px] font-bold uppercase tracking-wide text-sky-200 mb-0.5">{otherLabel}</p>}
                                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                <p className={`text-[10px] mt-1 ${mine ? 'text-sky-100/80' : 'text-slate-400'}`}>{time(m.created_at)}</p>
                            </div>
                        </div>
                    );
                }) : <p className="h-full flex items-center justify-center text-sm text-slate-400 text-center px-6">Belum ada pesan. Tulis pesan pertama di bawah.</p>}
            </div>
            <form onSubmit={send} className="flex items-end gap-2 mt-3">
                <textarea className="field" rows="2" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} placeholder="Tulis pesan... (Enter untuk kirim, Shift+Enter baris baru)" />
                <button className="btn btn-primary h-[3.1rem]" disabled={sending || !text.trim()}>{sending ? <Spinner /> : 'Kirim'}</button>
            </form>
        </div>
    );
}
