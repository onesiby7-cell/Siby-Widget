'use client';

const PLANS = [
  {
    name: 'Free', price: '0€', period: '/mois', color: '#888',
    features: ['1 agent', '500 messages/mois', 'Branding Siby Widget', 'Support communauté'],
    cta: 'Plan actuel', disabled: true,
  },
  {
    name: 'Starter', price: '19€', period: '/mois', color: '#C0C0C0',
    features: ['5 agents', '5 000 messages/mois', 'Sans branding', 'Webhooks', 'Export CSV', 'Support email'],
    cta: 'Passer au Starter', disabled: false, popular: false,
  },
  {
    name: 'Pro', price: '49€', period: '/mois', color: '#E8E8E8',
    features: ['20 agents', '50 000 messages/mois', 'Tout Starter', 'Analytics avancé', 'API REST', 'Gestion équipe', 'Support prioritaire'],
    cta: 'Passer au Pro', disabled: false, popular: true,
  },
  {
    name: 'Enterprise', price: 'Sur devis', period: '', color: '#fff',
    features: ['Agents illimités', 'Messages illimités', 'Tout Pro', 'SLA 99.9%', 'Onboarding dédié', 'Support 24/7', 'Intégrations custom'],
    cta: 'Nous contacter', disabled: false,
  },
];

export default function BillingPage() {
  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-1px', marginBottom: '10px' }}>
          💳 Choisissez votre plan
        </h1>
        <p style={{ color: '#606060', fontSize: '15px' }}>
          Tous les plans incluent un essai de 14 jours. Annulation à tout moment.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{
            padding: '28px 22px', borderRadius: '20px', position: 'relative',
            background: plan.popular ? 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' : 'var(--bg-surface)',
            border: plan.popular ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--border)',
            boxShadow: plan.popular ? '0 0 40px rgba(200,200,200,0.08)' : 'none',
            display: 'flex', flexDirection: 'column',
          }}>
            {plan.popular && (
              <div style={{
                position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                padding: '4px 14px', borderRadius: '100px',
                background: 'linear-gradient(135deg, #fff, #C0C0C0)',
                color: '#0A0A0A', fontSize: '11px', fontWeight: 800,
                letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>⭐ Populaire</div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                {plan.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-1px' }}>{plan.price}</span>
                <span style={{ fontSize: '13px', color: '#606060' }}>{plan.period}</span>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#888', alignItems: 'flex-start' }}>
                  <span style={{ color: '#22C55E', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <button
              disabled={plan.disabled}
              style={{
                padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                cursor: plan.disabled ? 'default' : 'pointer',
                background: plan.disabled ? 'var(--bg-elevated)' : plan.popular ? 'linear-gradient(135deg, #fff, #C0C0C0)' : 'var(--bg-elevated)',
                border: plan.disabled ? '1px solid var(--border)' : plan.popular ? 'none' : '1px solid rgba(255,255,255,0.15)',
                color: plan.disabled ? '#505050' : plan.popular ? '#0A0A0A' : '#F0F0F0',
                transition: 'all 0.2s',
              }}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F0', marginBottom: '20px' }}>Questions fréquentes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {[
            { q: 'Puis-je changer de plan ?', a: 'Oui, à tout moment. La différence est calculée au prorata.' },
            { q: 'Que se passe-t-il si je dépasse mon quota ?', a: 'L\'agent répond "quota dépassé". Aucun frais surprenant.' },
            { q: 'Les clés API sont-elles sécurisées ?', a: 'Oui, elles sont stockées chiffrées et jamais exposées côté client.' },
            { q: 'Y a-t-il un engagement ?', a: 'Non, sans engagement. Résiliez quand vous voulez.' },
          ].map(faq => (
            <div key={faq.q}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F0F0F0', marginBottom: '5px' }}>{faq.q}</div>
              <div style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
