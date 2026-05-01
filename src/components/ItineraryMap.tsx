import { useEffect, useRef } from 'react';

interface LocationData {
  name: string;
  lat: number;
  lng: number;
}

const GEORGIA_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  'Tbilisi': { lat: 41.7151, lng: 44.8271 },
  'Batumi': { lat: 41.6168, lng: 41.6367 },
  'Kutaisi': { lat: 42.2662, lng: 42.7180 },
  'Mestia': { lat: 43.0445, lng: 42.7278 },
  'Ushguli': { lat: 42.9167, lng: 43.0167 },
  'Stepantsminda': { lat: 42.6567, lng: 44.6433 },
  'Kazbegi': { lat: 42.6567, lng: 44.6433 },
  'Sighnaghi': { lat: 41.6111, lng: 45.9222 },
  'Borjomi': { lat: 41.8389, lng: 43.3792 },
  'Vardzia': { lat: 41.3812, lng: 43.2841 },
  'Gudauri': { lat: 42.4744, lng: 44.4811 },
  'Telavi': { lat: 41.9167, lng: 45.4833 },
  'Akhaltsikhe': { lat: 41.6389, lng: 42.9861 },
  'Zugdidi': { lat: 42.5083, lng: 41.8750 },
  'Poti': { lat: 42.1464, lng: 41.6720 },
  'Gori': { lat: 41.9842, lng: 44.1158 },
  'Mtskheta': { lat: 41.8464, lng: 44.7214 },
};

interface ItineraryMapProps {
  itinerary: { day: number; title: string; location?: string }[];
  activeDay?: number;
}

export default function ItineraryMap({ itinerary, activeDay }: ItineraryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<Record<number, any>>({});

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Initialize map
    if (!leafletMap.current) {
      leafletMap.current = window.L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false
      }).setView([42.3, 43.5], 7);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletMap.current);
      
      window.L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
    }

    const L = window.L;
    const points: [number, number][] = [];

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    itinerary.forEach((item) => {
      const loc = item.location || '';
      // Find matching location or default to first word
      const match = Object.keys(GEORGIA_LOCATIONS).find(k => 
        loc.toLowerCase().includes(k.toLowerCase())
      );

      if (match) {
        const coords = GEORGIA_LOCATIONS[match];
        points.push([coords.lat, coords.lng]);

        const marker = L.marker([coords.lat, coords.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-black border-4 border-white shadow-lg transition-all duration-300 ${activeDay === item.day ? 'scale-125 ring-4 ring-primary/30' : ''}">${item.day}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(leafletMap.current);

        marker.bindPopup(`<strong>Day ${item.day}: ${item.title}</strong>`);
        markersRef.current[item.day] = marker;
      }
    });

    // Draw route line
    if (points.length > 1) {
      const polyline = L.polyline(points, {
        color: '#ff4d4d',
        weight: 3,
        opacity: 0.6,
        dashArray: '10, 10'
      }).addTo(leafletMap.current);
      
      if (points.length > 0 && !activeDay) {
        leafletMap.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }
    } else if (points.length === 1) {
      leafletMap.current.setView(points[0], 10);
    }

    return () => {
        // We keep the map instance but we could destroy it if needed
    };
  }, [itinerary]);

  useEffect(() => {
    if (activeDay && markersRef.current[activeDay] && leafletMap.current) {
      const marker = markersRef.current[activeDay];
      leafletMap.current.flyTo(marker.getLatLng(), 11, { duration: 1.5 });
      marker.openPopup();
    }
  }, [activeDay]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-inner bg-gray-100 border border-border-light">
      <div ref={mapRef} className="w-full h-full z-0" />
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border-light flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-sm">map</span>
        <span className="text-[10px] font-black text-text-main uppercase tracking-widest">Interactive Route Map</span>
      </div>
    </div>
  );
}

// Add global L type
declare global {
  interface Window {
    L: any;
  }
}
