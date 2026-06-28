import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../translations';
import { Send, Map as MapIcon, Sparkles, Loader2, ArrowRight, Compass, Mountain, Wine, Church, TreePine, Route } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { georgianSights, GeorgianSight } from '../data/georgianSights';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ coords, zoom }: { coords: [number, number] | null, zoom: number }) {
  const map = useMap();
  useEffect(() => { if (coords) map.flyTo(coords, zoom, { duration: 1.5 }); }, [coords, zoom, map]);
  return null;
}

interface AITourPlannerProps { language: Language; onNavigate: (page: string, data?: any) => void; }
interface Message { role: 'user' | 'ai'; content: string; }

const QUICK_PROMPTS = {
  en: [
    { icon: <Mountain size={16} />, label: '3-day Svaneti trek', prompt: 'Plan a 3-day hiking tour in Svaneti with Mestia and Ushguli' },
    { icon: <Wine size={16} />, label: 'Wine tour Kakheti', prompt: 'Plan a 2-day wine tasting tour in the Kakheti region' },
    { icon: <Church size={16} />, label: 'Cultural heritage', prompt: 'Plan a cultural heritage tour visiting UNESCO sites in Georgia' },
    { icon: <TreePine size={16} />, label: 'Nature & adventure', prompt: 'Plan a 4-day adventure tour with canyons, caves and waterfalls' },
    { icon: <Compass size={16} />, label: 'Full Georgia tour', prompt: 'Plan a 7-day complete Georgia tour from Tbilisi covering all major regions' },
    { icon: <Route size={16} />, label: 'Weekend getaway', prompt: 'Plan a 2-day weekend getaway from Tbilisi to Kazbegi' },
  ],
  ka: [
    { icon: <Mountain size={16} />, label: '3-დღიანი სვანეთი', prompt: 'დამიგეგმე 3-დღიანი ლაშქრობა სვანეთში მესტიით და უშგულით' },
    { icon: <Wine size={16} />, label: 'ღვინის ტური კახეთი', prompt: 'დამიგეგმე 2-დღიანი ღვინის ტური კახეთის რეგიონში' },
    { icon: <Church size={16} />, label: 'კულტურული მემკვიდრეობა', prompt: 'დამიგეგმე კულტურული ტური UNESCO-ს ძეგლებით საქართველოში' },
    { icon: <TreePine size={16} />, label: 'ბუნება და თავგადასავალი', prompt: 'დამიგეგმე 4-დღიანი სათავგადასავლო ტური კანიონებით და მღვიმეებით' },
    { icon: <Compass size={16} />, label: 'სრული ტური', prompt: 'დამიგეგმე 7-დღიანი სრული ტური თბილისიდან ყველა მთავარ რეგიონში' },
    { icon: <Route size={16} />, label: 'შაბათ-კვირა', prompt: 'დამიგეგმე 2-დღიანი შაბათ-კვირის ტური თბილისიდან ყაზბეგში' },
  ],
};

export default function AITourPlanner({ language, onNavigate }: AITourPlannerProps) {
  const isKa = language === 'ka';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [activeCoords, setActiveCoords] = useState<[number, number] | null>(null);
  const [highlightedSights, setHighlightedSights] = useState<GeorgianSight[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const analyzeResponseForLocations = (text: string) => {
    const mentioned = georgianSights.filter(sight => {
      return new RegExp(sight.titleEn, 'i').test(text) || new RegExp(sight.titleKa, 'i').test(text);
    });
    if (mentioned.length > 0) {
      setHighlightedSights(mentioned);
      setActiveCoords(mentioned[0].coords);
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
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), mode: 'planner', language })
      });
      if (!response.ok) { const errData = await response.json().catch(() => ({})); throw new Error(errData.details || 'Failed'); }
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      analyzeResponseForLocations(data.reply);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: isKa ? 'ბოდიში, ტექნიკური შეცდომაა.' : 'Sorry, there was a technical error.' }]);
    } finally { setIsLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const parseMarkdown = (text: string) => {
    let parsed = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-white/90">$1</em>');
    return <div className="space-y-2 text-[13.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: parsed.replace(/\n/g, '<br/>') }} />;
  };

  const prompts = isKa ? QUICK_PROMPTS.ka : QUICK_PROMPTS.en;

  // ── HERO / LANDING STATE ──
  if (!started) {
    return (
      <div className="min-h-[calc(100vh-80px)] w-full bg-[#050a15] relative overflow-hidden flex flex-col">
        <style>{`
          @keyframes float-orb { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.05); } }
          @keyframes grid-fade { 0% { opacity: 0; } 50% { opacity: 0.03; } 100% { opacity: 0; } }
          .orb-1 { animation: float-orb 8s ease-in-out infinite; }
          .orb-2 { animation: float-orb 10s ease-in-out infinite 2s; }
          .orb-3 { animation: float-orb 12s ease-in-out infinite 4s; }
        `}</style>

        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb-1 absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[120px]" />
          <div className="orb-2 absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-emerald-400/[0.03] blur-[100px]" />
          <div className="orb-3 absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full bg-cyan-400/[0.02] blur-[80px] -translate-x-1/2 -translate-y-1/2" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles size={14} className="text-primary" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
              {isKa ? 'AI დაფუძნებული' : 'AI-Powered'}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white text-center leading-[1.05] tracking-tight mb-5 font-display"
          >
            {isKa ? (
              <>{`დაგეგმე შენი`}<br/><span className="bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 bg-clip-text text-transparent">{`იდეალური ტური`}</span></>
            ) : (
              <>{`Plan Your`}<br/><span className="bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 bg-clip-text text-transparent">{`Perfect Journey`}</span></>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-white/40 text-center text-[15px] sm:text-base max-w-lg mb-10 leading-relaxed"
          >
            {isKa
              ? 'AI ასისტენტი შეგიქმნით პერსონალურ მარშრუტს საქართველოში, რეალურ რუკაზე დატანილი ადგილებით.'
              : 'Our AI assistant creates personalized Georgian itineraries, with every location mapped out in real time.'}
          </motion.p>

          {/* Input Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5 }}
            className="w-full max-w-xl mb-10"
          >
            <div className="relative flex items-center gap-2 bg-white/[0.05] border border-white/[0.1] rounded-2xl p-2 focus-within:border-primary/40 focus-within:bg-white/[0.07] transition-all shadow-2xl shadow-black/30">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder={isKa ? 'მაგ: 3 დღიანი ტური კახეთში...' : 'e.g. 3-day tour in Kakheti...'}
                className="flex-1 bg-transparent px-4 py-3 text-[15px] text-white placeholder-white/25 focus:outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="h-12 px-6 rounded-xl bg-primary text-white font-bold text-[14px] flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-30"
              >
                <Sparkles size={16} />
                {isKa ? 'დაგეგმე' : 'Plan'}
              </button>
            </div>
          </motion.div>

          {/* Quick Prompts Grid */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
            className="w-full max-w-2xl"
          >
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] text-center mb-4">
              {isKa ? 'ან აირჩიე მზა იდეა' : 'Or pick a ready-made idea'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {prompts.map((p, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 + i * 0.06 }}
                  onClick={() => handleSend(p.prompt)}
                  className="group flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-primary/10 hover:border-primary/25 transition-all duration-300 text-left"
                >
                  <span className="text-white/30 group-hover:text-primary transition-colors shrink-0">{p.icon}</span>
                  <span className="text-[12px] font-medium text-white/50 group-hover:text-white/90 transition-colors leading-tight">{p.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050a15] to-transparent pointer-events-none" />
      </div>
    );
  }

  // ── CHAT + MAP STATE ──
  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col md:flex-row bg-[#050a15] overflow-hidden">
      <style>{`
        .leaflet-container { background: #050a15 !important; }
        .leaflet-bar { border: none !important; box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important; }
        .leaflet-bar a { background-color: #0f172a !important; color: white !important; border: 1px solid rgba(255,255,255,0.08) !important; width: 36px !important; height: 36px !important; line-height: 36px !important; }
        .leaflet-bar a:hover { background-color: var(--color-primary) !important; }
        .custom-marker-icon { background: none; border: none; }
      `}</style>

      {/* LEFT: Map */}
      <div className="relative w-full h-[45vh] md:h-full md:w-[60%] lg:w-[65%] shrink-0">
        <MapContainer center={[42.0, 43.5]} zoom={7} minZoom={6} maxBounds={[[40.0, 38.5], [44.0, 47.5]]} maxBoundsViscosity={1.0} scrollWheelZoom={true} className="w-full h-full z-0" zoomControl={false} attributionControl={false}>
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png" opacity={0.7} />
          <ZoomControl position="topright" />
          <MapController coords={activeCoords} zoom={9} />
          {georgianSights.map((sight) => {
            const isHl = highlightedSights.some(s => s.id === sight.id);
            const customIcon = L.divIcon({
              className: 'custom-marker-icon',
              html: `<div class="flex flex-col items-center group">
                <div class="p-1.5 rounded-full border-2 transition-all duration-300 ${isHl ? 'bg-primary border-white text-white scale-125 shadow-[0_0_20px_rgba(5,150,105,0.5)]' : 'bg-white/15 border-white/30 text-white/50 hover:bg-white hover:text-primary hover:border-primary hover:scale-110 backdrop-blur-sm'}">
                  <div class="w-4 h-4 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="${isHl ? 16 : 14}" height="${isHl ? 16 : 14}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                </div>
                <div class="mt-0.5 bg-black/80 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider whitespace-nowrap ${isHl ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity">
                  ${isKa ? sight.titleKa : sight.titleEn}
                </div>
              </div>`,
              iconSize: [32, 32], iconAnchor: [16, 32]
            });
            return <Marker key={sight.id} position={sight.coords} icon={customIcon} eventHandlers={{ click: () => setInput(prev => prev + (prev.endsWith(' ') ? '' : ' ') + (isKa ? sight.titleKa : sight.titleEn)) }} />;
          })}
        </MapContainer>

        {/* Map overlay badge */}
        <div className="absolute top-5 left-5 z-[1000]">
          <div className="bg-[#0f172a]/85 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/[0.08] flex items-center gap-2.5 shadow-xl">
            <MapIcon size={16} className="text-primary" />
            <div>
              <p className="text-[12px] font-bold text-white tracking-tight leading-none">{isKa ? 'ინტერაქტიული რუკა' : 'Interactive Map'}</p>
              <p className="text-[9px] text-white/35 font-medium mt-0.5">{isKa ? 'ადგილები გამოჩნდება AI პასუხიდან' : 'Locations appear from AI responses'}</p>
            </div>
          </div>
        </div>

        {/* Highlighted count badge */}
        {highlightedSights.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute bottom-5 left-5 z-[1000]">
            <div className="bg-primary/90 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/30">
              <Route size={14} className="text-white" />
              <span className="text-[11px] font-bold text-white">{highlightedSights.length} {isKa ? 'ადგილი ნაპოვნია' : 'places found'}</span>
            </div>
          </motion.div>
        )}

        {/* Divider line */}
        <div className="hidden md:block absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      </div>

      {/* RIGHT: Chat */}
      <div className="flex-1 h-[55vh] md:h-full bg-[#080e1c] flex flex-col relative">
        {/* Chat Header */}
        <div className="px-5 py-4 flex items-center gap-3 shrink-0 relative">
          <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/25 to-emerald-500/15 flex items-center justify-center text-primary border border-primary/15">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-white font-bold text-[14px] tracking-tight">{isKa ? 'AI ტურის დაგეგმვა' : 'AI Tour Planner'}</h2>
            <p className="text-emerald-400/60 text-[9px] uppercase tracking-[0.15em] font-bold">{isKa ? 'პერსონალური ასისტენტი' : 'Personal Assistant'}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin scrollbar-thumb-white/5">
          {messages.map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md shadow-lg shadow-primary/15'
                  : 'bg-white/[0.04] text-white/80 rounded-bl-md border border-white/[0.06]'
              }`}>
                {parseMarkdown(msg.content)}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2.5">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-white/35 text-[12px]">{isKa ? 'გეგმავს მარშრუტს...' : 'Planning your route...'}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 shrink-0">
          <div className="relative flex items-end gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1.5 focus-within:border-primary/30 transition-colors">
            <textarea
              value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={isKa ? 'სად გსურთ მოგზაურობა?' : 'Where do you want to go?'}
              className="w-full bg-transparent rounded-xl py-3 px-4 text-[14px] text-white placeholder-white/25 focus:outline-none resize-none max-h-28 min-h-[48px] scrollbar-none"
              rows={1} style={{ height: 'auto' }}
              onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 112)}px`; }}
            />
            <button onClick={() => handleSend()} disabled={!input.trim() || isLoading}
              className="h-12 w-12 shrink-0 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 hover:bg-emerald-500 active:scale-90 transition-all disabled:opacity-30">
              <ArrowRight size={20} />
            </button>
          </div>
          <p className="text-center mt-2 text-[10px] text-white/20">{isKa ? 'AI შეიძლება შეცდეს. გადაამოწმეთ ინფორმაცია.' : 'AI can make mistakes. Verify important details.'}</p>
        </div>
      </div>
    </div>
  );
}
