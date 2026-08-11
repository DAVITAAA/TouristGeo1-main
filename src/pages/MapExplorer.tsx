import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../translations';
import { georgianSights, GeorgianSight } from '../data/georgianSights';
import { X, Compass, Navigation, Info } from 'lucide-react';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const svgIcons: Record<string, string> = {
    church: '<path d="m12 3-8 8V21h16V11l-8-8z"/><path d="M12 21v-4"/><path d="M10 17h4"/><path d="M12 7v4"/><path d="M10 9h4"/>',
    monastery: '<path d="m12 3-8 8V21h16V11l-8-8z"/><path d="M12 21v-4"/><path d="M10 17h4"/><path d="M12 7v4"/><path d="M10 9h4"/>',
    nature: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    landmark: '<line x1="3" y1="21" x2="21" y2="21"/><line x1="9" y1="21" x2="9" y2="7"/><line x1="15" y1="21" x2="15" y2="7"/><path d="M3 7h18l-9-4-9 4z"/>',
    fortress: '<path d="M2 17v4h4v-3h12v3h4v-4H2z"/><path d="M6 14v3"/><path d="M18 14v3"/><path d="M2 10h4v4H2z"/><path d="M18 10h4v4h-4z"/><path d="M6 6h12v8H6z"/><path d="M8 2h2v4H8z"/><path d="M14 2h2v4h-2z"/>',
    cave: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    canyon: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    waterfall: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    village: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/>',
    lake: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><ellipse cx="12" cy="16" rx="8" ry="4"/>',
    city: '<line x1="3" y1="21" x2="21" y2="21"/><path d="M5 21V7l7-4 7 4v14"/>',
};

function MapController({ coords, zoom }: { coords: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, zoom, { duration: 2 });
        }
    }, [coords, zoom, map]);
    return null;
}

interface MapExplorerProps {
    language: Language;
    onNavigate?: (page: string, data?: any) => void;
}

export default function MapExplorer({ language, onNavigate }: MapExplorerProps) {
    const isKa = language === 'ka';
    const [selectedSight, setSelectedSight] = useState<GeorgianSight | null>(null);
    const [filter, setFilter] = useState<string>('all');

    const categories = [
        { key: 'all', labelKa: 'ყველა', labelEn: 'All' },
        { key: 'church', labelKa: 'ეკლესიები', labelEn: 'Churches' },
        { key: 'monastery', labelKa: 'მონასტრები', labelEn: 'Monasteries' },
        { key: 'fortress', labelKa: 'ციხეები', labelEn: 'Fortresses' },
        { key: 'nature', labelKa: 'ბუნება', labelEn: 'Nature' },
        { key: 'canyon', labelKa: 'კანიონები', labelEn: 'Canyons' },
        { key: 'cave', labelKa: 'მღვიმეები', labelEn: 'Caves' },
        { key: 'village', labelKa: 'სოფლები', labelEn: 'Villages' },
        { key: 'landmark', labelKa: 'ღირშესანიშნაობა', labelEn: 'Landmarks' },
    ];

    const filteredSights = filter === 'all' ? georgianSights : georgianSights.filter(s => s.type === filter);

    const [mapStyle, setMapStyle] = useState<'waze' | 'satellite'>('waze');

    const WAZE_EMOJI: Record<string, string> = {
        church: '⛪', monastery: '🛕', fortress: '🏰', nature: '🌲',
        cave: '🕳️', canyon: '🏜️', waterfall: '💧', landmark: '📍',
        village: '🏘️', lake: '🏞️', waves: '🌊', city: '🏙️',
    };

    const WAZE_COLOR: Record<string, string> = {
        church: '#8B5CF6', monastery: '#F59E0B', fortress: '#EF4444', nature: '#10B981',
        cave: '#6366F1', canyon: '#F97316', waterfall: '#06B6D4', landmark: '#F43F5E',
        village: '#A855F7', lake: '#0EA5E9', waves: '#3B82F6', city: '#6366F1',
    };

    return (
        <div className="relative w-full h-[calc(100vh-64px)] bg-[#0f172a] overflow-hidden explorer-map-container">
            <style>{`
                .leaflet-container { background: #0f172a !important; }
                .leaflet-tile-container { filter: brightness(0.84) contrast(1.05) saturate(0.95); }
                .leaflet-bar { border: none !important; border-radius: 16px !important; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important; }
                .leaflet-bar a { background-color: #0f172a !important; color: #818cf8 !important; border: none !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; width: 44px !important; height: 44px !important; line-height: 44px !important; font-size: 18px !important; }
                .leaflet-bar a:hover { background-color: #1e293b !important; }
                .custom-marker-icon { background: none; border: none; }
                .waze-pin { transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .waze-pin:hover { transform: scale(1.25) translateY(-4px); }
            `}</style>

            <MapContainer
                center={[42.0, 43.5]}
                zoom={8}
                minZoom={7}
                maxBounds={[[40.0, 38.5], [44.0, 47.5]]}
                maxBoundsViscosity={1.0}
                scrollWheelZoom={true}
                className="w-full h-full"
                zoomControl={false}
                attributionControl={false}
            >
                {mapStyle === 'waze' ? (
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution="CartoDB Voyager"
                    />
                ) : (
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution="Esri"
                    />
                )}

                <ZoomControl position="topright" />

                {selectedSight && (
                    <MapController coords={selectedSight.coords} zoom={13} />
                )}

                {filteredSights.map((sight) => {
                    const isSelected = selectedSight?.id === sight.id;
                    const emoji = WAZE_EMOJI[sight.type] || '📍';
                    const color = WAZE_COLOR[sight.type] || '#4F46E5';

                    const customIcon = L.divIcon({
                        className: 'custom-marker-icon',
                        html: `<div class="waze-pin flex flex-col items-center cursor-pointer">
                                  <div style="background:${isSelected ? color : '#ffffff'}; border:3px solid ${color}; box-shadow: 0 6px 18px ${color}55; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:20px; ${isSelected ? 'transform:scale(1.25);' : ''}">
                                      <span>${emoji}</span>
                                  </div>
                               </div>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                    });

                    return (
                        <Marker
                            key={sight.id}
                            position={sight.coords}
                            icon={customIcon}
                            eventHandlers={{ click: () => setSelectedSight(sight) }}
                        />
                    );
                })}
            </MapContainer>

            {/* Header + Filters */}
            <div className="absolute top-6 left-6 z-[1000] max-w-md pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0f172a]/90 backdrop-blur-2xl p-5 rounded-[28px] shadow-2xl border border-white/10 pointer-events-auto"
                >
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/20 rounded-2xl text-primary shadow-lg shadow-primary/20">
                                <Compass className="animate-spin-slow" size={22} />
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-white tracking-tight leading-none">
                                    {isKa ? 'გეო-ექსპლორერი' : 'Geo-Explorer'}
                                </h1>
                                <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mt-1">
                                    {filteredSights.length} {isKa ? 'ადგილი' : 'Sites'}
                                </p>
                            </div>
                        </div>

                        {/* Map Mode Toggle */}
                        <div className="flex items-center p-1 bg-white/10 rounded-xl border border-white/10 text-[10px] font-bold">
                            <button
                                onClick={() => setMapStyle('waze')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${mapStyle === 'waze' ? 'bg-indigo-600 text-white shadow-md' : 'text-white/60 hover:text-white'}`}
                            >
                                🚙 Waze
                            </button>
                            <button
                                onClick={() => setMapStyle('satellite')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${mapStyle === 'satellite' ? 'bg-indigo-600 text-white shadow-md' : 'text-white/60 hover:text-white'}`}
                            >
                                🛰️ Satellite
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto scrollbar-thin">
                        {categories.map(cat => (
                            <button
                                key={cat.key}
                                onClick={() => { setFilter(cat.key); setSelectedSight(null); }}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${filter === cat.key ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
                            >
                                {isKa ? cat.labelKa : cat.labelEn}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Selected Sight Panel */}
            <AnimatePresence>
                {selectedSight && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[94%] max-w-3xl bg-[#0f172a]/95 backdrop-blur-3xl rounded-[40px] shadow-[0_20px_80px_rgba(0,0,0,0.7)] border border-white/10 overflow-hidden flex flex-col md:flex-row"
                    >
                        <div className="relative md:w-2/5 h-48 md:h-auto overflow-hidden">
                            <img src={selectedSight.img} alt={selectedSight.titleEn} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                <span className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg">{isKa ? selectedSight.locationKa : selectedSight.locationEn}</span>
                                {selectedSight.unesco && <span className="px-2 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">UNESCO</span>}
                            </div>
                        </div>
                        <div className="p-8 md:w-3/5 flex flex-col justify-center relative">
                            <button
                                onClick={() => setSelectedSight(null)}
                                className="absolute top-4 right-4 p-3 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">{isKa ? selectedSight.titleKa : selectedSight.titleEn}</h2>
                            <p className="text-white/60 mb-6 leading-relaxed text-xs">
                                {isKa ? selectedSight.descKa : selectedSight.descEn}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedSight.coords[0]},${selectedSight.coords[1]}`, '_blank')}
                                    className="flex-1 px-6 py-3.5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                >
                                    <Navigation size={14} />
                                    {isKa ? 'გახსენი რუკაზე' : 'Open in Google Maps'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}