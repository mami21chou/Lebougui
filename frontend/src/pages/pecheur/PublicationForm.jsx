// // Lancement Étape 1 : Analyse IA
//   const handleAnalyse = async (e) => {
//     e.preventDefault();
//     if (!audioBlob) {
//       setErrorMsg('Veuillez enregistrer un message vocal en Wolof.');
//       return;
//     }
//     if (!adresse) {
//       setErrorMsg('Veuillez renseigner votre adresse/port de pêche.');
//       return;
//     }

//     setAnalyzing(true);
//     setErrorMsg('');

//     try {
//       const res = await PublicationService.analyserPublication(audioBlob, mediaFile);
//       setIaData(res);

//       // Pré-remplissage dynamique des champs avec la suggestion IA
//       if (res.type === 'produit') {
//         setFormData({
//           nom: res.suggestion?.nom || '',
//           categorie: res.suggestion?.categorie || 'poisson',
//           prix: res.suggestion?.prix || '',
//           quantite: res.suggestion?.quantite || '',
//           description: '',
//         });
//       } else {
//         setFormData((prev) => ({
//           ...prev,
//           description: res.suggestion?.description || res.texte_traduit || '',
//         }));
//       }
//     } catch (err) {
//       console.error("Détails de l'erreur IA :", err);
//       if (err.response?.status === 401) {
//         setErrorMsg("Session expirée ou non autorisée. Veuillez vous reconnecter.");
//       } else {
//         setErrorMsg(err.response?.data?.erreur || err.response?.data?.detail || "Erreur lors de l'analyse du média par l'IA.");
//       }
//     } finally {
//       setAnalyzing(false);
//     }
//   };