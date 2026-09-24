import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function useCartCount() {
  const { utilisateur } = useAuth();
  const [count, setCount] = useState(0);

  const cartKey = utilisateur?.id
    ? `panier_acheteur_${utilisateur.id}`
    : 'panier_acheteur_guest';

  useEffect(() => {
    const lire = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(cartKey) || '[]');
        setCount(
          Array.isArray(saved)
            ? saved.reduce((t, i) => t + Number(i.quantite || 0), 0)
            : 0
        );
      } catch {
        setCount(0);
      }
    };
    lire();
    window.addEventListener('storage', lire);
    window.addEventListener('cart:update', lire);
    return () => {
      window.removeEventListener('storage', lire);
      window.removeEventListener('cart:update', lire);
    };
  }, [cartKey]);

  return count;
}