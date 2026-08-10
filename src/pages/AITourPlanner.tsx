import React, { useState, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../translations';
import { Sparkles, ArrowRight, Play, X, Video } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { georgianSights, GeorgianSight } from '../data/georgianSights';
import { georgiaVideos, GeorgiaVideo } from '../data/georgiaVideos';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const AIPlannerBackground = React.lazy(() => import('../components/AIPlannerBackground'));

// Waze-style emoji icons for each sight type
const WAZE_TYPE_EMOJI: Record<string, string> = {
  church: '⛪', monastery: '🛕', fortress: '🏰', nature: '🌲',
  cave: '🕳️', canyon: '🏜️', waterfall: '💧', landmark: '📍',
  village: '🏘️', lake: '🏞️', waves: '🌊', city: '🏙️',
};

const WAZE_TYPE_COLOR: Record<string, string> = {
  church: '#7C3AED', monastery: '#D97706', fortress: '#DC2626', nature: '#059669',
  cave: '#6366F1', canyon: '#EA580C', waterfall: '#0EA5E9', landmark: '#E11D48',
  village: '#8B5CF6', lake: '#0891B2', waves: '#2563EB', city: '#4F46E5',
};

const WazeMapMarker = React.memo(function WazeMapMarker({
  sight, isHl, isKa, onSelect
}: {
  sight: GeorgianSight; isHl: boolean; isKa: boolean; onSelect: (title: string) => void;
}) {
  const customIcon = React.useMemo(() => {
    const emoji = WAZE_TYPE_EMOJI[sight.type] || '📍';
    const color = WAZE_TYPE_COLOR[sight.type] || '#4F46E5';
    const title = isKa ? sight.titleKa : sight.titleEn;
    return L.divIcon({
      className: 'custom-marker-icon',
      html: `<div class="waze-marker flex flex-col items-center group" style="cursor:pointer">
        <div style="background:${isHl ? color : '#fff'};border:3px solid ${color};box-shadow:0 4px 14px ${color}44${isHl ? ',0 0 20px '+color+'66' : ''};border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:20px;${isHl ? 'transform:scale(1.25);' : ''}transition:all 0.3s">
          <span>${emoji}</span>
        </div>
        <div style="background:${isHl ? color : '#fff'};color:${isHl ? '#fff' : '#1e293b'};border:2px solid ${isHl ? color : '#e2e8f0'};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:800;margin-top:4px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.1);${isHl ? 'opacity:1' : 'opacity:0'};transition:opacity 0.2s" class="group-hover:!opacity-100">
          ${title}
        </div>
      </div>`,
      iconSize: [46, 60], iconAnchor: [23, 30]
    });
  }, [sight, isHl, isKa]);

  return (
    <Marker
      position={sight.coords}
      icon={customIcon}
      eventHandlers={{ click: () => onSelect(isKa ? sight.titleKa : sight.titleEn) }}
    />
  );
});

function MapController({ coords, zoom }: { coords: [number, number] | null, zoom: number }) {
  const map = useMap();
  useEffect(() => { if (coords) map.flyTo(coords, zoom, { duration: 1.5 }); }, [coords, zoom, map]);
  return null;
}

interface AITourPlannerProps { language: Language; onNavigate: (page: string, data?: any) => void; }
interface Message { role: 'user' | 'ai'; content: string; }

const TRENDING = [
  { label: 'Wine Route in Kakheti', prompt: 'Plan a 2-day wine tasting tour in the Kakheti region', icon: '🍷' },
  { label: 'Kazbegi 4x4 Off-road', prompt: 'Plan a weekend getaway from Tbilisi to Kazbegi with 4x4 tours', icon: '🏔️' },
  { label: 'Mestia Cultural Loop', prompt: 'Plan a hiking tour in Svaneti with Mestia and Ushguli', icon: '🏛️' },
];

const TRENDING_KA = [
  { label: 'ღვინის მარშრუტი კახეთში', prompt: 'დამიგეგმე 2-დღიანი ღვინის ტური კახეთის რეგიონში', icon: '🍷' },
  { label: 'ყაზბეგი 4x4', prompt: 'დამიგეგმე შაბათ-კვირის ტური თბილისიდან ყაზბეგში ჯიპ-ტურით', icon: '🏔️' },
  { label: 'მესტიის კულტურული ტური', prompt: 'დამიგეგმე ლაშქრობა სვანეთში მესტიით და უშგულით', icon: '🏛️' },
];

export default function AITourPlanner({ language, onNavigate }: AITourPlannerProps) {
  const isKa = language === 'ka';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [activeCoords, setActiveCoords] = useState<[number, number] | null>(null);
  const [highlightedSights, setHighlightedSights] = useState<GeorgianSight[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<GeorgiaVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, relatedVideos]);

  const analyzeResponseForLocations = (text: string) => {
    const mentionedSights = georgianSights.filter(sight => {
      return new RegExp(sight.titleEn, 'i').test(text) || new RegExp(sight.titleKa, 'i').test(text) || new RegExp(sight.locationEn, 'i').test(text);
    });
    const mentionedVideos = georgiaVideos.filter(video => {
      return new RegExp(video.id, 'i').test(text) ||
             new RegExp(video.regionEn, 'i').test(text) ||
             new RegExp(video.titleEn.split('—')[0].trim(), 'i').test(text);
    });
    if (mentionedSights.length > 0) {
      setHighlightedSights(mentionedSights);
      setActiveCoords(mentionedSights[0].coords);
    }
    if (mentionedVideos.length > 0) {
      setRelatedVideos(mentionedVideos);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const userMsg = (overrideInput || input).trim();
    if (!userMsg || isLoading) return;
    setInput('');
    if (!started) setStarted(true);
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);
    setRelatedVideos([]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), mode: 'planner', language })
      });
      if (!response.ok) { throw new Error('Failed'); }
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      analyzeResponseForLocations(userMsg + " " + data.reply);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: isKa ? 'შეცდომა კავშირისას.' : 'Connection error.' }]);
    } finally { setIsLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const parseMarkdown = (text: string) => {
    let parsed = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-300 italic">$1</em>');
    return <div className="space-y-3 text-[15px] leading-relaxed text-gray-400" dangerouslySetInnerHTML={{ __html: parsed.replace(/\n/g, '<br/>') }} />;
  };

  const trending = isKa ? TRENDING_KA : TRENDING;

  // ── LANDING STATE (with 3D) ──
  if (!started) {
    return (
      <div className="ai-planner-landing min-h-[calc(100vh-80px)] w-full text-white flex flex-col items-center justify-center px-6 font-sans overflow-hidden relative">

        {/* 3D Background */}
        <Suspense fallback={null}>
          <AIPlannerBackground />
        </Suspense>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl">

          {/* Floating badge */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="ai-badge inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full">
              <span className="ai-badge-dot" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#4ae3b5]">
                {isKa ? 'AI-ით გაძლიერებული' : 'AI-Powered Planning'}
              </span>
            </div>
          </motion.div>

          {/* Hero Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-6xl lg:text-[76px] font-bold tracking-tight text-center mb-6 leading-[1.08]"
          >
            <span className="block text-white/90">{isKa ? 'სად დაიწყება თქვენი' : 'Where should your'}</span>
            <span className="ai-gradient-text block mt-1">
              {isKa ? 'შემდეგი ისტორია?' : 'next story begin?'}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-gray-400 text-base md:text-lg text-center mb-12 max-w-xl leading-relaxed"
          >
            {isKa
              ? 'აღწერეთ თქვენი იდეალური მოგზაურობა და AI შექმნის სრულყოფილ მარშრუტს'
              : 'Describe your dream journey and our AI crafts the perfect Georgian itinerary'}
          </motion.p>

          {/* Input Pill */}
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-3xl relative mb-10"
          >
            {/* Glow behind input */}
            <div className={`ai-input-glow ${inputFocused ? 'ai-input-glow-active' : ''}`} />

            <div className={`ai-input-container ${inputFocused ? 'ai-input-focused' : ''}`}>
              <div className="ai-sparkle-icon">
                <Sparkles size={22} />
              </div>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={isKa
                  ? "მინდა ვნახო სვანეთის თოვლიანი მთები და ბათუმის ღამეები..."
                  : "I want to see the snow peaks of Svaneti followed by Batumi nights..."}
                className="flex-1 bg-transparent text-white focus:outline-none text-base md:text-lg placeholder:text-gray-600 py-4"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="ai-send-btn"
              >
                <span className="hidden md:inline">{isKa ? 'დაგეგმვა' : 'Plan'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>

          {/* Trending Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="w-full max-w-3xl"
          >
            <p className="text-center text-gray-500 text-[11px] font-bold tracking-[0.2em] uppercase mb-5">
              {isKa ? 'პოპულარული იდეები' : 'Popular Suggestions'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {trending.map((t, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.4 + i * 0.1 }}
                  onClick={() => handleSend(t.prompt)}
                  className="ai-suggestion-chip group"
                >
                  <span className="text-lg mr-1.5">{t.icon}</span>
                  <span>{t.label}</span>
                  <ArrowRight size={14} className="ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Bottom floating features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
            className="mt-20 flex items-center gap-8 text-gray-600 text-xs tracking-wide"
          >
            {[
              isKa ? '🗺️ ინტერაქტიული რუკა' : '🗺️ Interactive Map',
              isKa ? '🎬 რეალური ვიდეოები' : '🎬 Real Footage',
              isKa ? '⚡ მყისიერი პასუხი' : '⚡ Instant Response'
            ].map((feat, i) => (
              <span key={i} className="hidden md:flex items-center gap-1.5">{feat}</span>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // ── CHAT & MAP STATE ──
  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col md:flex-row bg-[#0a0e0e] font-sans selection:bg-[#4ae3b5]/30 selection:text-[#4ae3b5]">
      <style>{`
        .waze-map .leaflet-container { background: #1a202c !important; }
        .waze-map .leaflet-tile-container { filter: brightness(0.82) contrast(1.05) saturate(0.92); }
        .waze-map .leaflet-bar { border: none !important; border-radius: 16px !important; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2) !important; }
        .waze-map .leaflet-bar a { background-color: #1e293b !important; color: #818cf8 !important; border: none !important; border-bottom: 1px solid #334155 !important; width: 44px !important; height: 44px !important; line-height: 44px !important; font-size: 18px !important; }
        .waze-map .leaflet-bar a:hover { background-color: #334155 !important; }
        .waze-map .leaflet-bar a:last-child { border-bottom: none !important; }
        .custom-marker-icon { background: none; border: none; }
        .waze-marker { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        .waze-marker:hover { transform: scale(1.2) translateY(-4px); }
      `}</style>

      {/* LEFT: Map / Media Area */}
      <div className="waze-map relative w-full h-[40vh] md:h-full md:w-[50%] lg:w-[60%] shrink-0 border-b md:border-b-0 md:border-r border-[#1a2524] z-10 flex flex-col">
        <div className="flex-1 relative bg-[#1a202c]">
          <MapContainer center={[42.0, 43.5]} zoom={7} minZoom={6} maxBounds={[[40.0, 38.5], [44.0, 47.5]]} maxBoundsViscosity={1.0} scrollWheelZoom={true} className="w-full h-full z-0" zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <ZoomControl position="bottomleft" />
            {georgianSights.map((sight) => (
              <WazeMapMarker
                key={sight.id}
                sight={sight}
                isHl={highlightedSights.some(s => s.id === sight.id)}
                isKa={isKa}
                onSelect={(title) => setInput(prev => prev + (prev.endsWith(' ') ? '' : ' ') + title)}
              />
            ))}
          </MapContainer>

          {/* Waze-style Overlay Badge */}
          <div className="absolute top-5 left-5 z-[1000] pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-500/10 border border-indigo-100">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              <span className="text-xs font-extrabold text-indigo-900 tracking-wide uppercase">{isKa ? 'მარშრუტის სიმულაცია' : 'LIVE ROUTE'}</span>
            </div>
          </div>

          {/* Waze-style bottom legend */}
          <div className="absolute bottom-5 left-5 right-5 z-[1000] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3 overflow-x-auto no-scrollbar pointer-events-auto">
              {Object.entries(WAZE_TYPE_EMOJI).slice(0, 6).map(([type, em]) => (
                <div key={type} className="flex items-center gap-1.5 shrink-0">
                  <span className="text-sm">{em}</span>
                  <span className="text-[10px] font-bold text-gray-500 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Videos Dock */}
        <AnimatePresence>
          {relatedVideos.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="bg-[#0a0e0e] border-t border-[#1a2524] p-4 overflow-hidden shrink-0"
            >
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-[10px] font-bold text-gray-500 tracking-[0.15em] uppercase">
                  {isKa ? 'რეალური კადრები' : 'Real-Life Footages'}
                </span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#1a2524] px-2">
                {relatedVideos.map(video => (
                  <div
                    key={video.id} onClick={() => setActiveVideo(video.youtubeId)}
                    className="shrink-0 w-60 bg-[#131b1a] border border-[#1a2524] rounded-2xl overflow-hidden cursor-pointer hover:border-[#4ae3b5]/50 group transition-colors"
                  >
                    <div className="aspect-video relative">
                      <img src={video.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                        <div className="w-10 h-10 rounded-full bg-[#4ae3b5] text-black flex items-center justify-center pl-1 shadow-lg shadow-[#4ae3b5]/30">
                          <Play size={16} fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-white text-xs font-bold truncate">{isKa ? video.titleKa : video.titleEn}</p>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider mt-1">{isKa ? video.regionKa : video.regionEn}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Player Modal */}
        <AnimatePresence>
          {activeVideo && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[2000] bg-[#0a0e0e]/95 backdrop-blur-xl flex flex-col p-4 md:p-6"
            >
              <div className="w-full h-full bg-[#131b1a] border border-[#1a2524] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-[#1a2524] flex justify-between items-center bg-[#0e1514]">
                  <div className="flex items-center gap-2">
                    <Video size={16} className="text-[#4ae3b5]" />
                    <h3 className="text-white text-xs font-bold uppercase tracking-wider">Visual Data Stream</h3>
                  </div>
                  <button onClick={() => setActiveVideo(null)} className="p-2 bg-[#1e2a28] rounded-full text-gray-400 hover:text-white hover:bg-[#1a2524] transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 w-full bg-black relative">
                  <iframe
                    width="100%" height="100%"
                    src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&mute=0&controls=1&rel=0&showinfo=0`}
                    title="Footage" frameBorder="0" allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  ></iframe>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT: Chat Space */}
      <div className="flex-1 h-[60vh] md:h-full flex flex-col bg-[#0a0e0e] relative z-20">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1a2524] bg-[#0e1514] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="ai-header-icon">
              <Sparkles size={14} className="text-[#4ae3b5]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">{isKa ? 'GeoTour AI გიდი' : 'GeoTour AI Guide'}</h2>
              <p className="text-gray-500 text-[10px] font-medium tracking-wide uppercase mt-0.5">{isKa ? 'თქვენი მოგზაურობის სული' : 'Your Travel Spirit'}</p>
            </div>
          </div>
          <div className="ai-badge px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="ai-badge-dot" />
            <span className="text-xs text-gray-400 font-medium tracking-wide">Sync</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-[#1a2524] scrollbar-track-transparent">
          {messages.map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.role === 'ai' && (
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 ml-1">AI Guide</span>
              )}
              <div className={`max-w-[85%] rounded-[24px] px-6 py-4 ${
                msg.role === 'user'
                  ? 'bg-[#1a2524] text-white rounded-br-sm shadow-md'
                  : 'bg-[#131b1a] text-gray-200 border border-[#1a2524] rounded-bl-sm shadow-sm'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-[15px] leading-relaxed">{msg.content}</p>
                ) : (
                  parseMarkdown(msg.content)
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 ml-1">AI Guide</span>
              <div className="bg-[#131b1a] border border-[#1a2524] rounded-[24px] rounded-bl-sm px-6 py-5 flex items-center gap-3">
                <div className="ai-loading-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Space */}
        <div className="p-4 md:p-6 shrink-0 bg-[#0a0e0e]">
          <div className="flex items-center gap-3 bg-[#131b1a] border border-[#1a2524] rounded-[28px] p-2 focus-within:border-[#4ae3b5]/40 transition-all shadow-lg">
            <textarea
              value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={isKa ? 'რა გსურთ აღმოაჩინოთ?' : 'What would you like to discover?'}
              className="flex-1 bg-transparent py-3 px-4 text-[15px] text-white placeholder-gray-600 focus:outline-none resize-none max-h-32 min-h-[48px] scrollbar-none"
              rows={1} style={{ height: 'auto' }}
              onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 120)}px`; }}
            />
            <button onClick={() => handleSend()} disabled={!input.trim() || isLoading}
              className="ai-send-btn-chat">
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
