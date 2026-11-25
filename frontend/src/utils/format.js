import API from '../services/api';

const idr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export const rupiah = (n) => (n === null || n === undefined || n === '' ? '-' : idr.format(Number(n)));

export function rupiahShort(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return '-';
    const abs = Math.abs(v);
    const fmt = (x, unit) => `${v < 0 ? '-' : ''}Rp ${(abs / x).toLocaleString('id-ID', { maximumFractionDigits: 1 })} ${unit}`;
    if (abs >= 1e12) return fmt(1e12, 'T');
    if (abs >= 1e9) return fmt(1e9, 'M');
    if (abs >= 1e6) return fmt(1e6, 'jt');
    return idr.format(v);
}

export const dateID = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');

export const mapsEmbed = (address) => `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

export async function openPermit(permitId, toast) {
    const win = window.open('', '_blank');
    try {
        const res = await API.get(`/files/permits/${permitId}`, { responseType: 'blob' });
        const url = URL.createObjectURL(res.data);
        if (win) win.location.href = url;
        else window.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
        if (win) win.close();
        toast(err.response?.status === 403 ? 'Anda tidak punya akses ke dokumen ini.' : 'Gagal membuka dokumen.', 'error');
    }
}
