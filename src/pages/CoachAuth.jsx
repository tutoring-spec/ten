import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// ─── helpers ──────────────────────────────────────────────────────────────────

const BRAND = {
  lime:    '#C8F000',
  black:   '#0A0A0A',
  font:    'Montserrat, sans-serif',
};

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Label style={{ fontFamily: BRAND.font, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' }}>
        {label}
      </Label>
      {children}
      {error && <p style={{ fontSize: '11px', color: '#dc2626', fontFamily: BRAND.font }}>{error}</p>}
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ fontFamily: BRAND.font, paddingRight: '44px' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#999' }}
        aria-label={show ? 'Nascondi password' : 'Mostra password'}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email.trim())    e.email    = 'Inserisci la tua email';
    if (!form.password)        e.password = 'Inserisci la tua password';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      // 1. Autentica con base44
      await base44.auth.login(email, password);

      // 2. Verifica che l'allenatore abbia accesso attivo
      const accesses = await base44.entities.CoachCourseAccess.filter({
        coach_email: email.toLowerCase().trim(),
        active: true,
      });

      if (accesses.length === 0) {
        // Logout immediato — account esiste ma non è stato approvato
        await base44.auth.logout().catch(() => {});
        throw new Error('Il tuo accesso non è ancora stato approvato dall\'amministratore. Riceverai una notifica quando sarà attivato.');
      }

      return accesses[0];
    },
    onSuccess,
    onError: (err) => {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('credenzial') || msg.toLowerCase().includes('invalid')) {
        setErrors({ password: 'Email o password errati' });
      } else {
        toast.error(msg || 'Errore durante il login');
      }
    },
  });

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    loginMutation.mutate(form);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Field label="Email" error={errors.email}>
        <Input
          type="email"
          value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="tuaemail@esempio.com"
          autoComplete="email"
          style={{ fontFamily: BRAND.font }}
        />
      </Field>

      <Field label="Password" error={errors.password}>
        <PasswordInput
          value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          placeholder="La tua password"
        />
      </Field>

      <Button
        type="submit"
        disabled={loginMutation.isPending}
        style={{ backgroundColor: BRAND.lime, color: BRAND.black, fontFamily: BRAND.font, fontWeight: 800, fontSize: '14px', height: '48px', borderRadius: '10px', cursor: loginMutation.isPending ? 'not-allowed' : 'pointer', opacity: loginMutation.isPending ? 0.7 : 1 }}
      >
        {loginMutation.isPending ? '⏳ Accesso in corso...' : '⚡ Accedi al Videocorso'}
      </Button>
    </form>
  );
}

// ─── Register form ────────────────────────────────────────────────────────────

function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    club: '',
    years_experience: '',
    motivation: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())                          e.full_name        = 'Inserisci nome e cognome';
    if (!form.email.includes('@'))                       e.email            = 'Email non valida';
    if (form.password.length < 8)                        e.password         = 'La password deve avere almeno 8 caratteri';
    if (form.password !== form.confirm_password)         e.confirm_password = 'Le password non coincidono';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Crea l'account con base44 auth
      await base44.auth.register(data.email, data.password, {
        full_name: data.full_name,
        role: 'coach',
      });

      // 2. Crea la richiesta di accesso per l'approvazione dell'admin
      await base44.entities.CourseRegistrationRequest.create({
        full_name:        data.full_name,
        email:            data.email.toLowerCase().trim(),
        phone:            data.phone || null,
        club:             data.club  || null,
        years_experience: data.years_experience ? parseInt(data.years_experience) : null,
        motivation:       data.motivation || null,
        status:           'in_attesa',
      });
    },
    onSuccess,
    onError: (err) => {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('già')) {
        setErrors({ email: 'Questa email è già registrata. Prova ad accedere.' });
      } else {
        toast.error(msg || 'Errore durante la registrazione. Riprova.');
      }
    },
  });

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    registerMutation.mutate(form);
  };

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <Field label="Nome e Cognome *" error={errors.full_name}>
        <Input value={form.full_name} onChange={f('full_name')} placeholder="Mario Rossi" autoComplete="name" style={{ fontFamily: BRAND.font }} />
      </Field>

      <Field label="Email *" error={errors.email}>
        <Input type="email" value={form.email} onChange={f('email')} placeholder="mario.rossi@esempio.com" autoComplete="email" style={{ fontFamily: BRAND.font }} />
      </Field>

      <Field label="Password *" error={errors.password}>
        <PasswordInput value={form.password} onChange={f('password')} placeholder="Minimo 8 caratteri" />
        {!errors.password && form.password.length > 0 && (
          <PasswordStrength password={form.password} />
        )}
      </Field>

      <Field label="Conferma Password *" error={errors.confirm_password}>
        <PasswordInput value={form.confirm_password} onChange={f('confirm_password')} placeholder="Ripeti la password" />
      </Field>

      <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />
      <p style={{ fontFamily: BRAND.font, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999' }}>Informazioni (opzionali)</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Telefono">
          <Input value={form.phone} onChange={f('phone')} placeholder="+39 333 000 0000" type="tel" style={{ fontFamily: BRAND.font }} />
        </Field>
        <Field label="Anni di esperienza">
          <Input value={form.years_experience} onChange={f('years_experience')} placeholder="es. 5" type="number" min="0" style={{ fontFamily: BRAND.font }} />
        </Field>
      </div>

      <Field label="Club / Società">
        <Input value={form.club} onChange={f('club')} placeholder="Nome del club sportivo" style={{ fontFamily: BRAND.font }} />
      </Field>

      <Button
        type="submit"
        disabled={registerMutation.isPending}
        style={{ backgroundColor: BRAND.lime, color: BRAND.black, fontFamily: BRAND.font, fontWeight: 800, fontSize: '14px', height: '48px', borderRadius: '10px', cursor: registerMutation.isPending ? 'not-allowed' : 'pointer', opacity: registerMutation.isPending ? 0.7 : 1, marginTop: '4px' }}
      >
        {registerMutation.isPending ? '⏳ Registrazione in corso...' : '🎓 Invia richiesta di accesso'}
      </Button>

      <p style={{ fontFamily: BRAND.font, fontSize: '11px', color: '#999', textAlign: 'center', lineHeight: 1.6 }}>
        Dopo la registrazione il tuo account sarà revisionato dall'amministratore.<br />
        Riceverai una notifica all'approvazione.
      </p>
    </form>
  );
}

// ─── Password strength indicator ──────────────────────────────────────────────

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ caratteri',       ok: password.length >= 8 },
    { label: 'Lettera maiuscola',  ok: /[A-Z]/.test(password) },
    { label: 'Numero',             ok: /\d/.test(password) },
  ];
  const strength = checks.filter(c => c.ok).length;
  const colors = ['#dc2626', '#f59e0b', '#16a34a'];
  const labels = ['Debole', 'Media', 'Forte'];

  return (
    <div style={{ marginTop: '4px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: i < strength ? colors[strength - 1] : '#e5e7eb', transition: 'background-color 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {checks.map(c => (
          <span key={c.label} style={{ fontFamily: BRAND.font, fontSize: '10px', color: c.ok ? '#16a34a' : '#999', display: 'flex', alignItems: 'center', gap: '3px' }}>
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ onBackToLogin }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
      <h2 style={{ fontFamily: BRAND.font, fontWeight: 800, fontSize: '20px', color: BRAND.black, marginBottom: '10px' }}>
        Richiesta inviata!
      </h2>
      <p style={{ fontFamily: BRAND.font, fontSize: '14px', color: '#555', lineHeight: 1.7, marginBottom: '24px' }}>
        Abbiamo ricevuto la tua richiesta di accesso.<br />
        L'amministratore la esaminerà e riceverai<br />
        una notifica quando sarà approvata.
      </p>
      <Button
        onClick={onBackToLogin}
        style={{ backgroundColor: BRAND.lime, color: BRAND.black, fontFamily: BRAND.font, fontWeight: 800, fontSize: '13px', height: '44px', borderRadius: '10px', padding: '0 24px' }}
      >
        Torna al login
      </Button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CoachAuth() {
  const [tab, setTab] = useState('login');
  const [registered, setRegistered] = useState(false);

  // Se l'allenatore è già autenticato e ha accesso, reindirizza al corso
  useEffect(() => {
    base44.auth.me().then(async (user) => {
      if (!user) return;
      const accesses = await base44.entities.CoachCourseAccess.filter({
        coach_email: user.email,
        active: true,
      }).catch(() => []);
      if (accesses.length > 0) window.location.href = '/corso';
    }).catch(() => {});
  }, []);

  const handleLoginSuccess = () => {
    window.location.href = '/corso';
  };

  const handleRegisterSuccess = () => {
    setRegistered(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: BRAND.font }}>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '460px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ backgroundColor: BRAND.black, padding: '32px 36px 28px', textAlign: 'center' }}>
          <div style={{ fontFamily: BRAND.font, fontWeight: 900, fontSize: '22px', color: BRAND.lime, letterSpacing: '0.04em', marginBottom: '6px' }}>
            ⚡ TEN Training
          </div>
          <p style={{ fontFamily: BRAND.font, fontSize: '13px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Area Allenatori — Videocorso
          </p>
        </div>

        {/* Tabs */}
        {!registered && (
          <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0' }}>
            {[
              { key: 'login',    label: 'Accedi' },
              { key: 'register', label: 'Registrati' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{ flex: 1, padding: '14px', fontFamily: BRAND.font, fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', background: 'none', border: 'none', borderBottom: `3px solid ${tab === t.key ? BRAND.lime : 'transparent'}`, color: tab === t.key ? BRAND.black : '#aaa', transition: 'all 0.2s', marginBottom: '-2px' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '32px 36px 36px' }}>
          {registered ? (
            <SuccessScreen onBackToLogin={() => { setRegistered(false); setTab('login'); }} />
          ) : tab === 'login' ? (
            <>
              <p style={{ fontFamily: BRAND.font, fontSize: '14px', color: '#666', marginBottom: '24px', lineHeight: 1.5 }}>
                Bentornato! Inserisci le tue credenziali per accedere ai moduli e ai quiz.
              </p>
              <LoginForm onSuccess={handleLoginSuccess} />
              <p style={{ marginTop: '20px', textAlign: 'center', fontFamily: BRAND.font, fontSize: '12px', color: '#999' }}>
                Non hai ancora un account?{' '}
                <button onClick={() => setTab('register')} style={{ color: '#2563eb', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: BRAND.font, fontSize: '12px' }}>
                  Registrati
                </button>
              </p>
            </>
          ) : (
            <>
              <p style={{ fontFamily: BRAND.font, fontSize: '14px', color: '#666', marginBottom: '24px', lineHeight: 1.5 }}>
                Crea il tuo account per richiedere accesso al videocorso TEN Training.
              </p>
              <RegisterForm onSuccess={handleRegisterSuccess} />
              <p style={{ marginTop: '16px', textAlign: 'center', fontFamily: BRAND.font, fontSize: '12px', color: '#999' }}>
                Hai già un account?{' '}
                <button onClick={() => setTab('login')} style={{ color: '#2563eb', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: BRAND.font, fontSize: '12px' }}>
                  Accedi
                </button>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 36px', backgroundColor: '#fafafa', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
          <p style={{ fontFamily: BRAND.font, fontSize: '10px', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            © TEN Training — Tutti i diritti riservati
          </p>
        </div>
      </div>
    </div>
  );
}
