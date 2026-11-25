import { useState } from 'react';
import API, { errMsg } from '../services/api';
import { useToast } from './Toast';
import { Field, Spinner } from './ui';

const EMPTY = { name: '', email: '', whatsapp: '', message: '' };

export default function ContactUs() {
    const toast = useToast();
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post('/contact', form);
            toast('Pesan terkirim. Terima kasih telah menghubungi kami!');
            setForm(EMPTY);
        } catch (err) {
            toast(errMsg(err, 'Gagal mengirim pesan.'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="kontak" className="glass p-6 md:p-10">
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">Hubungi Kami</h2>
                <p className="text-sm text-slate-400 mt-2">Ada pertanyaan tentang direktori atau peluang investasi? Kirim pesan ke admin.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Field label="Nama"><input className="field" required value={form.name} onChange={set('name')} placeholder="Nama Anda" /></Field>
                    <Field label="Email"><input className="field" type="email" required value={form.email} onChange={set('email')} placeholder="email@domain.com" /></Field>
                    <Field label="No WhatsApp"><input className="field" value={form.whatsapp} onChange={set('whatsapp')} placeholder="08xxxxxxxxxx" /></Field>
                </div>
                <Field label="Pesan"><textarea className="field" rows="4" required value={form.message} onChange={set('message')} placeholder="Tuliskan pesan atau pertanyaan Anda..." /></Field>
                <div className="text-center">
                    <button type="submit" disabled={loading} className="btn btn-primary px-10">{loading ? <><Spinner /> Mengirim...</> : 'Kirim Pesan'}</button>
                </div>
            </form>
        </section>
    );
}
