import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [historique, setHistorique] = useState(() => {
    try {
      const saved = localStorage.getItem('notifications_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persiste l'historique dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem('notifications_history', JSON.stringify(historique.slice(0, 50)));
    } catch (e) {
      console.warn('Impossible de sauvegarder l\'historique:', e);
    }
  }, [historique]);

  // Affiche un toast
  const afficherToast = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      title: notification.title || 'Notification',
      body: notification.body || '',
      icon: notification.icon || '/images/logo-lebougui.jpeg',
      data: notification.data || {},
    };

    setToasts((prev) => [...prev, toast]);

    // Ajoute à l'historique
    setHistorique((prev) => [
      { ...toast, date: new Date().toISOString(), lu: false },
      ...prev.slice(0, 49),
    ]);

    // Auto-suppression après 6 secondes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 30000);

    return id;
  }, []);

  const fermerToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const marquerToutLu = useCallback(() => {
    setHistorique((prev) => prev.map((n) => ({ ...n, lu: true })));
  }, []);

  const viderHistorique = useCallback(() => {
    setHistorique([]);
  }, []);

  // Nombre de notifications non lues
  const nonLues = useMemo(
    () => historique.filter((n) => !n.lu).length,
    [historique]
  );

  // Expose une fonction globale pour déclencher depuis n'importe où (firebase.js)
  useEffect(() => {
    window.__afficherNotification = afficherToast;
    return () => {
      delete window.__afficherNotification;
    };
  }, [afficherToast]);

  const value = useMemo(
    () => ({
      toasts,
      historique,
      nonLues,
      afficherToast,
      fermerToast,
      marquerToutLu,
      viderHistorique,
    }),
    [toasts, historique, nonLues, afficherToast, fermerToast, marquerToutLu, viderHistorique]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications doit être utilisé dans NotificationProvider');
  }
  return ctx;
}

export default NotificationContext;