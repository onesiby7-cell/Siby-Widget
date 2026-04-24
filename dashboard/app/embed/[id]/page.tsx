'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Agent } from '@/lib/supabase';

export default function EmbedPage() {
  const params = useParams();
  const id = params?.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const fetchAgent = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('agents').select('*').eq('id', id).single();
      if (data) {
        setAgent(data);
        setMessages([{ role: 'assistant', content: data.welcome_message || 'Bonjour 👋 Comment puis-je vous aider ?' }]);
      }
    };
    fetchAgent();
  }, [id]);

  useEffect(() => {
    const notifyParent = () => {
      const state = isOpen ? 'open' : 'closed';
      // Standard Platinum Dimensions
      const width = isOpen ? 400 : 80;
      const height = isOpen ? 600 : 80;
      
      window.parent.postMessage({
        type: 'siby-resize',
        state,
        width: `${width}px`,
        height: `${height}px`
      }, '*');
    };
    notifyParent();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!agent) return null;

  const primaryColor = agent.primary_color || '#0A0A0A';
  const isDark = agent.widget_theme !== 'light';
  const glassBlur = agent.glass_blur || '12px';
  const glassOpacity = agent.glass_opacity || '0.1';

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('https://vhchlbmzihnkoyrofsfs.supabase.co/functions/v1/chat-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: id,
          message: userMsg.content,
          history: messages.slice(-10)
        })
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Erreur de connexion.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-end justify-end p-4 pointer-events-none font-sans">
      <style jsx global>{`
        body { background: transparent !important; margin: 0; padding: 0; overflow: hidden; }
        .glass {
          background: ${isDark ? `rgba(10, 10, 10, ${1 - parseFloat(glassOpacity)})` : `rgba(255, 255, 255, ${1 - parseFloat(glassOpacity)})`};
          backdrop-filter: blur(${glassBlur});
          -webkit-backdrop-filter: blur(${glassBlur});
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
        }
        
        /* Surprise Feature: Rainbow Glow */
        .rainbow-glow {
          position: relative;
        }
        .rainbow-glow::after {
          content: '';
          position: absolute;
          inset: -3px;
          background: linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
          background-size: 400%;
          z-index: -1;
          filter: blur(8px);
          animation: rainbow 20s linear infinite;
          border-radius: inherit;
          opacity: ${agent.rainbow_glow ? '0.7' : '0'};
        }

        @keyframes rainbow {
          0% { background-position: 0 0; }
          50% { background-position: 400% 0; }
          100% { background-position: 0 0; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }

        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }

        .animate-fade-up { animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s infinite; }
        
        .logo-shape-circle { border-radius: 50% !important; }
        .logo-shape-square { border-radius: 12px !important; }
        .logo-shape-rounded { border-radius: 20px !important; }
      `}</style>

      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto w-[380px] h-[580px] glass rounded-[24px] shadow-2xl flex flex-col overflow-hidden mb-4 animate-fade-up origin-bottom-right">
          {/* Header */}
          <div 
            className="p-4 flex items-center gap-3 text-white"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, #1a1a1a)` }}
          >
            <div className="relative">
              {agent.avatar_url ? (
                <img src={agent.avatar_url} className="w-10 h-10 rounded-full object-cover border border-white/20" alt="Avatar" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl border border-white/20">
                  {agent.button_icon || '🤖'}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm leading-tight">{agent.chat_title || 'Assistant'}</div>
              <div className="text-[10px] opacity-70 font-medium">{agent.chat_subtitle || 'En ligne'}</div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'text-white rounded-br-none' 
                      : `${isDark ? 'bg-white/5' : 'bg-black/5'} rounded-bl-none text-inherit`
                  }`}
                  style={m.role === 'user' ? { backgroundColor: primaryColor } : {}}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`p-3 rounded-2xl rounded-bl-none text-sm opacity-50 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  •••
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 bg-black/5">
            <div className="flex gap-2 items-end glass bg-white/5 rounded-2xl p-2 border-white/10">
              <textarea 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder={agent.placeholder_text || 'Écrivez ici...'}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none py-2 max-h-32 text-inherit placeholder-white/30"
                rows={1}
              />
              <button 
                onClick={handleSend}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: primaryColor }}
              >
                ➤
              </button>
            </div>
            <div className="text-[9px] text-center mt-3 opacity-30 font-bold uppercase tracking-wider">
              Propulsé par <a href="https://siby-widget.com" target="_blank" className="hover:opacity-100 transition-opacity">Siby AI</a>
            </div>
          </div>
        </div>
      )}

      {/* Launcher */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto w-16 h-16 shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 border border-white/10 overflow-hidden group 
          ${agent.logo_shape ? `logo-shape-${agent.logo_shape}` : 'rounded-full'} 
          ${agent.rainbow_glow ? 'rainbow-glow' : ''} 
          ${agent.animation_style === 'float' ? 'animate-float' : ''} 
          ${agent.animation_style === 'pulse' ? 'animate-pulse-glow' : ''}`}
        style={{ background: `linear-gradient(135deg, ${primaryColor}, #1a1a1a)` }}
      >
        {isOpen ? (
          <span className="text-2xl text-white transform rotate-90 transition-transform">✕</span>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
             {agent.avatar_url ? (
                <img src={agent.avatar_url} className={`w-full h-full object-cover group-hover:scale-110 transition-transform ${agent.logo_shape ? `logo-shape-${agent.logo_shape}` : 'rounded-full'}`} alt="Launcher" />
             ) : (
                <span className="text-3xl">{agent.button_icon || '🤖'}</span>
             )}
          </div>
        )}
      </button>
    </div>
  );
}
