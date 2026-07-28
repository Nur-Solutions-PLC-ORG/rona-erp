'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, apiGet } from '@/lib/api';
import { API_AUTH_SIGN_IN_URL, API_AUTH_GOOGLE_URL, CLIENT_DASHBOARD_PAGE } from '@rona/routes/auth';
import { OPT_RESEND_DELAY_DURATION_MS } from '@rona/config/auth';
import { SignInResponseData } from '@rona/types/auth';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [tfaRequired, setTfaRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const router = useRouter();

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = { email, password };
      if (tfaRequired) payload.code = code;

      const res = await apiPost<SignInResponseData>(API_AUTH_SIGN_IN_URL, payload);

      if (res.success) {
        if (res.data?.tfaEnabled && !tfaRequired) {
          setTfaRequired(true);
          setTimeLeft(OPT_RESEND_DELAY_DURATION_MS);
        } else {
          router.push(CLIENT_DASHBOARD_PAGE);
        }
      } else {
        setError(res.message || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    setError('');
    try {
      const res = await apiPost<SignInResponseData>(API_AUTH_SIGN_IN_URL, { email, password });
      if (res.success) {
        setTimeLeft(OPT_RESEND_DELAY_DURATION_MS);
      } else {
        setError(res.message || 'Failed to resend code');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const res = await apiGet<string>(API_AUTH_GOOGLE_URL);
      if (res.success && res.data) {
        window.location.href = res.data;
      } else {
        setError(res.message || 'Google Auth URL failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 opacity-70"></div>
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply"></div>
      <div className="absolute top-[80%] -right-[10%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-[120px] mix-blend-multiply"></div>
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="rounded-2xl border border-border/50 bg-card/60 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300">
          <div className="mb-8 text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your Rona ERP account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!tfaRequired ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground ml-1 block" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground ml-1 block" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1 animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="text-sm font-medium text-foreground ml-1 block" htmlFor="code">Verification Code</label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-center text-2xl tracking-[0.5em] text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/50 uppercase"
                  placeholder="------"
                />
                <div className="flex justify-between items-center mt-2 px-1">
                  <span className="text-xs text-muted-foreground">Sent to {email}</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={timeLeft > 0}
                    className="text-xs font-medium text-primary hover:text-primary/80 disabled:text-muted-foreground transition-colors"
                  >
                    {timeLeft > 0 ? \`Resend in \${timeLeft}s\` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in zoom-in-95 duration-300 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center overflow-hidden rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>}
                {tfaRequired ? 'Verify & Sign In' : 'Sign In'}
              </span>
              <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            </button>
          </form>

          {!tfaRequired && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card/60 px-4 text-muted-foreground backdrop-blur-xl">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm font-medium text-foreground shadow-sm backdrop-blur-xl transition-all duration-300 hover:bg-muted/50 hover:border-border hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background active:scale-[0.98]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
