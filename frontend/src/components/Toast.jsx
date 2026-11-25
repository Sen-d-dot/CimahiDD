import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

const STYLE = {
    success: 'border-emerald-400/50 text-emerald-100',
    error: 'border-red-400/50 text-red-100',
    info: 'border-sky-400/50 text-sky-100',
};
const ICON = { success: '✓', error: '!', info: 'i' };

export function ToastProvider({ children }) {
    const [items, setItems] = useState([]);

    const toast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setItems((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
    }, []);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 w-[min(22rem,calc(100vw-2rem))]" aria-live="polite">
                {items.map((t) => (
                    <div key={t.id} className={`toast-in glass !rounded-xl flex items-start gap-3 px-4 py-3 text-sm ${STYLE[t.type]}`}>
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">{ICON[t.type]}</span>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
