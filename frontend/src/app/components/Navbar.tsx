import { Button } from './Button';

interface NavbarProps {
  userName?: string;
  onLogout?: () => void;
  onNavigate?: (page: 'dashboard' | 'profile' | 'roadmap') => void;
}

export function Navbar({ userName, onLogout, onNavigate }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-semibold text-[#2563EB] cursor-pointer" onClick={() => onNavigate?.('dashboard')}>
            Pragyan
          </h1>
          {userName && (
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => onNavigate?.('dashboard')} className="text-[#0F172A] hover:text-[#2563EB] transition-colors">
                Dashboard
              </button>
              <button onClick={() => onNavigate?.('profile')} className="text-[#0F172A] hover:text-[#2563EB] transition-colors">
                Profile
              </button>
              <button onClick={() => onNavigate?.('roadmap')} className="text-[#0F172A] hover:text-[#2563EB] transition-colors">
                Roadmap
              </button>
            </div>
          )}
        </div>
        {userName ? (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center">
              <span className="text-[#2563EB]">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Login
            </Button>
            <Button variant="primary" size="sm">
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
