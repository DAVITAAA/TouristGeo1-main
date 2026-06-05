import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../translations';
import { georgianSights, GeorgianSight } from '../data/georgianSights';
import { X, Compass, Navigation, Info, ExternalLink } from 'lucide-react';

// Fix for default marker icons in Leaflet + React
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



    return (
        <div className="relative w-full h-[calc(100vh-64px)] bg-[#050b1a] overflow-hidden explorer-map-container">
            <style>{`
                .leaflet-container { background: #050b1a !important; }
                .leaflet-bar { border: none !important; box-shadow: 0 10px 25px rgba(0,0,0,0.3) !important; }
                .leaflet-bar a { background-color: #0f172a !important; color: white !important; border: 1px solid rgba(255,255,255,0.1) !important; width: 40px !important; height: 40px !important; line-height: 40px !important; }
                .leaflet-bar a:hover { background-color: var(--color-primary) !important; }
                .leaflet-control-layers { background: #0f172a !important; color: white !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 12px !important; padding: 8px !important; }
                .custom-marker-icon { background: none; border: none; }
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
            >
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Satellite View">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; ESRI' />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Street View">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png" attribution='&copy; OpenStreetMap' />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Terrain View">
                        <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{y}/{x}.png" attribution='&copy; OpenTopoMap' />
                    </LayersControl.BaseLayer>
                </LayersControl>

                <ZoomControl position="topright" />

                {selectedSight && (
                    <MapController coords={selectedSight.coords} zoom={13} />
                )}

                {filteredSights.map((sight) => {
                    const svgPath = svgIcons[sight.type] || svgIcons['landmark'];
                    const customIcon = L.divIcon({
                        className: 'custom-marker-icon',
                        html: `
                            <div class="flex flex-col items-center group">
                                <div class="p-2 rounded-full shadow-2xl border-2 transition-all duration-300 ${selectedSight?.id === sight.id ? 'bg-primary border-white text-white scale-125' : 'bg-white border-primary text-primary hover:scale-110'}">
                                    <div class="w-5 h-5 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>
                                    </div>
                                </div>
                                <div class="mt-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-wider shadow-lg whitespace-nowrap ${selectedSight?.id === sight.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity">
                                    ${isKa ? sight.titleKa : sight.titleEn}
                                </div>
                            </div>
                        `,
                        iconSize: [40, 40],
                        iconAnchor: [20, 40]
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
                    <div className="flex items-center gap-3 mb-4">
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
                                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">{isKa ? selectedSight.titleKa : selectedSight.titleEn}</h2>
                            <p className="text-white/60 mb-6 leading-relaxed text-xs">
                                {isKa ? selectedSight.descKa : selectedSight.descEn}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.open(`https://www.google.com/maps?q=${selectedSight.coords[0]},${selectedSight.coords[1]}`, '_blank')}
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

            {/* Hint */}
            {!selectedSight && (
                <div className="absolute bottom-6 left-6 z-[1000] pointer-events-none flex items-center gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center text-primary">
                        <Info size={16} />
                    </div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {isKa ? 'დააჭირე ნიშნულს დეტალებისთვის' : 'Click a marker for details'}
                    </p>
                </div>
            )}
        </div>
    );
}
