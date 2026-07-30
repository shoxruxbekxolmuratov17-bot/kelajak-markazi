import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, User, Lock } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { Logo } from '../components/Logo';
import { useStore } from '../store/useStore';
import { getLocale, setLocale, t, type Locale } from '../i18n';

export function LoginPage() {
  const { loginWithCredentials, loginParentWithPhone } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const rawFrom = (location.state as { from?: string })?.from;
  const from = rawFrom && rawFrom !== '/login' ? rawFrom : '/';

  const [mode, setMode] = useState<'staff' | 'parent'>('staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState('');
  const [locale, setLocaleState] = useState<Locale>(() => getLocale());

  const switchLocale = (l: Locale) => {
    setLocale(l);
    setLocaleState(l);
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingHint(/onrender\.com/i.test((await import('../api/client')).getApiUrl())
      ? "Server uyg'onmoqda (Render — 1 daqiqagacha)..."
      : '');

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    const apiError = await loginWithCredentials(trimmedUsername, trimmedPassword);
    setLoadingHint('');
    setLoading(false);
    if (!apiError) {
      navigate(from, { replace: true });
      return;
    }
    setError(apiError || "Login yoki parol noto'g'ri");
  };

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingHint(/onrender\.com/i.test((await import('../api/client')).getApiUrl())
      ? "Server uyg'onmoqda (Render — 1 daqiqagacha)..."
      : '');

    const apiError = await loginParentWithPhone(phone, pin);
    setLoadingHint('');
    setLoading(false);
    if (!apiError) {
      navigate('/ota-ona', { replace: true });
      return;
    }
    setError(apiError || "Telefon yoki PIN noto'g'ri");
  };

  return (
    <div className="min-h-screen bg-surface flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 text-white max-w-md">
          <Logo size="xl" variant="white" className="mb-8" />
          <p className="text-white/70 mt-6 leading-relaxed">
            Qamashi tumani bolalar va yoshlar uchun zamonaviy qo'shimcha ta'lim markazi.
            Robototexnika, dasturlash, sport, san'at va boshqa yo'nalishlar.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { val: '79', label: "To'garaklar" },
              { val: '1410', label: "O'quvchilar" },
              { val: '6-18', label: 'Yosh' },
            ].map((s) => (
              <div key={s.label} className="text-center p-4 rounded-2xl bg-white/10">
                <p className="text-2xl font-bold">{s.val}</p>
                <p className="text-xs text-white/70 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden text-center mb-8">
            <Logo size="md" className="justify-center" />
          </div>

          <Card className="!p-8">
            <div className="flex justify-end gap-1 mb-2" aria-label="Til">
              {(['uz', 'ru'] as Locale[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => switchLocale(l)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    locale === l ? 'bg-primary text-white' : 'text-muted hover:bg-surface'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <h2 className="text-xl font-bold text-dark text-center">{t('login')}</h2>
            <p className="text-sm text-muted text-center mt-1 mb-6">Xodimlar va ota-onalar uchun</p>

            <div className="flex rounded-xl bg-surface p-1 mb-6">
              <button
                type="button"
                onClick={() => { setMode('staff'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'staff' ? 'bg-card text-dark shadow-sm' : 'text-muted'
                }`}
              >
                {t('staffTab')}
              </button>
              <button
                type="button"
                onClick={() => { setMode('parent'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'parent' ? 'bg-card text-dark shadow-sm' : 'text-muted'
                }`}
              >
                {t('parentTab')}
              </button>
            </div>

            {mode === 'staff' ? (
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted z-10" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Login"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted z-10" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Parol"
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-card text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-dark"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loadingHint && <p className="text-sm text-primary text-center">{loadingHint}</p>}
                {error && <p className="text-sm text-danger text-center">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  <LogIn className="w-4 h-4" />
                  {loading ? (loadingHint || 'Kirish...') : 'Kirish'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleParentLogin} className="space-y-4">
                <Input label={t('phone')} value={phone} onChange={setPhone} placeholder="+998 90 123 45 67" required />
                <Input label={t('pin')} value={pin} onChange={setPin} placeholder="4 raqamli PIN" type="password" required />
                {loadingHint && <p className="text-sm text-primary text-center">{loadingHint}</p>}
                {error && <p className="text-sm text-danger text-center">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  <LogIn className="w-4 h-4" />
                  {loading ? (loadingHint || 'Kirish...') : 'Kirish'}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-border text-center space-y-2">
              <Link to="/royxat" className="text-sm text-primary hover:underline block">
                {t('enroll')} →
              </Link>
              <Link to="/maxfiylik" className="text-xs text-muted hover:underline">
                Maxfiylik siyosati
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
