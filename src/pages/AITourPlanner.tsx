import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../translations';
import { Send, Map, Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface AITourPlannerProps {
  language: Language;
  onNavigate: (page: string, data?: any) => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AITourPlanner({ language, onNavigate }: AITourPlannerProps) {
  const isKa = language === 'ka';
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      content: isKa 
        ? 'გამარჯობა! მე ვარ თქვენი პერსონალური AI ტურების დამგეგმავი. მითხარით სად გსურთ მოგზაურობა, რამდენი დღით, და მე შეგიქმნით დეტალურ მარშრუტს და გირჩევთ საუკეთესო VIP+ ტურებს! 🇬🇪\n\nმაგალითად: "მინდა 3 დღიანი ტური კახეთში, ღვინის დეგუსტაციით და მონასტრების მონახულებით."'
        : 'Hello! I am your personal AI Tour Planner. Tell me where you want to go, for how many days, and I will create a detailed itinerary and recommend the best VIP+ tours for you! 🇬🇪\n\nFor example: "I want a 3-day wine and monastery tour in Kakheti."'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          mode: 'planner',
          language
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (error) {
      console.error('Planner error:', error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: isKa ? 'ბოდიში, ტექნიკური შეცდომაა. გთხოვთ სცადოთ მოგვიანებით.' : 'Sorry, there was a technical error. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const parseLinksAndMarkdown = (text: string) => {
    // Basic markdown parsing for bold and links
    let parsed = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-white/90">$1</em>');
    
    return <div className="space-y-3" dangerouslySetInnerHTML={{ __html: parsed.replace(/\n/g, '<br/>') }} />;
  };

  return (
    <div className="min-h-screen bg-[#050b14] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30 mb-6"
          >
            <Sparkles size={16} />
            <span className="text-sm font-bold tracking-wider uppercase">
              {isKa ? 'AI ტურის დაგეგმვა' : 'AI Tour Planner'}
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-white mb-4"
          >
            {isKa ? 'დაგეგმე შენი იდეალური მოგზაურობა' : 'Plan Your Perfect Trip'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            {isKa 
              ? 'გვიამბეთ თქვენი ინტერესების შესახებ და ჩვენი ხელოვნური ინტელექტი შეგიქმნით პერსონალიზებულ, დეტალურ მარშრუტს წუთებში.' 
              : 'Tell us your interests and our AI will create a personalized, detailed itinerary for you in minutes.'}
          </motion.p>
        </div>

        {/* Chat Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0a1120] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[70vh]"
        >
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] md:max-w-[75%] rounded-2xl px-6 py-4 text-[15px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-br-sm shadow-lg' 
                    : 'bg-white/5 text-white/80 rounded-bl-sm border border-white/5'
                }`}>
                  {parseLinksAndMarkdown(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-sm px-6 py-4 flex items-center gap-3">
                  <Loader2 size={18} className="text-primary animate-spin" />
                  <span className="text-white/50 text-sm">
                    {isKa ? 'ამზადებს საუკეთესო მარშრუტს...' : 'Crafting the perfect itinerary...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 bg-white/5 border-t border-white/10">
            <div className="relative flex items-end gap-4 max-w-4xl mx-auto">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isKa ? 'სად გსურთ მოგზაურობა? (მაგ: 3 დღე კახეთში)' : 'Where do you want to go? (e.g. 3 days in Kakheti)'}
                className="w-full bg-[#050b14] border border-white/10 rounded-2xl py-4 px-6 text-base text-white placeholder-white/30 focus:outline-none focus:border-primary focus:bg-white/5 resize-none max-h-40 min-h-[56px] scrollbar-none transition-all shadow-inner"
                rows={1}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-14 w-14 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg hover:bg-primary-light active:scale-95 transition-all disabled:opacity-50 disabled:hover:bg-primary disabled:active:scale-100"
              >
                <ArrowRight size={24} />
              </button>
            </div>
            <div className="text-center mt-3">
              <p className="text-[11px] text-white/30">
                {isKa 
                  ? 'AI შეიძლება შეცდეს. გთხოვთ გადაამოწმოთ ინფორმაცია.' 
                  : 'AI can make mistakes. Please verify important details.'}
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
