'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, company: form.company } },
    });
    if (error) { setError(error.message); setLoading(false); }
    else { setSuccess(true); setLoading(false); }
  };

  if (success) return (
    <div style={{
      minHeight: '100vh', background: '#050505', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      <div style={{
        textAlign: 'center', maxWidth: '400px', padding: '40px',
        background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
        <h2 style={{ color: '#F0F0F0', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
          Vérifiez votre email
        </h2>
        <p style={{ color: '#707070', fontSize: '14px', lineHeight: 1.7 }}>
          Un lien de confirmation a été envoyé à <strong style={{ color: '#C0C0C0' }}>{form.email}</strong>.
          Cliquez dessus pour activer votre compte.
        </p>
        <Link href="/auth/login" style={{
          display: 'inline-block', marginTop: '24px', color: '#C0C0C0',
          textDecoration: 'none', fontSize: '14px', fontWeight: 600,
        }}>← Retour à la connexion</Link>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: '#050505', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px', padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '32px' }}>⚡</span>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px', marginTop: '8px' }}>
            Créer un compte
          </h1>
          <p style={{ fontSize: '13px', color: '#606060', marginTop: '4px' }}>Gratuit — Aucune carte requise</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { key: 'full_name', label: 'Nom complet', type: 'text', placeholder: 'Ibrahim Siby' },
            { key: 'company', label: 'Entreprise (optionnel)', type: 'text', placeholder: 'One Siby Agency' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'vous@example.com' },
            { key: 'password', label: 'Mot de passe', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input
                className="input"
                type={f.type}
                value={(form as never)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                required={f.key !== 'company'}
              />
            </div>
          ))}

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#EF4444', fontSize: '13px',
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            {loading ? '⏳ Création...' : '→ Créer mon compte'}
          </button>
        </form>

        <div style={{
          marginTop: '24px', paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center', fontSize: '13px', color: '#606060',
        }}>
          Déjà un compte ?{' '}
          <Link href="/auth/login" style={{ color: '#C0C0C0', textDecoration: 'none', fontWeight: 600 }}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
