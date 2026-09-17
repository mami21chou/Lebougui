import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';

const InputFile = ({
  label,
  labelClassName = '',
  placeholder = '',
  accept = '*',
  multiple = false,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  icon,
  showPreview = false,
  previewMaxSize = 5, // en Mo
  ...props
}) => {
  const fileInputRef = useRef(null);
  const [fileNames, setFileNames] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Mettre à jour les noms de fichiers
    if (files.length > 0) {
      setFileNames(files.map(f => f.name));
      
      // Gérer les aperçus pour les images
      if (showPreview) {
        const newPreviews = [];
        files.forEach(file => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
              newPreviews.push(reader.result);
              if (newPreviews.length === files.length) {
                setPreviews(newPreviews);
              }
            };
            reader.readAsDataURL(file);
          }
        });
      }
    } else {
      setFileNames([]);
      setPreviews([]);
    }

    onChange?.(e);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = (index) => {
    if (fileInputRef.current) {
      // Réinitialiser l'input
      fileInputRef.current.value = '';
      setFileNames([]);
      setPreviews([]);
      onChange?.({ target: { files: [], name, value: '' } });
    }
  };

  // Vérifier la taille du fichier
  const isFileTooLarge = (file) => {
    return file && file.size > previewMaxSize * 1024 * 1024;
  };

  return (
    <div className={`d-flex flex-column gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className={`font-medium text-gray-700 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-accent ml-1">*</span>}
        </label>
      )}

      <input
        ref={fileInputRef}
        id={id || name}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled}
        required={required}
        className="d-none"
        {...props}
      />

      <Button
        variant="outline"
        onClick={handleClick}
        disabled={disabled}
        className="w-full justify-start gap-2"
      >
        {icon && <span>{icon}</span>}
        <span>{placeholder || 'Choisir un fichier'}</span>
      </Button>

      {fileNames.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mt-1">
          {fileNames.map((name, index) => (
            <div
              key={index}
              className="d-flex align-center gap-2 bg-gray-100 px-3 py-1 border-radius"
            >
              <span className="text-sm text-ellipsis max-w-200">{name}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="bg-transparent border-none cursor-pointer text-gray-500 hover:text-accent"
                aria-label="Supprimer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {showPreview && previews.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mt-2">
          {previews.map((preview, index) => (
            <div key={index} className="position-relative">
              <img
                src={preview}
                alt={`Aperçu ${index + 1}`}
                className="w-20 h-20 object-cover border-radius"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="position-absolute top-1 right-1 bg-red-500 text-white border-radius-full w-5 h-5 d-flex align-center justify-center cursor-pointer"
                aria-label="Supprimer"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <span className="text-sm text-accent font-medium">{error}</span>
      )}
    </div>
  );
};

InputFile.propTypes = {
  label: PropTypes.string,
  labelClassName: PropTypes.string,
  placeholder: PropTypes.string,
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  onChange: PropTypes.func,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  icon: PropTypes.node,
  showPreview: PropTypes.bool,
  previewMaxSize: PropTypes.number,
};

// Version pour l'audio
export const AudioInput = ({
  label = 'Enregistrement audio',
  onChange,
  error,
  disabled = false,
  className = '',
  ...props
}) => {
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // Appeler onChange avec le blob
        if (onChange) {
          onChange({ target: { files: [audioBlob], name: 'audio', value: audioBlob } });
        }
        
        // Arrêter tous les tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    if (onChange) {
      onChange({ target: { files: [], name: 'audio', value: null } });
    }
  };

  return (
    <div className={`d-flex flex-column gap-3 ${className}`}>
      {label && (
        <label className="font-medium text-gray-700">{label}</label>
      )}

      <div className="d-flex gap-2">
        {!isRecording ? (
          <Button
            variant="primary"
            onClick={startRecording}
            disabled={disabled}
            className="flex-1"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
              <path d="M7 10a3 3 0 016 0v6a3 3 0 11-6 0V10z" />
            </svg>
            Commencer l\'enregistrement
          </Button>
        ) : (
          <Button
            variant="danger"
            onClick={stopRecording}
            className="flex-1"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 6h10M5 10h10M5 14h10" />
            </svg>
            Arrêter l\'enregistrement
          </Button>
        )}
      </div>

      {audioUrl && (
        <div className="d-flex align-center gap-2 p-3 bg-gray-50 border-radius">
          <audio
            src={audioUrl}
            controls
            className="flex-1"
          />
          <Button
            variant="ghost"
            onClick={removeAudio}
            className="p-1"
            aria-label="Supprimer"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </Button>
        </div>
      )}

      {error && (
        <span className="text-sm text-accent font-medium">{error}</span>
      )}
    </div>
  );
};

AudioInput.propTypes = {
  label: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default InputFile;
