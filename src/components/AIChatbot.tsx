import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../translations';
import { Send, X, Bot, Sparkles, Loader2, MessageCircle, HelpCircle } from 'lucide-react';

interface AIChatbotProps {
  language: Language;
  onNavigate: (page: string, data?: any) => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const SUGGESTED_QUESTIONS = {
  en: [
    { icon: '📤', text: 'How do I upload a tour?' },
    { icon: '🔐', text: 'How do I register as an operator?' },
    { icon: '📅', text: 'How do bookings work?' },
    { icon: '🗺️', text: 'What are the best places in Georgia?' },
    { icon: '⭐', text: 'How do reviews and ratings work?' },
    { icon: '💰', text: 'How is pricing displayed?' },
  ],
  ka: [
    { icon: '📤', text: 'როგორ ავტვირთო ტური?' },
    { icon: '🔐', text: 'როგორ დავრეგისტრირდე ოპერატორად?' },
    { icon: '📅', text: 'როგორ მუშაობს ჯავშანი?' },
    { icon: '🗺️', text: 'საქართველოს საუკეთესო ადგილები?' },
    { icon: '⭐', text: 'როგორ მუშაობს შეფასებები?' },
    { icon: '💰', text: 'როგორ ჩანს ფასები?' },
  ],
};

const WELCOME_MESSAGE = {
  en: `👋 Welcome to **TravelGeorgia Assistant**!

I can help you with:
• **Uploading & managing tours** — step-by-step guidance
• **Account & registration** — tourist or operator accounts
• **Booking & reservations** — how it all works
• **Discovering Georgia** — places, regions, tips

Ask me anything or tap a suggestion below!`,
  ka: `👋 კეთილი იყოს თქვენი მობრძანება **TravelGeorgia ასისტენტში**!

მე შემიძლია დაგეხმაროთ:
• **ტურების ატვირთვა და მართვა** — ნაბიჯ-ნაბიჯ ინსტრუქცია
• **ანგარიში და რეგისტრაცია** — ტურისტი ან ოპერატორი
• **ჯავშანი და რეზერვაცია** — როგორ მუშაობს
• **საქართველოს აღმოჩენა** — ადგილები, რეგიონები, რჩევები

დამისვით შეკითხვა ან აირჩიეთ ქვემოთ მოცემული!`,
};

export default function AIChatbot({ language, onNavigate }: AIChatbotProps) {
  const isKa = language === 'ka';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: isKa ? WELCOME_MESSAGE.ka : WELCOME_MESSAGE.en }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset welcome message when language changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'ai') {
      setMessages([{ role: 'ai', content: isKa ? WELCOME_MESSAGE.ka : WELCOME_MESSAGE.en }]);
    }
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async (overrideInput?: string) => {
    const userMsg = (overrideInput || input).trim();
    if (!userMsg || isLoading) return;

    setInput('');
    setShowSuggestions(false);
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          mode: 'chat',
          language
        })
      });

      if (!response.ok) {
        let errorMsg = 'Failed to get response';
        try {
          const errData = await response.json();
          errorMsg = errData.details || errData.error || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (error) {
      console.error('Chat error:', error);
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

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  const parseMarkdown = (text: string) => {
    let parsed = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-white/80">$1</em>')
      .replace(/^• /gm, '<span class="text-primary mr-1">›</span> ');
    return <div className="text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: parsed.replace(/\n/g, '<br/>') }} />;
  };

  const suggestions = isKa ? SUGGESTED_QUESTIONS.ka : SUGGESTED_QUESTIONS.en;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[3000] w-14 h-14 bg-gradient-to-br from-primary to-emerald-400 rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-2xl bg-primary/40 animate-ping opacity-20"></div>
            <MessageCircle size={26} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-6 right-6 z-[3000] w-[92vw] max-w-[420px] h-[620px] max-h-[85vh] bg-[#0a0f1e] border border-white/[0.08] rounded-[28px] shadow-[0_32px_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-4 flex items-center justify-between shrink-0">
              {/* Subtle gradient border bottom */}
              <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-emerald-500/20 flex items-center justify-center text-primary border border-primary/20">
                    <Sparkles size={20} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0a0f1e]" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-[14px] tracking-tight">
                    {isKa ? 'TravelGeorgia' : 'TravelGeorgia'}
                  </h3>
                  <p className="text-emerald-400/80 text-[10px] uppercase tracking-[0.15em] font-bold">
                    {isKa ? 'AI ასისტენტი' : 'AI Assistant'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-white/5">
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx === messages.length - 1 ? 0.05 : 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center text-primary mr-2 mt-1 shrink-0">
                      <Bot size={14} />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-br-md shadow-lg shadow-primary/15' 
                      : 'bg-white/[0.04] text-white/85 rounded-bl-md border border-white/[0.06]'
                  }`}>
                    {parseMarkdown(msg.content)}
                  </div>
                </motion.div>
              ))}

              {/* Suggested Questions */}
              {showSuggestions && messages.length <= 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="space-y-2 pt-1"
                >
                  <div className="flex items-center gap-1.5 px-1 mb-2">
                    <HelpCircle size={12} className="text-white/25" />
                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">
                      {isKa ? 'პოპულარული კითხვები' : 'Popular Questions'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {suggestions.map((q, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.06 }}
                        onClick={() => handleSuggestionClick(q.text)}
                        className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-primary/10 hover:border-primary/20 transition-all duration-300 text-left"
                      >
                        <span className="text-base shrink-0">{q.icon}</span>
                        <span className="text-[12px] font-medium text-white/60 group-hover:text-white/90 transition-colors leading-tight">
                          {q.text}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center text-primary mr-2 mt-1 shrink-0">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-white/35 text-[12px]">{isKa ? 'ფიქრობს...' : 'Thinking...'}</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 shrink-0">
              <div className="relative flex items-end gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1.5 focus-within:border-primary/30 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isKa ? 'დაწერეთ შეკითხვა...' : 'Type your question...'}
                  className="w-full bg-transparent rounded-xl py-2.5 px-3.5 text-[13px] text-white placeholder-white/25 focus:outline-none resize-none max-h-28 min-h-[40px] scrollbar-none"
                  rows={1}
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 112)}px`;
                  }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 shrink-0 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 hover:bg-emerald-500 active:scale-90 transition-all disabled:opacity-30 disabled:hover:bg-primary disabled:active:scale-100"
                >
                  <Send size={16} className="ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
