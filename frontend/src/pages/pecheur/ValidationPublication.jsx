import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, X, AlertTriangle, Package, Info, MapPin, Type, DollarSign, Scale, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePublications } from '../../context/PublicationContext';
import { PublicationService } from '../../services/publicationService';

const ValidationPublication = () => {
  const { estPecheur } = useAuth();
  const { analyserPublication, creerProduit, creerInformation, publierDirectement } = usePublications();
  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer les données de l'analyse
  const analyseData = location.state?.analyseData;
  const audioBlob = location.state?.audioBlob;
  const mediaFile = location.state?.mediaFile;

  const [formData, setFormData] = useState({
    type: analyseData?.type || 'produit',
    nom: analyseData?.suggestion?.nom || '',
    categorie: analyseData?.suggestion?.categorie || '',
    prix: analyseData?.suggestion?.prix || '',
    quantite: analyseData?.suggestion?.quantite || '',
    description: analyseData?.suggestion?.description || analyseData?.texte_traduit || '',
    adresse: analyseData?.suggestion?.adresse || '',
    latitude: analyseData?.suggestion?.latitude || null,
    longitude: analyseData?.suggestion?.longitude || null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  useEffect(() => {
    if (!analyseData && !audioBlob) {
      // Si pas de données d'analyse, rediriger
      navigate('/pecheur/publication/nouvelle', { replace: true });
      return;
    }

    // Créer les URL d'aperçu
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    }

    if (mediaFile) {
      const url = URL.createObjectURL(mediaFile);
      setMediaPreview(url);
    }

    // Nettoyer les URLs
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    };
  }, [analyseData, audioBlob, mediaFile, audioUrl, mediaPreview]);

  useEffect(() => {
    if (!estPecheur()) {
      navigate('/connexion', { replace: true });
    }
  }, [estPecheur, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur si elle existe
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const validate = () => {
    const newErrors = {};

    if (formData.type === 'produit') {
      if (!formData.nom || formData.nom.trim() === '') {
        newErrors.nom = 'Le nom du produit est obligatoire';
      }
      if (!formData.categorie || formData.categorie.trim() === '') {
        newErrors.categorie = 'La catégorie est obligatoire';
      }
      if (!formData.prix || isNaN(formData.prix) || Number(formData.prix) <= 0) {
        newErrors.prix = 'Le prix doit être un nombre positif';
      }
      if (!formData.quantite || isNaN(formData.quantite) || Number(formData.quantite) <= 0) {
        newErrors.quantite = 'La quantité doit être un nombre positif';
      }
    } else {
      if (!formData.description || formData.description.trim() === '') {
        newErrors.description = 'La description est obligatoire';
      }
    }

    if (!formData.adresse || formData.adresse.trim() === '') {
      newErrors.adresse = 'L\'adresse est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setSuccess(null);

    try {
      const payload = {
        audio: audioBlob,
        media: mediaFile,
        adresse: formData.adresse,
        latitude: formData.latitude,
        longitude: formData.longitude,
        texte_transcrit: analyseData?.texte_transcrit || '',
        texte_traduit: analyseData?.texte_traduit || '',
        score_confiance_ia: analyseData?.score_confiance || 0.0,
      };

      if (formData.type === 'produit') {
        payload.nom = formData.nom;
        payload.categorie = formData.categorie;
        payload.prix = Number(formData.prix);
        payload.quantite = Number(formData.quantite);
        
        const response = await creerProduit(payload);
        if (response.success) {
          setSuccess({ type: 'success', message: 'Produit publié avec succès !' });
          setTimeout(() => navigate('/pecheur/publications'), 1500);
        } else {
          setSuccess({ type: 'error', message: response.error || 'Erreur lors de la publication' });
        }
      } else {
        payload.description = formData.description;
        
        const response = await creerInformation(payload);
        if (response.success) {
          setSuccess({ type: 'success', message: 'Information publiée avec succès !' });
          setTimeout(() => navigate('/pecheur/publications'), 1500);
        } else {
          setSuccess({ type: 'error', message: response.error || 'Erreur lors de la publication' });
        }
      }
    } catch (err) {
      console.error('Erreur de publication:', err);
      setSuccess({ 
        type: 'error', 
        message: err.response?.data?.erreur || 
                 err.response?.data?.detail ||
                 err.message || 
                 'Erreur lors de la publication'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublierDirectement = async () => {
    setLoading(true);
    setSuccess(null);

    try {
      const response = await publierDirectement(audioBlob, mediaFile);
      if (response.success) {
        setSuccess({ 
          type: 'success', 
          message: response.data.en_attente_admin 
            ? 'Publication envoyée pour validation par un administrateur.'
            : 'Publication publiée avec succès !'
        });
        setTimeout(() => navigate('/pecheur/publications'), 1500);
      } else {
        setSuccess({ type: 'error', message: response.error || 'Erreur lors de la publication' });
      }
    } catch (err) {
      console.error('Erreur de publication directe:', err);
      setSuccess({ 
        type: 'error', 
        message: err.response?.data?.erreur || 
                 err.response?.data?.detail ||
                 err.message || 
                 'Erreur lors de la publication'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!analyseData && !audioBlob) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-slate-800 font-sans pb-28 max-w-md mx-auto shadow-2xl relative">
      {/* Header */}
      <header className="p-5 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full bg-white shadow-sm border border-slate-200/80"
        >
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">
            ÉTAPE 2 SUR 2
          </p>
          <h1 className="text-lg font-bold text-slate-900">Valider la publication</h1>
        </div>

        <div className="w-10" />
      </header>

      {/* Aperçu média */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">
            Aperçu de l'analyse
          </p>

          {audioUrl && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 mb-1">Audio enregistrée:</p>
              <audio controls src={audioUrl} className="w-full h-8 rounded-xl" />
            </div>
          )}

          {mediaPreview && (
            <div className="relative rounded-xl overflow-hidden border border-slate-200/60 mb-3">
              <img
                src={mediaPreview}
                alt="Aperçu"
                className="w-full h-32 object-cover"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-bold uppercase text-teal-700">
                Photo
              </span>
            </div>
          )}

          {!mediaPreview && formData.type === 'produit' && (
            <div className="h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs gap-1 mb-3">
              <Camera size={18} />
              <span>Pas de photo - Produit sans image</span>
            </div>
          )}

          {/* Confiance IA */}
          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-${analyseData?.score_confiance && analyseData.score_confiance >= 0.7 ? 'emerald' : analyseData?.score_confiance && analyseData.score_confiance >= 0.5 ? 'amber' : 'red'}-500`}
                style={{
                  width: `${((analyseData?.score_confiance || 0) * 100).toFixed(0)}%`
                }}
              />
            </div>
            <span className="text-slate-500">
              Confiance: {((analyseData?.score_confiance || 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Suggestions IA */}
      <div className="px-5 mb-4">
        <div className="bg-teal-50 rounded-2xl p-4 border border-teal-200/60">
          <p className="text-[10px] font-bold tracking-widest text-teal-600 uppercase mb-3">
            Suggestions de l'IA
          </p>
          
          {analyseData?.texte_traduit && (
            <div className="mb-3">
              <p className="text-xs text-slate-600 mb-1">Traduction:</p>
              <p className="text-sm text-slate-800 p-2 bg-white rounded-xl">
                {analyseData.texte_traduit}
              </p>
            </div>
          )}

          {formData.type === 'produit' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium text-slate-600">Nom:</span>
                <p className="text-slate-800">{analyseData?.suggestion?.nom || 'Non détecté'}</p>
              </div>
              <div>
                <span className="font-medium text-slate-600">Catégorie:</span>
                <p className="text-slate-800">{analyseData?.suggestion?.categorie || 'Non détecté'}</p>
              </div>
              <div>
                <span className="font-medium text-slate-600">Prix:</span>
                <p className="text-slate-800">{analyseData?.suggestion?.prix || 'Non détecté'} FCFA/kg</p>
              </div>
              <div>
                <span className="font-medium text-slate-600">Quantité:</span>
                <p className="text-slate-800">{analyseData?.suggestion?.quantite || 'Non détecté'} kg</p>
              </div>
            </div>
          )}

          {formData.type === 'information' && (
            <div>
              <span className="font-medium text-slate-600">Description:</span>
              <p className="text-slate-800">{analyseData?.suggestion?.description || analyseData?.texte_traduit || 'Non détecté'}</p>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-teal-200/60">
            <span className="font-medium text-slate-600">Adresse:</span>
            <p className="text-slate-800">{analyseData?.suggestion?.adresse || 'Non détecté'}</p>
          </div>
        </div>
      </div>

      {/* Formulaire de validation */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">
            Modifier les informations si nécessaire
          </p>

          {/* Sélection du type */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleTypeChange('produit')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                formData.type === 'produit'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Package size={14} />
              Produit
            </button>
            <button
              onClick={() => handleTypeChange('information')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                formData.type === 'information'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Info size={14} />
              Information
            </button>
          </div>

          {/* Champs spécifiques au type */}
          {formData.type === 'produit' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Type size={12} /> Nom du produit
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Ex: Thiof, Carpe..."
                  className={`w-full py-2 px-3 rounded-xl text-sm border ${
                    errors.nom ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Package size={12} /> Catégorie
                </label>
                <select
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleChange}
                  className={`w-full py-2 px-3 rounded-xl text-sm border ${
                    errors.categorie ? 'border-red-500' : 'border-slate-200'
                  }`}
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="poisson">Poisson</option>
                  <option value="crustace">Crustacé</option>
                  <option value="coquillage">Coquillage</option>
                  <option value="autre">Autre</option>
                </select>
                {errors.categorie && <p className="text-xs text-red-500 mt-1">{errors.categorie}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <DollarSign size={12} /> Prix (FCFA/kg)
                  </label>
                  <input
                    type="number"
                    name="prix"
                    value={formData.prix}
                    onChange={handleChange}
                    placeholder="0"
                    className={`w-full py-2 px-3 rounded-xl text-sm border ${
                      errors.prix ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {errors.prix && <p className="text-xs text-red-500 mt-1">{errors.prix}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Scale size={12} /> Quantité (kg)
                  </label>
                  <input
                    type="number"
                    name="quantite"
                    value={formData.quantite}
                    onChange={handleChange}
                    placeholder="0"
                    className={`w-full py-2 px-3 rounded-xl text-sm border ${
                      errors.quantite ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {errors.quantite && <p className="text-xs text-red-500 mt-1">{errors.quantite}</p>}
                </div>
              </div>
            </div>
          )}

          {formData.type === 'information' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Info size={12} /> Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre information..."
                  rows={3}
                  className={`w-full py-2 px-3 rounded-xl text-sm border ${
                    errors.description ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
            </div>
          )}

          {/* Champs communs */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                <MapPin size={12} /> Adresse de pêche
              </label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                placeholder="Ex: Dakar, Soumbédioune..."
                className={`w-full py-2 px-3 rounded-xl text-sm border ${
                  errors.adresse ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.adresse && <p className="text-xs text-red-500 mt-1">{errors.adresse}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className={`mx-5 mb-4 p-3 rounded-2xl text-sm font-medium flex items-center gap-2 ${
          success.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {success.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          <span>{success.message}</span>
        </div>
      )}

      {/* Actions */}
      <div className="px-5">
        <div className="space-y-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Validation en cours...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Publier avec validation
              </>
            )}
          </button>

          <button
            onClick={handlePublierDirectement}
            disabled={loading}
            className="w-full py-3 bg-white border-2 border-orange-500 text-orange-500 font-bold text-sm rounded-2xl hover:bg-orange-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Package size={16} />
            Publier directement (sans validation)
          </button>
        </div>
      </div>

      {/* Navigation Bottom */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/80 px-6 py-3 flex justify-between items-center text-slate-400">
        <button onClick={() => navigate('/pecheur/accueil')} className="flex flex-col items-center gap-1 hover:text-orange-500">
          <Package size={18} />
          <span className="text-[9px]">Publications</span>
        </button>
        <button onClick={() => navigate('/pecheur/commandes')} className="flex flex-col items-center gap-1 hover:text-orange-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
          </svg>
          <span className="text-[9px]">Commandes</span>
        </button>
        <button onClick={() => navigate('/pecheur/ventes')} className="flex flex-col items-center gap-1 hover:text-orange-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[9px]">Ventes</span>
        </button>
      </nav>
    </div>
  );
};

export default ValidationPublication;
