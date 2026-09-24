import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Plus, Trash2, CheckCircle, XCircle,
  Fish, Star, MapPin, Power, X,
} from 'lucide-react';
import { useCommandes } from '../../context/CommandeContext';
import { useAuth } from '../../context/AuthContext';
import { usePublications } from '../../context/PublicationContext';
import AcheteurHeader from '../../components/AcheteurHeader';
import AcheteurBottomNav from '../../components/AcheteurBottomNav';
import useCartCount from '../../hooks/useCartCount';

export default function Alertes() {
  const navigate = useNavigate();
  const { estPremium } = useAuth();
  const { alertes, chargerAlertes, creerAlerte, desactiverAlerte, supprimerAlerte } = useCommandes();
  const { publications } = usePublications();
  const cartCount = useCartCount();

  const [nouvelleAlerte, setNouvelleAlerte] = useState({ nomPoisson: '', zone: '' });
  const [afficherModal, setAfficherModal] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState('active');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/connexion');
      return;
    }
    chargerAlertes();
  }, [navigate, chargerAlertes]);

  const poissonsDisponibles = [...new Set((publications.produits || []).map((p) => p.nom))].filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nouvelleAlerte.nomPoisson.trim()) {
      setErreur('Veuillez indiquer un nom de poisson');
      return;
    }

    setChargement(true);
    setErreur(null);

    try {
      const result = await creerAlerte(nouvelleAlerte.nomPoisson, null, null);

      if (result.success) {
        setNouvelleAlerte({ nomPoisson: '', zone: '' });
        setAfficherModal(false);
        setSucces('Alerte créée avec succès !');
        setTimeout(() => setSucces(null), 3000);
      } else {
        setErreur(result.error || "Erreur lors de la création de l'alerte");
      }
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue');
    } finally {
      setChargement(false);
    }
  };

  const handleDelete = async (alerteId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette alerte ?')) {
      try {
        await supprimerAlerte(alerteId);
        setSucces('Alerte supprimée');
        setTimeout(() => setSucces(null), 3000);
      } catch (err) {
        setErreur(err.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleToggleStatut = async (alerte) => {
    try {
      await desactiverAlerte(alerte.id);
      setSucces("Statut de l'alerte mis à jour");
      setTimeout(() => setSucces(null), 3000);
    } catch (err) {
      setErreur(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const filteredAlertes = (alertes?.liste || []).filter((alerte) => {
    if (filtreStatut === 'toutes') return true;
    return alerte.statut?.toLowerCase() === filtreStatut?.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        {/* HEADER HÉRITÉ */}
        <AcheteurHeader
          title="Mes Alertes"
          subtitle={estPremium() ? 'Suivi en temps réel' : 'Passez Premium pour activer'}
          cartCount={cartCount}
          showSearch={false}
        />

        {/* BOUTON ACTION SOUS LE HEADER */}
        <div className="flex justify-end px-5 pt-3 pb-1 shrink-0">
          {!estPremium() ? (
            <button
              type="button"
              onClick={() => navigate('/acheteur/premium')}
              className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600"
            >
              <Star size={13} fill="currentColor" />
              <span>Premium</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAfficherModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#FF6B4A] px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E85A39]"
            >
              <Plus size={14} />
              <span>Nouvelle alerte</span>
            </button>
          )}
        </div>

        {/* CONTENU SCROLLABLE */}
        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-24 pt-3">

          {/* Messages d'erreur / succès */}
          {erreur && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <XCircle size={16} className="shrink-0 text-red-500" />
              <span className="flex-1">{erreur}</span>
              <button onClick={() => setErreur(null)} className="font-bold underline">
                Fermer
              </button>
            </div>
          )}

          {succes && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <CheckCircle size={16} className="shrink-0 text-emerald-500" />
              <span className="flex-1">{succes}</span>
            </div>
          )}

          {/* Filtres */}
          <div className="mb-5 flex gap-1 bg-stone-200/60 p-1 rounded-2xl">
            {['active', 'inactive', 'toutes'].map((statut) => (
              <button
                key={statut}
                type="button"
                onClick={() => setFiltreStatut(statut)}
                className={`flex-1 rounded-xl py-1.5 text-xs font-bold capitalize transition ${
                  filtreStatut === statut
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {statut}
              </button>
            ))}
          </div>

          {/* Liste des alertes */}
          <div className="space-y-2.5">
            {alertes?.chargement ? (
              <div className="py-12 text-center text-xs text-stone-400">Chargement...</div>
            ) : filteredAlertes.length === 0 ? (
              <div className="rounded-[28px] border border-stone-200/80 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                  <Bell size={22} />
                </div>
                <h3 className="text-xs font-bold text-stone-900 mb-1">Aucune alerte</h3>
                <p className="text-[11px] text-stone-400 max-w-[200px] mx-auto">
                  {estPremium()
                    ? 'Ajoutez vos poissons favoris pour être notifié.'
                    : 'Réservé aux membres Premium.'}
                </p>
              </div>
            ) : (
              filteredAlertes.map((alerte, index) => (
                <div
                  key={alerte.id || index}
                  className="flex items-center justify-between rounded-[22px] border border-stone-200/80 bg-white p-3.5 shadow-sm transition hover:border-stone-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B4A]">
                      <Fish size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="truncate text-xs font-bold text-stone-900">
                          {alerte.nom_poisson}
                        </h3>
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            alerte.statut === 'active' ? 'bg-emerald-500' : 'bg-stone-300'
                          }`}
                        />
                      </div>
                      {alerte.zone ? (
                        <p className="flex items-center gap-1 text-[11px] text-stone-500 truncate">
                          <MapPin size={11} className="text-stone-400" /> {alerte.zone}
                        </p>
                      ) : (
                        <p className="text-[11px] text-stone-400">Toutes zones</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatut(alerte)}
                      title={alerte.statut === 'active' ? 'Désactiver' : 'Activer'}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                        alerte.statut === 'active'
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      <Power size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(alerte.id)}
                      title="Supprimer"
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Produits correspondants */}
          {estPremium() && filteredAlertes.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-stone-400">
                Disponibles actuellement
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {(publications.produits || [])
                  .filter((produit) => {
                    const alertePoissons = filteredAlertes.map((a) =>
                      a.nom_poisson.toLowerCase()
                    );
                    return alertePoissons.includes((produit.nom || '').toLowerCase());
                  })
                  .slice(0, 4)
                  .map((produit) => (
                    <div
                      key={produit.id}
                      onClick={() => navigate(`/acheteur/produit/${produit.id}`)}
                      className="cursor-pointer overflow-hidden rounded-[20px] border border-stone-200/85 bg-white p-2 shadow-sm transition hover:shadow"
                    >
                      <div className="relative h-24 w-full overflow-hidden rounded-xl bg-stone-100">
                        <img
                          src={
                            produit.media ||
                            produit.image ||
                            'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={produit.nom}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h4 className="mt-2 truncate text-xs font-bold text-stone-900">
                        {produit.nom}
                      </h4>
                      <p className="text-[11px] font-black text-[#FF6B4A]">
                        {new Intl.NumberFormat('fr-FR').format(produit.prix || 0)} FCFA
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </main>

        {/* MODALE DE CRÉATION */}
        {afficherModal && (
          <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] bg-[#FAF6F0] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-stone-900">Nouvelle alerte poisson</h2>
                <button
                  onClick={() => setAfficherModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200/60 text-stone-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-stone-700">
                    Nom du poisson
                  </label>
                  <input
                    type="text"
                    list="poissons"
                    placeholder="Ex: Thiof, Capitaine..."
                    value={nouvelleAlerte.nomPoisson}
                    onChange={(e) =>
                      setNouvelleAlerte({ ...nouvelleAlerte, nomPoisson: e.target.value })
                    }
                    className="w-full rounded-2xl border border-stone-200 bg-white px-3.5 py-3 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-[#FF6B4A]/20"
                    required
                  />
                  <datalist id="poissons">
                    {poissonsDisponibles.map((poisson, index) => (
                      <option key={index} value={poisson} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-stone-700">
                    Zone (facultatif)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Dakar, Soumbédioune..."
                    value={nouvelleAlerte.zone}
                    onChange={(e) =>
                      setNouvelleAlerte({ ...nouvelleAlerte, zone: e.target.value })
                    }
                    className="w-full rounded-2xl border border-stone-200 bg-white px-3.5 py-3 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-[#FF6B4A]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={chargement}
                  className="w-full rounded-2xl bg-[#FF6B4A] py-3.5 text-xs font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#E85A39]"
                >
                  {chargement ? 'Création...' : "Créer l'alerte"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* BOTTOM NAV HÉRITÉ */}
        <AcheteurBottomNav />
      </div>
    </div>
  );
}