import { useEffect, useRef, useState } from 'react';

export const STATUS_LABEL = {
    draft: 'Draf',
    pending: 'Menunggu verifikasi',
    approved: 'Terverifikasi',
    rejected: 'Ditolak',
};
export const ROLE_LABEL = { admin: 'Admin', company: 'Perusahaan', investor: 'Investor' };

export const StatusBadge = ({ status }) => <span className={`badge badge-${status}`}>{STATUS_LABEL[status] || status}</span>;
export const RoleBadge = ({ role }) => <span className={`badge badge-${role}`}>{ROLE_LABEL[role] || role}</span>;

export const Spinner = () => <span className="spinner" aria-label="Memuat" />;

export function Reveal({ children, delay = 0, className = '' }) {
    const ref = useRef(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        if (!('IntersectionObserver' in window)) { setShown(true); return undefined; }
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setShown(true); io.disconnect(); }
        }, { threshold: 0.1 });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`reveal ${shown ? 'in' : ''} ${className}`}>
            {children}
        </div>
    );
}

export function CountUp({ to = 0, duration = 1400, format = (n) => Math.round(n).toLocaleString('id-ID') }) {
    const [val, setVal] = useState(0);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVal(to); return undefined; }
        let raf;
        let start;
        const step = (t) => {
            if (start === undefined) start = t;
            const p = Math.min((t - start) / duration, 1);
            setVal(to * (1 - Math.pow(1 - p, 3)));
            if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [to, duration]);

    return <>{format(val)}</>;
}

export const Backdrop = () => (
    <div className="backdrop" aria-hidden="true">
        <div className="backdrop-img" />
        <div className="backdrop-grad" />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
    </div>
);

export const Field = ({ label, hint, children }) => (
    <div>
        <label className="label">{label}</label>
        {children}
        {hint && <p className="hint">{hint}</p>}
    </div>
);
