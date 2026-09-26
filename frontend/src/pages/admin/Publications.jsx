import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Fish,
  Info,
  MapPin,
  Clock,
  AlertTriangle,
  Loader2,
  X,
  Eye,
  Edit3,
  Check,
  Mic,
  Image as ImageIcon,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { AdminService } from '../../services/adminService';

// ============================================================
// HELPERS
// ============================================================

const formatPrice = (price) => {
  return `${new Intl.NumberFormat('fr-FR').format(
    Math.round(Number(price) || 0)
  )} FCFA`;
};

const formatDate = (date) => {
  if (!date) return '';

  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const scoreCouleur = (score) => {
  const s = Number(score) || 0;

  if (s >= 0.6) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      label: 'Moyen',
    };
  }

  if (s >= 0.4) {
    return {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      label: 'Faible',
    };
  }

  return {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    label: 'Très faible',
  };
};

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function AdminPublications() {
  const [produits, setProduits] = useState([]);
  const [informations, setInformations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('produits');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);

      const data = await AdminService.getPublicationsEnAttente();

      setProduits(data?.produits || []);
      setInformations(data?.informations || []);
    } catch (err) {
      console.error('Erreur chargement publications :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const list = tab === 'produits' ? produits : informations;

    if (!search.trim()) {
      return list;
    }

    const q = search.toLowerCase().trim();

    return list.filter((publication) => {
      const nomPecheur = `${publication.pecheur_prenom || ''} ${
        publication.pecheur_nom || ''
      }`.toLowerCase();

      const nomProduit = (publication.nom || '').toLowerCase();
      const description = (publication.description || '').toLowerCase();
      const zone = (publication.adresse || '').toLowerCase();

      return (
        nomPecheur.includes(q) ||
        nomProduit.includes(q) ||
        description.includes(q) ||
        zone.includes(q)
      );
    });
  }, [produits, informations, tab, search]);

  const ouvrirVerification = (publication, type) => {
    setSelected({
      ...publication,
      _type: type,
    });
  };

  return (
    <AdminLayout
      title="Publications à modérer"
      subtitle="Vérifiez les publications dont le score IA est insuffisant"
    >
      {/* ========================================================
          STATS
      ======================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total en attente"
          value={produits.length + informations.length}
          icon={Clock}
          color="#FF6B4A"
        />

        <StatCard
          label="Produits"
          value={produits.length}
          icon={Fish}
          color="#0C3B4A"
        />

        <StatCard
          label="Informations"
          value={informations.length}
          icon={Info}
          color="#0A8A5F"
        />
      </div>

      {/* ========================================================
          TABS + RECHERCHE
      ======================================================== */}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab('produits')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              tab === 'produits'
                ? 'bg-[#0C3B4A] text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Fish size={14} />

            Produits

            <span
              className={`flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                tab === 'produits'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {produits.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('informations')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              tab === 'informations'
                ? 'bg-[#0A8A5F] text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Info size={14} />

            Informations

            <span
              className={`flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                tab === 'informations'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {informations.length}
            </span>
          </button>
        </div>

        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Pêcheur, produit, zone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-72 rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-[#FF6B4A]"
          />
        </div>
      </div>

      {/* ========================================================
          LISTE
      ======================================================== */}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2
            size={32}
            className="animate-spin text-[#FF6B4A]"
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 size={26} className="text-emerald-600" />
          </div>

          <p className="text-sm font-bold text-slate-700">
            Aucune publication en attente
          </p>

          <p className="text-xs text-slate-500">
            {search
              ? 'Aucun résultat pour cette recherche.'
              : 'Tout est à jour.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((publication) => (
            <PublicationCard
              key={`${publication.type}-${publication.id}`}
              publication={publication}
              onVerifier={() =>
                ouvrirVerification(
                  publication,
                  publication.type
                )
              }
            />
          ))}
        </div>
      )}

      {/* ========================================================
          MODALE
      ======================================================== */}

      {selected && (
        <ModalVerification
          publication={selected}
          onClose={() => setSelected(null)}
          onSuccess={async () => {
            setSelected(null);
            await load();
          }}
          loading={actionLoading}
          setLoading={setActionLoading}
        />
      )}
    </AdminLayout>
  );
}

// ============================================================
// CARTE PUBLICATION
// ============================================================

function PublicationCard({ publication, onVerifier }) {
  const isProduit = publication.type === 'produit';

  const score =
    Number(publication.score_confiance_ia) || 0;

  const scoreStyle = scoreCouleur(score);

  const pecheurNom =
    `${publication.pecheur_prenom || ''} ${
      publication.pecheur_nom || ''
    }`.trim() || 'Pêcheur';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex gap-4 p-4">
        {/* IMAGE */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          {publication.media ? (
            <img
              src={publication.media}
              alt=""
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src =
                  '/images/fallback.png';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-600">
              <Info size={28} />
            </div>
          )}
        </div>

        {/* CONTENU */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    isProduit
                      ? 'bg-[#0C3B4A]/10 text-[#0C3B4A]'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {isProduit ? (
                    <Fish size={10} />
                  ) : (
                    <Info size={10} />
                  )}

                  {isProduit ? 'Produit' : 'Information'}
                </span>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${scoreStyle.bg} ${scoreStyle.text}`}
                >
                  <AlertTriangle size={10} />

                  Score IA : {(score * 100).toFixed(0)}%
                </span>
              </div>

              {isProduit ? (
                <h3 className="mt-1.5 truncate text-sm font-black text-slate-900">
                  {publication.nom || 'Sans nom'}
                </h3>
              ) : (
                <p className="mt-1.5 line-clamp-2 text-sm font-bold text-slate-900">
                  {publication.description ||
                    'Sans description'}
                </p>
              )}
            </div>
          </div>

          {/* INFOS */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            {isProduit && (
              <>
                <span className="font-bold text-slate-900">
                  {formatPrice(publication.prix)}
                </span>

                <span>·</span>

                <span>
                  {publication.quantite} kg
                </span>
              </>
            )}

            {publication.adresse && (
              <>
                <span>·</span>

                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  {publication.adresse}
                </span>
              </>
            )}
          </div>

          {/* PECHEUR + ACTION */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0C3B4A] text-[10px] font-bold text-white">
                {pecheurNom
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-slate-800">
                  {pecheurNom}
                </p>

                <p className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock size={9} />

                  {formatDate(
                    publication.date_publication
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onVerifier}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#FF6B4A] px-3.5 py-2 text-[11px] font-black text-white shadow-sm transition hover:bg-[#E85A39] active:scale-[0.98]"
            >
              <Eye size={12} />
              Vérifier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODALE DE VERIFICATION
// ============================================================

function ModalVerification({
  publication,
  onClose,
  onSuccess,
  loading,
  setLoading,
}) {
  const isProduit = publication.type === 'produit';

  const score =
    Number(publication.score_confiance_ia) || 0;

  const [corrections, setCorrections] = useState({
    nom: publication.nom || '',
    categorie:
      publication.categorie || 'poisson',
    prix: publication.prix || '',
    quantite: publication.quantite || '',
    adresse: publication.adresse || '',
    description: publication.description || '',
  });

  const [erreur, setErreur] = useState('');
  const [feedback, setFeedback] = useState(null);

  const handleChange = (champ, valeur) => {
    setCorrections((previous) => ({
      ...previous,
      [champ]: valeur,
    }));

    if (erreur) {
      setErreur('');
    }
  };

  const handleValider = async () => {
    if (isProduit) {
      if (!corrections.nom?.trim()) {
        setErreur(
          'Le nom du produit est obligatoire'
        );
        return;
      }

      if (
        !corrections.prix ||
        Number(corrections.prix) <= 0
      ) {
        setErreur(
          'Le prix doit être un nombre positif'
        );
        return;
      }

      if (
        !corrections.quantite ||
        Number(corrections.quantite) <= 0
      ) {
        setErreur(
          'La quantité doit être un nombre positif'
        );
        return;
      }
    } else {
      if (!corrections.description?.trim()) {
        setErreur(
          'La description est obligatoire'
        );
        return;
      }
    }

    if (!corrections.adresse?.trim()) {
      setErreur(
        'La zone de pêche est obligatoire'
      );
      return;
    }

    setLoading(true);

    try {
      const payload = isProduit
        ? {
            nom: corrections.nom,
            categorie: corrections.categorie,
            prix: Number(corrections.prix),
            quantite: Number(corrections.quantite),
            adresse: corrections.adresse,
          }
        : {
            description: corrections.description,
            adresse: corrections.adresse,
          };

      await AdminService.validerPublication(
        publication.id,
        publication.type,
        payload
      );

      setFeedback({
        type: 'success',
        text: 'Publication validée et visible sur le marché.',
      });

      setTimeout(() => {
        onSuccess();
      }, 900);
    } catch (err) {
      setErreur(
        err.response?.data?.erreur ||
          'Erreur lors de la validation'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRejeter = async () => {
    const motif = window.prompt(
      'Motif du rejet :'
    );

    if (motif === null) {
      return;
    }

    setLoading(true);

    try {
      await AdminService.rejeterPublication(
        publication.id,
        publication.type,
        motif || 'Non conforme'
      );

      setFeedback({
        type: 'success',
        text: 'Publication rejetée.',
      });

      setTimeout(() => {
        onSuccess();
      }, 900);
    } catch (err) {
      setErreur(
        err.response?.data?.erreur ||
          'Erreur lors du rejet'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Vérifier la publication
            </h2>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Score IA :
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                  scoreCouleur(score).bg
                } ${scoreCouleur(score).text}`}
              >
                <AlertTriangle size={10} />

                {(score * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENU */}

        <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto p-6">
          {/* MEDIAS */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {publication.media && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <ImageIcon size={11} />
                  Photo du produit
                </p>

                <img
                  src={publication.media}
                  alt=""
                  className="w-full rounded-2xl border border-slate-200 object-cover"
                  style={{ maxHeight: 220 }}
                />
              </div>
            )}

            {publication.audio && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <Mic size={11} />
                  Note vocale
                </p>

                <audio
                  controls
                  src={publication.audio}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2"
                />
              </div>
            )}
          </div>

          {/* TRANSCRIPTIONS */}

          {(publication.texte_transcrit ||
            publication.texte_traduit) && (
            <div className="space-y-2">
              {publication.texte_transcrit && (
                <div>
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Transcription (wolof)
                  </p>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3 text-xs italic text-slate-700">
                    « {publication.texte_transcrit} »
                  </div>
                </div>
              )}

              {publication.texte_traduit && (
                <div>
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Traduction
                  </p>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
                    « {publication.texte_traduit} »
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FORMULAIRE */}

          <div className="space-y-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Edit3 size={12} />
              Corriger les informations
            </p>

            {isProduit ? (
              <>
                <FieldInput
                  label="Nom du produit"
                  value={corrections.nom}
                  onChange={(value) =>
                    handleChange('nom', value)
                  }
                  placeholder="Ex : Thiof, Sardinelle..."
                  required
                />

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Catégorie
                  </label>

                  <select
                    value={corrections.categorie}
                    onChange={(event) =>
                      handleChange(
                        'categorie',
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF6B4A]"
                  >
                    <option value="poisson">
                      Poisson
                    </option>

                    <option value="fruit_de_mer">
                      Fruit de mer
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FieldInput
                    label="Prix (FCFA/kg)"
                    value={corrections.prix}
                    onChange={(value) =>
                      handleChange('prix', value)
                    }
                    type="number"
                    placeholder="0"
                    required
                  />

                  <FieldInput
                    label="Quantité (kg)"
                    value={corrections.quantite}
                    onChange={(value) =>
                      handleChange(
                        'quantite',
                        value
                      )
                    }
                    type="number"
                    placeholder="0"
                    required
                  />
                </div>
              </>
            ) : (
              <FieldInput
                label="Description"
                value={corrections.description}
                onChange={(value) =>
                  handleChange(
                    'description',
                    value
                  )
                }
                type="textarea"
                placeholder="Décrivez l'information..."
                required
              />
            )}

            <FieldInput
              label="Zone de pêche"
              value={corrections.adresse}
              onChange={(value) =>
                handleChange('adresse', value)
              }
              placeholder="Ex : Soumbédioune, Yoff, Bargny..."
              required
            />
          </div>

          {/* ERREUR */}

          {erreur && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <XCircle
                size={14}
                className="shrink-0"
              />

              <span>{erreur}</span>
            </div>
          )}

          {/* FEEDBACK */}

          {feedback && (
            <div
              className={`flex items-center gap-2 rounded-2xl border p-3 text-xs ${
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <CheckCircle2
                size={14}
                className="shrink-0"
              />

              <span>{feedback.text}</span>
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button
            type="button"
            onClick={handleRejeter}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
          >
            <XCircle size={13} />
            Rejeter
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleValider}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-[#FF6B4A] px-5 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E85A39] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    size={13}
                    className="animate-spin"
                  />
                  Validation...
                </>
              ) : (
                <>
                  <Check size={13} />
                  Valider & publier
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${color}12`,
          color,
        }}
      >
        <Icon size={18} />
      </div>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// FIELD INPUT
// ============================================================

function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}

        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </label>

      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none transition focus:border-[#FF6B4A]"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none transition focus:border-[#FF6B4A]"
        />
      )}
    </div>
  );
}