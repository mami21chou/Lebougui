import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, X, Camera, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PublicationService } from '../../services/publicationService';

// Change cette URL par ta vidéo locale (dans /public/video/pecheurs-file.mp4)
const VIDEO_ATTENTE = '/video/pecheurs-filet.mp4';
export default function CapturePublication() {
  const navigate = useNavigate();
  const location = useLocation();

  const audioBlob = location.state?.audioBlob || null;
  const photoFile = location.state?.photoFile || null;

  const [photoPreview, setPhotoPreview] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!audioBlob) {
      navigate('/pecheur/accueil', { replace: true });
      return;
    }
    const urlAudio = URL.createObjectURL(audioBlob);
    setAudioUrl(urlAudio);

    let urlPhoto = null;
    if (photoFile) {
      urlPhoto = URL.createObjectURL(photoFile);
      setPhotoPreview(urlPhoto);
    }

    return () => {
      URL.revokeObjectURL(urlAudio);
      if (urlPhoto) URL.revokeObjectURL(urlPhoto);
    };
  }, [audioBlob, photoFile, navigate]);

  const handlePublier = async () => {
    setPublishing(true);
    setErrorMsg('');

    try {
      const res = await PublicationService.publier(audioBlob, photoFile);

      if (res.en_attente_admin) {
        setSuccessMsg(
          "Publication envoyée. Elle sera vérifiée par un administrateur avant d'être visible."
        );
      } else {
        setSuccessMsg('Publication enregistrée avec succès !');
      }

      setTimeout(() => navigate('/pecheur/accueil'), 1800);
    } catch (err) {
      console.error('Erreur publication :', err);
      const data = err.response?.data;
      let msg = 'Échec de la publication.';
      if (data?.erreur) msg = data.erreur;
      else if (data?.detail) msg = data.detail;
      else if (data && typeof data === 'object') {
        const k = Object.keys(data)[0];
        msg = Array.isArray(data[k]) ? data[k][0] : String(data[k]);
      }
      setErrorMsg(msg);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-slate-800 font-sans pb-28 max-w-md mx-auto shadow-2xl relative">
      <header className="p-5 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          disabled={publishing}
          className="p-2.5 rounded-full bg-white shadow-sm border border-slate-200 disabled:opacity-40"
        >
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">
            ÉTAPE 2 SUR 2
          </p>
          <h2 className="text-sm font-bold text-slate-900">Vérification & publication</h2>
        </div>
        <button
          onClick={() => navigate(-1)}
          disabled={publishing}
          className="p-2.5 rounded-full bg-white shadow-sm border border-slate-200 disabled:opacity-40"
        >
          <X size={18} className="text-slate-600" />
        </button>
      </header>

      <main className="px-5 space-y-5">
        {/* Aperçu média */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/60 space-y-3">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            Média capturé
          </p>

          {audioUrl && <audio controls src={audioUrl} className="w-full h-10" />}

          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/60">
              <img
                src={photoPreview}
                alt="Aperçu de la prise"
                className="w-full h-44 object-cover"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-bold uppercase text-teal-700">
                Photo
              </span>
            </div>
          ) : (
            <div className="h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
              <Camera size={18} />
              <span>Pas de photo (information simple)</span>
            </div>
          )}
        </div>

        {/* Message informatif */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 text-center space-y-2">
          <p className="text-sm font-bold text-slate-900">
            Tout est prêt pour la publication
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            En cliquant sur <span className="font-bold text-orange-500">Publier</span>,
            votre annonce sera enregistrée et visible selon sa validation.
          </p>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-medium">
            <CheckCircle2 size={14} />
            <span>{successMsg}</span>
          </div>
        )}
      </main>

      {/* Bouton Publier */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/80 px-5 py-4">
        <button
          onClick={handlePublier}
          disabled={publishing}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {publishing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Publication en cours...
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Publier
            </>
          )}
        </button>
      </div>

      {/* Overlay plein écran pendant la publication : vidéo de pêcheurs */}
      {publishing && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <div className="relative w-72 h-72 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10">
            <video
              src={VIDEO_ATTENTE}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-6 flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            <p className="text-sm font-bold">Publication en cours...</p>
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-xs text-center leading-relaxed">
            Veuillez patienter quelques instants.
          </p>
        </div>
      )}
    </div>
  );
}