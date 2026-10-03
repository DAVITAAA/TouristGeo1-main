import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../translations';
import { Sparkles, ArrowRight, Play, X, Video, Calendar, MapPin, Compass, Zap, RotateCcw, Download, Heart, ChevronDown, ChevronUp } from 'lucide-react';
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

// ── Structured Form Options ──
const REGIONS = {
  en: [
    { value: '', label: 'All Georgia' },
    { value: 'Kakheti', label: '🍷 Kakheti (Wine Region)' },
    { value: 'Svaneti', label: '🏔️ Svaneti (Mountains)' },
    { value: 'Kazbegi', label: '⛰️ Kazbegi (High Caucasus)' },
    { value: 'Adjara', label: '🌊 Adjara (Black Sea Coast)' },
    { value: 'Imereti', label: '🏜️ Imereti (Caves & Canyons)' },
    { value: 'Samtskhe-Javakheti', label: '🏰 Samtskhe-Javakheti (Historical)' },
    { value: 'Tusheti', label: '🏘️ Tusheti (Remote Villages)' },
    { value: 'Racha', label: '🌿 Racha (Hidden Gem)' },
    { value: 'Tbilisi', label: '🏙️ Tbilisi (Capital City)' },
  ],
  ka: [
    { value: '', label: 'მთელი საქართველო' },
    { value: 'Kakheti', label: '🍷 კახეთი' },
    { value: 'Svaneti', label: '🏔️ სვანეთი' },
    { value: 'Kazbegi', label: '⛰️ ყაზბეგი' },
    { value: 'Adjara', label: '🌊 აჭარა' },
    { value: 'Imereti', label: '🏜️ იმერეთი' },
    { value: 'Samtskhe-Javakheti', label: '🏰 სამცხე-ჯავახეთი' },
    { value: 'Tusheti', label: '🏘️ თუშეთი' },
    { value: 'Racha', label: '🌿 რაჭა' },
    { value: 'Tbilisi', label: '🏙️ თბილისი' },
  ],
};

const VIBES = {
  en: [
    { value: 'adventure', label: '🧗 Adventure', desc: 'Hiking, Off-road, Extreme' },
    { value: 'cultural', label: '🏛️ Cultural', desc: 'History, Churches, Museums' },
    { value: 'relaxation', label: '🧘 Relaxation', desc: 'Spa, Nature, Slow Travel' },
    { value: 'foodie', label: '🍷 Food & Wine', desc: 'Gastro, Wine, Cooking' },
    { value: 'photography', label: '📸 Photography', desc: 'Scenic, Golden Hour, Views' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Family', desc: 'Kid-friendly, Easy Trails' },
  ],
  ka: [
    { value: 'adventure', label: '🧗 თავგადასავალი', desc: 'ლაშქრობა, ჯიპ-ტური' },
    { value: 'cultural', label: '🏛️ კულტურული', desc: 'ისტორია, ტაძრები' },
    { value: 'relaxation', label: '🧘 დასვენება', desc: 'სპა, ბუნება' },
    { value: 'foodie', label: '🍷 გასტრო', desc: 'ღვინო, სამზარეულო' },
    { value: 'photography', label: '📸 ფოტოგრაფია', desc: 'ხედები, ბუნება' },
    { value: 'family', label: '👨‍👩‍👧‍👦 ოჯახური', desc: 'ბავშვებისთვის' },
  ],
};

// ── Parse AI Response into Day Cards ──
interface DayCard {
  dayLabel: string;
  title: string;
  content: string;
}

function parseItinerary(text: string, isKa: boolean): { header: string; days: DayCard[]; footer: string } {
  const lines = text.split('\n');
  const days: DayCard[] = [];
  let header = '';
  let footer = '';
  let currentDay: DayCard | null = null;
  let headerDone = false;
  let footerStarted = false;

  const dayRegex = isKa
    ? /^[\s#*]*(?:დღე|Day)\s*(\d+)/i
    : /^[\s#*]*Day\s*(\d+)/i;

  const tipRegex = /^[\s#*]*(?:Tips?|Tip|Notes?| რჩევა|შენიშვნა|Additional|Enjoy|Safe|Have)/i;

  for (const line of lines) {
    const dayMatch = line.match(dayRegex);
    if (dayMatch) {
      if (currentDay) days.push(currentDay);
      headerDone = true;
      footerStarted = false;
      const dayNum = dayMatch[1];
      const titlePart = line.replace(dayRegex, '').replace(/^[\s:—\-*#]+/, '').trim();
      currentDay = {
        dayLabel: isKa ? `დღე ${dayNum}` : `Day ${dayNum}`,
        title: titlePart || (isKa ? `დღე ${dayNum}` : `Day ${dayNum}`),
        content: '',
      };
    } else if (currentDay) {
      if (tipRegex.test(line) && days.length > 0) {
        days.push(currentDay);
        currentDay = null;
        footerStarted = true;
        footer += line + '\n';
      } else {
        currentDay.content += line + '\n';
      }
    } else if (footerStarted) {
      footer += line + '\n';
    } else if (!headerDone) {
      header += line + '\n';
    } else {
      footer += line + '\n';
    }
  }
  if (currentDay) days.push(currentDay);

  return { header: header.trim(), days, footer: footer.trim() };
}

// ── Format markdown text ──
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^[-•]\s+/gm, '<span style="color:#4ae3b5;margin-right:4px;">›</span> ')
    .replace(/\n/g, '<br/>');
}

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

  // ── Form State ──
  const [days, setDays] = useState('3');
  const [region, setRegion] = useState('');
  const [vibes, setVibes] = useState<string[]>([]);
  const [pace, setPace] = useState('balanced');
  const [extraNotes, setExtraNotes] = useState('');

  // ── Itinerary State ──
  const [itinerary, setItinerary] = useState<{ header: string; days: DayCard[]; footer: string } | null>(null);
  const [rawResponse, setRawResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState(false);

  // ── Map State ──
  const [activeCoords, setActiveCoords] = useState<[number, number] | null>(null);
  const [highlightedSights, setHighlightedSights] = useState<GeorgianSight[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<GeorgiaVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [input, setInput] = useState('');

  const timelineRef = useRef<HTMLDivElement>(null);

  const analyzeResponseForLocations = useCallback((text: string) => {
    const mentionedSights = georgianSights.filter(sight =>
      new RegExp(sight.titleEn, 'i').test(text) || new RegExp(sight.titleKa, 'i').test(text) || new RegExp(sight.locationEn, 'i').test(text)
    );
    const mentionedVideos = georgiaVideos.filter(video =>
      new RegExp(video.id, 'i').test(text) ||
      new RegExp(video.regionEn, 'i').test(text) ||
      new RegExp(video.titleEn.split('—')[0].trim(), 'i').test(text)
    );
    if (mentionedSights.length > 0) {
      setHighlightedSights(mentionedSights);
      setActiveCoords(mentionedSights[0].coords);
    }
    if (mentionedVideos.length > 0) {
      setRelatedVideos(mentionedVideos);
    }
  }, []);

  const toggleVibe = (v: string) => {
    setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const toggleDay = (idx: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  // ── Build prompt from form and send ──
  const handleGenerate = async (overridePrompt?: string) => {
    const prompt = overridePrompt || buildPromptFromForm();
    if (!prompt || isLoading) return;

    if (!started) setStarted(true);
    setShowForm(false);
    setIsLoading(true);
    setItinerary(null);
    setRawResponse('');
    setRelatedVideos([]);
    setSaved(false);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          mode: 'planner',
          language,
        }),
      });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      const reply = data.reply;
      setRawResponse(reply);
      const parsed = parseItinerary(reply, isKa);
      setItinerary(parsed);
      // Expand all days by default
      setExpandedDays(new Set(parsed.days.map((_, i) => i)));
      analyzeResponseForLocations(prompt + ' ' + reply);
    } catch {
      setRawResponse(isKa ? 'შეცდომა კავშირისას. გთხოვთ სცადოთ ხელახლა.' : 'Connection error. Please try again.');
      setItinerary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const buildPromptFromForm = () => {
    const vibeLabels = vibes.join(', ');
    const regionLabel = region || (isKa ? 'მთელი საქართველო' : 'All Georgia');
    const paceLabel = pace === 'relaxed' ? (isKa ? 'ნელი ტემპი' : 'Relaxed pace') : pace === 'intense' ? (isKa ? 'ინტენსიური' : 'Intense/packed') : (isKa ? 'ბალანსირებული' : 'Balanced pace');

    if (isKa) {
      return `დამიგეგმე ${days}-დღიანი ტური საქართველოში. რეგიონი: ${regionLabel}. სტილი: ${vibeLabels || 'ნებისმიერი'}. ტემპი: ${paceLabel}. ${extraNotes ? `დამატებით: ${extraNotes}` : ''} გთხოვთ, ყველა დღე ცალკე აღწერე "დღე 1:", "დღე 2:" ფორმატით.`;
    }
    return `Plan a ${days}-day tour in Georgia. Region: ${regionLabel}. Travel style: ${vibeLabels || 'any'}. Pace: ${paceLabel}. ${extraNotes ? `Additional notes: ${extraNotes}` : ''} Please structure the response with "Day 1:", "Day 2:" format for each day.`;
  };

  const handleReset = () => {
    setShowForm(true);
    setItinerary(null);
    setRawResponse('');
    setHighlightedSights([]);
    setRelatedVideos([]);
    setSaved(false);
  };

  const handleSave = () => {
    if (!rawResponse) return;
    const saved = JSON.parse(localStorage.getItem('touristgeo_itineraries') || '[]');
    saved.push({ date: new Date().toISOString(), region, days, vibes, response: rawResponse });
    localStorage.setItem('touristgeo_itineraries', JSON.stringify(saved));
    setSaved(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(input); }
  };

  const trending = isKa ? TRENDING_KA : TRENDING;
  const regions = isKa ? REGIONS.ka : REGIONS.en;
  const vibeOptions = isKa ? VIBES.ka : VIBES.en;

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
                {isKa ? 'AI მარშრუტის დამგეგმავი' : 'AI Itinerary Planner'}
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
            <span className="block text-white/90">{isKa ? 'შექმენით თქვენი' : 'Design your perfect'}</span>
            <span className="ai-gradient-text block mt-1">
              {isKa ? 'იდეალური მარშრუტი' : 'Georgian itinerary'}
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
              ? 'აირჩიეთ რეგიონი, სტილი და ხანგრძლივობა — AI შექმნის დეტალურ გეგმას'
              : 'Pick your region, style & duration — our AI crafts a detailed day-by-day plan'}
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
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(input); }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={isKa
                  ? "მინდა ვნახო სვანეთის თოვლიანი მთები და ბათუმის ღამეები..."
                  : "I want to see the snow peaks of Svaneti followed by Batumi nights..."}
                className="flex-1 bg-transparent text-white focus:outline-none text-base md:text-lg placeholder:text-gray-600 py-4"
              />
              <button
                onClick={() => handleGenerate(input)}
                disabled={!input.trim()}
                className="ai-send-btn"
              >
                <span className="hidden md:inline">{isKa ? 'დაგეგმვა' : 'Plan'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>

          {/* Quick Start Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mb-10"
          >
            <button
              onClick={() => { setStarted(true); setShowForm(true); }}
              className="ai-suggestion-chip group text-base px-8 py-3"
            >
              <Compass size={18} className="mr-1 text-[#4ae3b5]" />
              <span>{isKa ? 'ან გამოიყენე გეგმის შემქმნელი' : 'Or use the Itinerary Builder'}</span>
              <ArrowRight size={14} className="ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </button>
          </motion.div>

          {/* Trending Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
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
                  transition={{ duration: 0.5, delay: 1.5 + i * 0.1 }}
                  onClick={() => handleGenerate(t.prompt)}
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
              isKa ? '📅 დღეების გეგმა' : '📅 Day-by-Day Plan',
              isKa ? '⚡ მყისიერი პასუხი' : '⚡ Instant Response'
            ].map((feat, i) => (
              <span key={i} className="hidden md:flex items-center gap-1.5">{feat}</span>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // ── PLANNER & MAP STATE ──
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
      <div className="waze-map relative w-full h-[40vh] md:h-full md:w-[50%] lg:w-[55%] shrink-0 border-b md:border-b-0 md:border-r border-[#1a2524] z-10 flex flex-col">
        <div className="flex-1 relative bg-[#1a202c]">
          <MapContainer center={[42.0, 43.5]} zoom={7} minZoom={6} maxBounds={[[40.0, 38.5], [44.0, 47.5]]} maxBoundsViscosity={1.0} scrollWheelZoom={true} className="w-full h-full z-0" zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <ZoomControl position="bottomleft" />
            <MapController coords={activeCoords} zoom={10} />
            {georgianSights.map((sight) => (
              <WazeMapMarker
                key={sight.id}
                sight={sight}
                isHl={highlightedSights.some(s => s.id === sight.id)}
                isKa={isKa}
                onSelect={() => {
                  setActiveCoords(sight.coords);
                  setHighlightedSights(prev =>
                    prev.some(s => s.id === sight.id) ? prev : [...prev, sight]
                  );
                }}
              />
            ))}
          </MapContainer>

          {/* Waze-style Overlay Badge */}
          <div className="absolute top-5 left-5 z-[1000] pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-500/10 border border-indigo-100">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              <span className="text-xs font-extrabold text-indigo-900 tracking-wide uppercase">
                {highlightedSights.length > 0
                  ? `${highlightedSights.length} ${isKa ? 'ადგილი აღმოჩენილია' : 'places found'}`
                  : isKa ? 'მარშრუტის სიმულაცია' : 'LIVE ROUTE'}
              </span>
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

      {/* RIGHT: Planner Panel */}
      <div className="flex-1 h-[60vh] md:h-full flex flex-col bg-[#0a0e0e] relative z-20 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1a2524] bg-[#0e1514] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="ai-header-icon">
              <Calendar size={14} className="text-[#4ae3b5]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">{isKa ? 'მარშრუტის შემქმნელი' : 'Itinerary Builder'}</h2>
              <p className="text-gray-500 text-[10px] font-medium tracking-wide uppercase mt-0.5">{isKa ? 'AI-ით გაძლიერებული' : 'AI-Powered Planning'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {itinerary && (
              <button onClick={handleReset} className="planner-reset-btn">
                <RotateCcw size={12} />
                {isKa ? 'ახალი' : 'New'}
              </button>
            )}
            <div className="ai-badge px-3 py-1.5 rounded-full flex items-center gap-2">
              <div className="ai-badge-dot" />
              <span className="text-xs text-gray-400 font-medium tracking-wide">{isKa ? 'მზადაა' : 'Ready'}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={timelineRef} className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-[#1a2524] scrollbar-track-transparent">

          {/* ── STRUCTURED FORM ── */}
          <AnimatePresence mode="wait">
            {showForm && !isLoading && !itinerary && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="planner-form space-y-6">
                  {/* Duration & Region Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="planner-form-label">
                        <Calendar size={10} className="inline mr-1" />
                        {isKa ? 'ხანგრძლივობა' : 'Duration'}
                      </label>
                      <select value={days} onChange={e => setDays(e.target.value)} className="planner-form-select">
                        {[1,2,3,4,5,6,7,10,14].map(d => (
                          <option key={d} value={String(d)}>{d} {isKa ? (d === 1 ? 'დღე' : 'დღე') : (d === 1 ? 'Day' : 'Days')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="planner-form-label">
                        <MapPin size={10} className="inline mr-1" />
                        {isKa ? 'რეგიონი' : 'Region'}
                      </label>
                      <select value={region} onChange={e => setRegion(e.target.value)} className="planner-form-select">
                        {regions.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Travel Vibe */}
                  <div>
                    <label className="planner-form-label">
                      <Sparkles size={10} className="inline mr-1" />
                      {isKa ? 'მოგზაურობის სტილი' : 'Travel Vibe'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {vibeOptions.map(v => (
                        <button
                          key={v.value}
                          onClick={() => toggleVibe(v.value)}
                          className={`vibe-pill ${vibes.includes(v.value) ? 'vibe-pill-active' : ''}`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pace */}
                  <div>
                    <label className="planner-form-label">
                      <Zap size={10} className="inline mr-1" />
                      {isKa ? 'ტემპი' : 'Pace'}
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: 'relaxed', label: isKa ? '🐌 ნელი' : '🐌 Relaxed' },
                        { value: 'balanced', label: isKa ? '⚖️ ბალანსი' : '⚖️ Balanced' },
                        { value: 'intense', label: isKa ? '🚀 ინტენსიური' : '🚀 Intense' },
                      ].map(p => (
                        <button
                          key={p.value}
                          onClick={() => setPace(p.value)}
                          className={`vibe-pill flex-1 justify-center ${pace === p.value ? 'vibe-pill-active' : ''}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Extra Notes */}
                  <div>
                    <label className="planner-form-label">
                      {isKa ? '💬 დამატებითი სურვილები' : '💬 Special Requests'}
                    </label>
                    <textarea
                      value={extraNotes}
                      onChange={e => setExtraNotes(e.target.value)}
                      placeholder={isKa ? 'მაგ: მინდა ვნახო ჩანჩქერები, ვეგანური სამზარეულო...' : 'e.g. I love waterfalls, vegan food options, avoid crowded places...'}
                      className="planner-form-input resize-none min-h-[80px]"
                      rows={3}
                    />
                  </div>

                  {/* Generate Button */}
                  <button onClick={() => handleGenerate()} className="planner-generate-btn">
                    <Sparkles size={18} />
                    {isKa ? 'მარშრუტის გენერაცია' : 'Generate Itinerary'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── LOADING STATE ── */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center py-8">
                <div className="ai-loading-dots mx-auto mb-4" style={{ justifyContent: 'center' }}>
                  <span /><span /><span />
                </div>
                <p className="text-[#4ae3b5] text-sm font-bold">{isKa ? 'AI ქმნის თქვენს მარშრუტს...' : 'AI is crafting your itinerary...'}</p>
                <p className="text-gray-500 text-xs mt-2">{isKa ? 'ეს შეიძლება რამდენიმე წამი გასტანოს' : 'This may take a few seconds'}</p>
              </div>
              {/* Skeleton cards */}
              {[1, 2, 3].map(i => (
                <div key={i} className="planner-skeleton h-32 opacity-60" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </motion.div>
          )}

          {/* ── ITINERARY TIMELINE ── */}
          <AnimatePresence mode="wait">
            {itinerary && !isLoading && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Header Summary */}
                {itinerary.header && (
                  <div className="itinerary-header mb-6">
                    <div className="itinerary-day-content" dangerouslySetInnerHTML={{ __html: formatMarkdown(itinerary.header) }} />
                  </div>
                )}

                {/* Day-by-Day Timeline */}
                {itinerary.days.length > 0 ? (
                  <div className="itinerary-timeline">
                    {itinerary.days.map((day, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.12, duration: 0.4 }}
                        className="itinerary-day-card"
                      >
                        <div className="flex items-center justify-between">
                          <div className="itinerary-day-badge">
                            <Calendar size={12} />
                            {day.dayLabel}
                          </div>
                          <button onClick={() => toggleDay(idx)} className="text-gray-500 hover:text-[#4ae3b5] transition-colors p-1">
                            {expandedDays.has(idx) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                        {day.title && (
                          <h3 className="text-white font-bold text-base mb-3">{day.title}</h3>
                        )}
                        <AnimatePresence>
                          {expandedDays.has(idx) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="itinerary-day-content" dangerouslySetInnerHTML={{ __html: formatMarkdown(day.content) }} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  /* Fallback: render raw response if parser couldn't find days */
                  <div className="itinerary-day-card">
                    <div className="itinerary-day-content" dangerouslySetInnerHTML={{ __html: formatMarkdown(rawResponse) }} />
                  </div>
                )}

                {/* Footer / Tips */}
                {itinerary.footer && (
                  <div className="mt-4 p-4 bg-[#131b1a] border border-[#1a2524] rounded-2xl">
                    <div className="itinerary-day-content" dangerouslySetInnerHTML={{ __html: formatMarkdown(itinerary.footer) }} />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6 pb-4">
                  <button onClick={handleSave} disabled={saved} className="itinerary-action-btn">
                    <Heart size={14} className={saved ? 'fill-[#4ae3b5] text-[#4ae3b5]' : ''} />
                    {saved ? (isKa ? 'შენახულია!' : 'Saved!') : (isKa ? 'შენახვა' : 'Save Itinerary')}
                  </button>
                  <button onClick={handleReset} className="itinerary-action-btn">
                    <RotateCcw size={14} />
                    {isKa ? 'ახალი გეგმა' : 'New Plan'}
                  </button>
                  <button onClick={() => setShowForm(true)} className="itinerary-action-btn">
                    <Compass size={14} />
                    {isKa ? 'პარამეტრების შეცვლა' : 'Modify Parameters'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Show form again if user wants to modify */}
          <AnimatePresence>
            {showForm && itinerary && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 mb-4"
              >
                <div className="planner-form space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#4ae3b5] uppercase tracking-[0.15em]">{isKa ? 'პარამეტრების შეცვლა' : 'Modify & Regenerate'}</span>
                    <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="planner-form-label">{isKa ? 'ხანგრძლივობა' : 'Duration'}</label>
                      <select value={days} onChange={e => setDays(e.target.value)} className="planner-form-select">
                        {[1,2,3,4,5,6,7,10,14].map(d => (
                          <option key={d} value={String(d)}>{d} {d === 1 ? (isKa ? 'დღე' : 'Day') : (isKa ? 'დღე' : 'Days')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="planner-form-label">{isKa ? 'რეგიონი' : 'Region'}</label>
                      <select value={region} onChange={e => setRegion(e.target.value)} className="planner-form-select">
                        {regions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => { setShowForm(false); handleGenerate(); }} className="planner-generate-btn">
                    <Sparkles size={18} />
                    {isKa ? 'ხელახლა გენერაცია' : 'Regenerate Itinerary'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
