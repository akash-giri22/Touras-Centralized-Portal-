'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const { login }   = useAuth();
  const router      = useRouter();
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [darkMode,  setDarkMode]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (role: 'admin' | 'manager' | 'employee') => {
    const creds = {
      admin:    { email: 'admin@touras.com',    password: 'admin123'    },
      manager:  { email: 'manager@touras.com',  password: 'manager123'  },
      employee: { email: 'employee@touras.com', password: 'employee123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
    setError('');
  };

  const bg      = darkMode ? '#0f0f1a' : 'white';
  const text     = darkMode ? '#f1f1f1' : '#1a1a1a';
  const subtext  = darkMode ? '#aaa'    : '#666';
  const border   = darkMode ? '#333'    : '#d1d5db';
  const inputBg  = darkMode ? '#1e1e2e' : 'white';
  const labelBg  = darkMode ? '#0f0f1a' : 'white';

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0ab812 0%, #0ab812 0%, #0895a8 100%)' }}>

        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                              radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />

        {/* Logo with white box */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-2 rounded-xl" style={{ background: 'white' }}>
              <img src="/images/Touras12334.png" alt="Touras Logo"
                className="h-10 w-auto object-contain"
                onError={e => { (e.target as any).style.display = 'none'; }} />
            </div>
            
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight" style={{ color: 'white' }}>
            Experience right<br />
            business operations<br />
            with Touras
          </h1>
          <p className="text-lg" style={{ color: 'rgb(255, 255, 255)' }}>
            Reliable access, resilient performance,<br />
            beyond your current enterprise portal.
          </p>
          <p className="text-base" style={{ color: 'rgb(255, 255, 255)' }}>
            Get the right, super efficient &amp; insightful<br />
            platform at one destination
          </p>

          <ul className="space-y-3">
            {[
              'Manage all portals from one place',
              'Role-based access control',
              'Jira & AWS cloud integration',
              'Real-time audit logs',
              '24x7 Enterprise Support',
            ].map(item => (
              <li key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.84)' }}>
            © 2026 Touras Tech Global Private Limited
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 relative transition-all duration-300"
        style={{ background: bg, minHeight: '100vh' }}>

        {/* Dark/Light toggle */}
        <button onClick={() => setDarkMode(!darkMode)}
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{ background: darkMode ? '#2a2a3e' : '#f3f4f6', color: darkMode ? '#fbbf24' : '#555' }}>
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="px-2 py-1 rounded-lg" style={{ background: darkMode ? 'white' : '#0ab812' }}>
              <img src="/images/Touras12334.png" alt="Touras"
                className="h-7 w-auto object-contain"
                onError={e => {
                  (e.target as any).style.display = 'none';
                  (e.target as any).parentElement.innerHTML = '<span style="color:white;font-weight:900">T</span>';
                }} />
            </div>
            <span className="text-2xl font-black" style={{ color: text }}>
              tour<span style={{ color: '#0ab812' }}>as</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: text }}>
            Login to Touras Tech Global
          </h2>
          <p className="text-base font-semibold mb-8" style={{ color: text }}>
            Private Limited
          </p>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div className="relative mt-2">
              <label className="absolute -top-2.5 left-3 px-1 text-xs font-medium"
                style={{ color: subtext, background: labelBg }}>
                Mobile Number/Email ID/User ID
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 text-sm rounded-lg outline-none transition-all"
                style={{
                  border:     `1.5px solid ${error ? '#0ab812' : border}`,
                  color:      text,
                  background: inputBg,
                }}
                onFocus={e => e.target.style.borderColor = '#0ab812'}
                onBlur={e  => e.target.style.borderColor = error ? '#0ab812' : border}
              />
            </div>

            {/* Password */}
            <div className="relative mt-2">
              <label className="absolute -top-2.5 left-3 px-1 text-xs font-medium"
                style={{ color: subtext, background: labelBg }}>
                Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 pr-12 text-sm rounded-lg outline-none transition-all"
                style={{
                  border:     `1.5px solid ${error ? '#ffffff' : border}`,
                  color:      text,
                  background: inputBg,
                }}
                onFocus={e => e.target.style.borderColor = '#faf5f5'}
                onBlur={e  => e.target.style.borderColor = error ? '#fdfdfd' : border}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: subtext }}>
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Forgot password */}
            <div className="text-right -mt-1">
              <button type="button" className="text-sm" style={{ color: subtext }}>
                Forgot Password?
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-center px-3 py-2 rounded-lg"
                style={{ color: '#0ab812', background: '#fff5f5', border: '1px solid #cdf4fe' }}>
                {error}
              </p>
            )}

            {/* Login button */}
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-lg text-base font-bold text-white transition-all disabled:opacity-70"
              style={{ background: loading ? '#999' : '#0996ed' }}>
              {loading ? 'Logging in...' : 'LOG IN'}
            </button>

            {/* Need help */}
            <p className="text-center text-sm" style={{ color: subtext }}>
              Need help?{' '}
              <button type="button" className="font-semibold" style={{ color: text }}>
                Contact Us
              </button>
            </p>
          </form>

         
          {/* Quick login buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { role: 'admin'    as const, label: 'Admin'    },
              { role: 'manager'  as const, label: 'Manager'  },
              { role: 'employee' as const, label: 'Employee' },
            ].map(btn => (
              <button key={btn.role} type="button"
                onClick={() => quickFill(btn.role)}
                className="py-2.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: '#0996ed' }}>
                {btn.label}
              </button>
            ))}
          </div>

          
        </div>
      </div>
    </div>
  );
}