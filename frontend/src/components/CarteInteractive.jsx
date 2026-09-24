import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─────────────────────────────────────────────────────────────
// Marqueurs personnalisés (pins colorés avec emoji)
// ─────────────────────────────────────────────────────────────
const creerPin = (couleur, emoji) =>
  L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="position: relative; width: 40px; height: 40px;">
        <div style="
          position: absolute;
          left: 50%;
          top: 50%;
          width: 40px;
          height: 40px;
          background: ${couleur};
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: translate(-50%, -100%) rotate(-45deg);
          box-shadow: 0 4px 12px rgba(0,0,0,.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="transform: rotate(45deg); font-size: 16px; line-height: 1;">${emoji}</span>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

const ICONES = {
  livreur: creerPin('#FF6B4A', '🛵'),
  pecheur: creerPin('#0C3B4A', '🎣'),
  client: creerPin('#0A8A5F', '🏠'),
};

// ─────────────────────────────────────────────────────────────
// OSRM — calcul d'itinéraire routier réel (gratuit, sans clé)
// ─────────────────────────────────────────────────────────────
async function calculerItineraire(depart, arrivee) {
  if (!depart || !arrivee) return null;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${depart.lng},${depart.lat};${arrivee.lng},${arrivee.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const route = data.routes[0];
    return {
      coordonnees: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: route.distance / 1000,
      duree: Math.round(route.duration / 60),
    };
  } catch (err) {
    console.warn('Erreur OSRM:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────
export default function CarteInteractive({
  positionLivreur = null,
  positionClient = null,
  positionPecheur = null,
  afficherItineraire = false,
  destination = null, // 'pecheur' | 'client' | null
  onItineraireCalcule = null,
  className = '',
  zoom = 14,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);
  const haloRef = useRef(null);
  const itineraireKeyRef = useRef(null);

  // ═══════════════════════════════════════════════════════════
  // 1. Initialisation
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    }).setView(
      positionLivreur
        ? [positionLivreur.lat, positionLivreur.lng]
        : [14.6928, -17.4467],
      zoom
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      polylineRef.current = null;
      haloRef.current = null;
      itineraireKeyRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════════════
  // 2. Marqueurs
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (positionLivreur) {
      const pos = [positionLivreur.lat, positionLivreur.lng];
      if (markersRef.current.livreur) {
        markersRef.current.livreur.setLatLng(pos);
      } else {
        markersRef.current.livreur = L.marker(pos, {
          icon: ICONES.livreur,
          zIndexOffset: 1000,
        })
          .addTo(map)
          .bindPopup('<b>Vous</b>');
      }
    }

    if (positionPecheur) {
      const pos = [positionPecheur.lat, positionPecheur.lng];
      if (markersRef.current.pecheur) {
        markersRef.current.pecheur.setLatLng(pos);
      } else {
        markersRef.current.pecheur = L.marker(pos, {
          icon: ICONES.pecheur,
        })
          .addTo(map)
          .bindPopup('<b>Pêcheur</b>');
      }
    }

    if (positionClient) {
      const pos = [positionClient.lat, positionClient.lng];
      if (markersRef.current.client) {
        markersRef.current.client.setLatLng(pos);
      } else {
        markersRef.current.client = L.marker(pos, {
          icon: ICONES.client,
        })
          .addTo(map)
          .bindPopup('<b>Client</b>');
      }
    }
  }, [positionLivreur, positionPecheur, positionClient]);

  // ═══════════════════════════════════════════════════════════
  // 3. Itinéraire
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !positionLivreur) return;

    let arrivee = null;
    if (destination === 'pecheur' && positionPecheur) arrivee = positionPecheur;
    else if (destination === 'client' && positionClient) arrivee = positionClient;
    else if (afficherItineraire) arrivee = positionClient;

    if (!arrivee) {
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      if (haloRef.current) {
        haloRef.current.remove();
        haloRef.current = null;
      }
      itineraireKeyRef.current = null;
      return;
    }

    const key = `${positionLivreur.lat.toFixed(3)},${positionLivreur.lng.toFixed(3)}→${arrivee.lat.toFixed(3)},${arrivee.lng.toFixed(3)}`;
    if (itineraireKeyRef.current === key) return;
    itineraireKeyRef.current = key;

    let cancelled = false;

    calculerItineraire(positionLivreur, arrivee).then((route) => {
      if (cancelled || !route) return;

      if (polylineRef.current) polylineRef.current.remove();
      if (haloRef.current) haloRef.current.remove();

      const couleur = destination === 'pecheur' ? '#0C3B4A' : '#0A8A5F';

      // Halo blanc derrière
      haloRef.current = L.polyline(route.coordonnees, {
        color: 'white',
        weight: 10,
        opacity: 0.6,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Ligne principale
      polylineRef.current = L.polyline(route.coordonnees, {
        color: couleur,
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      const bounds = L.latLngBounds([
        [positionLivreur.lat, positionLivreur.lng],
        [arrivee.lat, arrivee.lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });

      if (onItineraireCalcule) {
        onItineraireCalcule({
          distance: route.distance,
          duree: route.duree,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    positionLivreur,
    positionPecheur,
    positionClient,
    destination,
    afficherItineraire,
    onItineraireCalcule,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ minHeight: 200 }}
    />
  );
}