import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar } from 'lucide-react';

export default function Login() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '24px' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '48px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', marginBottom: '24px' }}>
          <Calendar size={48} color="var(--primary)" />
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>timeMatch</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          여러 명의 일정을 직관적으로 맞추세요.
        </p>
        
        <button onClick={handleGoogleLogin} className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" style={{ width: '20px' }} />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
