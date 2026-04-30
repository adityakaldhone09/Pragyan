import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { Icons } from '../components/Icons';

interface LanguageSelectorProps {
  onContinue: (language: string) => void;
}

export function LanguageSelector({ onContinue }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const languages = [
    { id: 'english', name: 'English', flag: '🇺🇸', native: 'English' },
    { id: 'hindi', name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
    { id: 'spanish', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
    { id: 'french', name: 'French', flag: '🇫🇷', native: 'Français' },
    { id: 'german', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
    { id: 'chinese', name: 'Chinese', flag: '🇨🇳', native: '中文' },
    { id: 'japanese', name: 'Japanese', flag: '🇯🇵', native: '日本語' },
    { id: 'arabic', name: 'Arabic', flag: '🇸🇦', native: 'العربية' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-4xl">🌍</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Language
          </h1>
          <p className="text-xl text-gray-400">
            Select your preferred language for the best experience
          </p>
        </div>

        <GlassCard strong className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguage(lang.id)}
                className={`p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                  selectedLanguage === lang.id
                    ? 'gradient-primary shadow-lg shadow-indigo-500/50'
                    : 'glass hover:glass-strong'
                }`}
              >
                <div className="text-4xl mb-3">{lang.flag}</div>
                <div className={`font-semibold mb-1 ${
                  selectedLanguage === lang.id ? 'text-white' : 'text-gray-300'
                }`}>
                  {lang.name}
                </div>
                <div className={`text-sm ${
                  selectedLanguage === lang.id ? 'text-indigo-200' : 'text-gray-500'
                }`}>
                  {lang.native}
                </div>
              </button>
            ))}
          </div>

          <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3">
            <Icons.Sparkles />
            <p className="text-sm text-gray-400">
              Don't worry! You can change your language anytime from settings
            </p>
          </div>

          <GlassButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => onContinue(selectedLanguage)}
          >
            Continue to Assessment →
          </GlassButton>
        </GlassCard>
      </div>
    </div>
  );
}
