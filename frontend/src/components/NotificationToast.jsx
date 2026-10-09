import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Fish, CheckCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationToast() {
  const { toasts, fermerToast } = useNotifications();
  const navigate = useNavigate();

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 z-[9999] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => fermerToast(toast.id)}
          onOpen={() => {
            const url = toast.data?.url || '/acheteur';
            navigate(url);
            fermerToast(toast.id);
          }}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose, onOpen }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const type = toast.data?.type || 'info';
  const estNouveauProduit = type === 'nouvelle_publication' || type === 'nouveau_produit';

  return (
    <div
      onClick={onOpen}
      className={`pointer-events-auto cursor-pointer overflow-hidden rounded-2xl border border-white/20 bg-[#0C3B4A] shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icône */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            estNouveauProduit
              ? 'bg-[#FF6B4A]/20 text-[#FF6B4A]'
              : 'bg-[#5FD9C4]/20 text-[#5FD9C4]'
          }`}
        >
          {estNouveauProduit ? <Fish size={18} /> : <Bell size={18} />}
        </div>

        {/* Contenu */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">
            {toast.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-white/70">
            {toast.body}
          </p>
          {estNouveauProduit && (
            <p className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#5FD9C4]">
              <CheckCircle size={10} />
              Appuyez pour voir le produit
            </p>
          )}
        </div>

        {/* Fermer */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
        >
          <X size={12} />
        </button>
      </div>

      {/* Barre de progression */}
      <div className="h-0.5 w-full bg-white/10">
        <div
          className="h-full origin-left bg-[#FF6B4A]"
          style={{ animation: 'shrink 6s linear forwards' }}
        />
      </div>
    </div>
  );
}