'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Template {
  id: string; name: string; category: string; description: string;
  system_prompt: string; knowledge_base?: string; tags: string[]; use_count: number;
  icon: string;
}

const BUILTIN_TEMPLATES: Template[] = [
  {
    id: 'tpl-support', name: 'Support Client Pro', category: 'commerce', icon: '🛒',
    description: 'Agent de support technique et service client, spécialisé dans la résolution rapide et empathique.',
    system_prompt: `Tu es un agent de support client expert. Ton but est d'aider les utilisateurs avec précision et courtoisie. Règles : 1. Analyse bien la question. 2. Donne une réponse structurée. 3. Si tu ne connais pas la réponse, propose d'ouvrir un ticket support. Ton ton est professionnel mais accessible.`,
    tags: ['support', 'SAV', 'e-commerce'], use_count: 1250,
  },
  {
    id: 'tpl-realestate', name: 'Expert Immobilier', category: 'immobilier', icon: '🏠',
    description: 'Qualifie les acheteurs, présente les biens et organise des visites virtuelles.',
    system_prompt: `Tu es un conseiller immobilier haut de gamme. Aide les visiteurs à filtrer les annonces par budget, localisation et type de bien. Sois force de proposition et mets en avant les atouts des propriétés.`,
    tags: ['immobilier', 'luxe', 'vente'], use_count: 840,
  },
  {
    id: 'tpl-legal', name: 'Assistant Juridique', category: 'juridique', icon: '⚖️',
    description: 'Pré-qualification de dossiers et orientation vers les services du cabinet.',
    system_prompt: `Tu es un assistant juridique rigoureux. Ton rôle est de recueillir les premiers éléments d'un dossier sans jamais donner de conseil légal direct. Propose une consultation avec un avocat.`,
    tags: ['juridique', 'cabinet', 'droit'], use_count: 512,
  },
  {
    id: 'tpl-tech', name: 'Onboarding SaaS', category: 'tech', icon: '🚀',
    description: 'Guide les nouveaux utilisateurs et répond aux questions techniques complexes.',
    system_prompt: `Tu es un expert produit SaaS. Tu connais chaque fonctionnalité sur le bout des doigts. Guide les utilisateurs pour qu'ils tirent le maximum de la plateforme dès les premières secondes.`,
    tags: ['SaaS', 'tech', 'activation'], use_count: 2100,
  },
  {
    id: 'tpl-health', name: 'Conseiller Santé', category: 'santé', icon: '🏥',
    description: 'Informations pratiques, prise de RDV et orientation des patients.',
    system_prompt: `Tu es l'accueil numérique d'un centre de santé. Aide à la prise de RDV et informe sur les horaires. Important : Ne pose pas de diagnostic, oriente vers un professionnel.`,
    tags: ['santé', 'médical', 'RDV'], use_count: 930,
  }
];

const CATEGORY_ICONS: Record<string, string> = {
  commerce: '🛒', tech: '💻', immobilier: '🏠', hospitality: '🍽️',
  rh: '👥', juridique: '⚖️', service: '🧠', santé: '🏥',
  education: '📚', event: '🎉', default: '📋',
};

export default function TemplatesPage() {
  const [dbTemplates, setDbTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Template | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('templates').select('*').eq('is_public', true).order('use_count', { ascending: false });
      setDbTemplates(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const allTemplates = [...BUILTIN_TEMPLATES, ...dbTemplates.map(t => ({ ...t, icon: CATEGORY_ICONS[t.category] || '📋' }))];

  const useTemplate = async (t: Template) => {
    setLoading(true);
    
    // Récupération de l'ID maître local
    const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
    const randomSlug = `agent-${Math.random().toString(36).slice(2, 7)}`;

    const { data, error } = await supabase.from('agents').insert({
      user_id: masterId,
      name: t.name,
      slug: randomSlug,
      description: t.description,
      system_prompt: t.system_prompt,
      knowledge_base: t.knowledge_base || '',
      status: 'active',
      primary_color: '#0A0A0A',
      secondary_color: '#FFFFFF',
      accent_color: '#C0C0C0',
      button_icon: t.icon || '🤖',
      chat_title: t.name,
      welcome_message: `Bonjour ! Je suis votre ${t.name}. Comment puis-je vous aider ?`,
      widget_theme: 'dark',
      language: 'fr',
      ask_phone: false,
      ask_company: false,
      ask_website: false,
      lead_intro: 'Laissez-nous vos coordonnées pour que nous puissions vous recontacter.',
      lead_success: 'Merci ! Un expert vous recontactera sous 24h.'
    }).select().single();
    
    if (error) {
      console.error('Erreur détaillée Supabase:', error);
      alert(`Erreur Supabase : ${error.message} (Détail: ${error.details || 'n/a'})`);
      setLoading(false);
    } else if (data) {
      router.push(`/dashboard/agents/${data.id}`);
    }
  };

  const categories = ['all', ...Array.from(new Set(allTemplates.map(t => t.category)))];

  const filtered = allTemplates.filter(t => {
    const matchCat = filter === 'all' || t.category === filter;
    const matchSearch = !search || [t.name, t.description, ...t.tags].some(s => s?.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>📋 Prompt Library</h1>
          <p style={{ color: '#606060', fontSize: '13px', marginTop: '4px' }}>
            {allTemplates.length} templates prêts à l&apos;emploi — cliquez pour créer un agent instantanément
          </p>
        </div>
        <input className="input" placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '240px' }} />
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '7px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            background: filter === c ? 'rgba(192,192,192,0.1)' : 'transparent',
            border: filter === c ? '1px solid rgba(192,192,192,0.3)' : '1px solid var(--border)',
            color: filter === c ? '#C0C0C0' : '#606060',
            display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize',
          }}>
            {c !== 'all' && (CATEGORY_ICONS[c] || '')} {c === 'all' ? 'Tous' : c}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {filtered.map(t => (
          <div key={t.id} className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setPreview(preview?.id === t.id ? null : t)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
              }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0', marginBottom: '3px' }}>{t.name}</h3>
                <p style={{ fontSize: '12px', color: '#606060', lineHeight: 1.5 }}>{t.description}</p>
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
              {(t.tags || []).map(tag => (
                <span key={tag} style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '10px', fontWeight: 600, background: 'rgba(192,192,192,0.05)', border: '1px solid var(--border)', color: '#606060' }}>
                  #{tag}
                </span>
              ))}
            </div>

            {/* Preview prompt */}
            {preview?.id === t.id && (
              <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#505050', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Prompt complet</div>
                <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{t.system_prompt}</div>
              </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#505050' }}>🔥 {t.use_count || 0} utilisations</span>
              <button onClick={(e) => { e.stopPropagation(); useTemplate(t); }} className="btn-primary" style={{ fontSize: '12px', padding: '7px 14px' }}>
                ⚡ Utiliser →
              </button>
            </div>
          </div>
        ))}

        {/* Custom card */}
        <div style={{
          padding: '22px', borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '10px', cursor: 'pointer', transition: 'all 0.2s', minHeight: '200px', color: '#505050',
        }} onClick={() => router.push('/dashboard/agents/new')}>
          <div style={{ fontSize: '32px' }}>+</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>Agent personnalisé</div>
          <div style={{ fontSize: '12px', textAlign: 'center', lineHeight: 1.5 }}>Créez votre propre agent de zéro</div>
        </div>
      </div>
    </div>
  );
}
