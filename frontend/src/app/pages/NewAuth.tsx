import { useState } from 'react';
import { GlassButton } from '../components/GlassButton';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';
import { Icons } from '../components/Icons';

interface NewAuthProps {
  mode: 'login' | 'register';
  onLogin: (email: string) => void;
  onRegister: (name: string, email: string) => void;
  onToggleMode: () => void;
  onBack: () => void;
}

export function NewAuth({ mode, onLogin, onRegister, onToggleMode, onBack }: NewAuthProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      onLogin(email);
    } else {
      onRegister(name, email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="mb-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icons.Brain />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Get Started'}
          </h1>
          <p className="text-gray-400">
            {mode === 'login'
              ? 'Sign in to continue your journey'
              : 'Create your account to discover your career path'}
          </p>
        </div>

        <GlassCard strong className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <GlassInput
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<Icons.User />}
                required
              />
            )}
            <GlassInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              required
            />
            <GlassInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              required
            />

            {mode === 'login' && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>
                <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <GlassButton type="submit" variant="primary" className="w-full" size="lg">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </GlassButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button onClick={onToggleMode} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </GlassCard>

        {mode === 'register' && (
          <div className="mt-6 glass rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">
              By creating an account, you agree to our Terms and Privacy Policy
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
