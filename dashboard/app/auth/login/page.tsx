'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPageWrapper() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#050505' }} />}><LoginPage /></Suspense>;
}

const PIN_CODE = process.env.NEXT_PUBLIC_ADMIN_PIN || '2008';

function LoginPage() {
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const router = useRouter();
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    // Focus first input
    setTimeout(() => inputRefs[0].current?.focus(), 300);
  }, []);

  useEffect(() => {
    const code = pin.join('');
    if (code.length === 4) {
      handleLogin(code);
    }
  }, [pin]);

  const handleLogin = (code: string) => {
    setLoading(true);
    if (code === PIN_CODE) {
      // SUCCESS: Accès accordé via code local uniquement
      localStorage.setItem('siby_admin_access', 'true');
      localStorage.setItem('siby_admin_id', '00000000-0000-0000-0000-000000000000');
      localStorage.setItem('siby_last_login', new Date().toISOString());
      
      router.push('/dashboard');
    } else {
      setError('Code PIN incorrect');
      setShake(true);
      setLoading(false);
      setTimeout(() => { 
        setShake(false); 
        setPin(['', '', '', '']); 
        inputRefs[0].current?.focus(); 
      }, 600);
    }
  };



  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050505', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: '380px',
        background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '24px', padding: '40px 32px',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.8)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #fff, #888)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
          }}>⚡</div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>
            Siby Widget
          </h1>
          <p style={{ fontSize: '13px', color: '#505050', marginTop: '6px' }}>
            Administration Locale
          </p>
        </div>

        {/* PIN inputs */}
        <div style={{
          display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px',
          animation: shake ? 'pinShake 0.5s ease' : 'none',
        }}>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                width: '56px', height: '64px', textAlign: 'center',
                fontSize: '24px', fontWeight: 800, color: '#F0F0F0',
                background: digit ? 'rgba(192,192,192,0.08)' : 'rgba(255,255,255,0.03)',
                border: digit ? '2px solid rgba(192,192,192,0.3)' : '2px solid rgba(255,255,255,0.08)',
                borderRadius: '14px', outline: 'none',
                transition: 'all 0.2s',
                caretColor: 'transparent',
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: '10px', marginBottom: '16px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#EF4444', fontSize: '13px', textAlign: 'center',
          }}>{error}</div>
        )}

        {loading && !error && (
          <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '14px', color: '#C0C0C0' }}>
            Accès en cours...
          </div>
        )}

        {/* Number pad */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
          maxWidth: '260px', margin: '0 auto',
        }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((digit, i) => (
            digit === '' ? <div key={i} /> : (
              <button key={i} onClick={() => {
                if (digit === '⌫') {
                  const lastIdx = pin.map((p, idx) => p !== '' ? idx : -1).filter(idx => idx !== -1).pop();
                  if (lastIdx !== undefined) {
                    const newPin = [...pin];
                    newPin[lastIdx] = '';
                    setPin(newPin);
                    inputRefs[lastIdx].current?.focus();
                  }
                } else {
                  const emptyIdx = pin.findIndex(p => p === '');
                  if (emptyIdx !== -1) handleInput(emptyIdx, digit);
                }
              }} style={{
                height: '52px', borderRadius: '12px', fontSize: '20px',
                fontWeight: 700, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#C0C0C0',
                transition: 'all 0.15s',
              }}
              >{digit}</button>
            )
          ))}
        </div>

        <div style={{
          marginTop: '28px', paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center', fontSize: '11px', color: '#303030',
        }}>
          🔒 Entrée réservée à Siby
        </div>
      </div>

      <style>{`
        @keyframes pinShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
