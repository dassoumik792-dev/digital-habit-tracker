/**
 * Reusable Logout Button Component
 * Can be used in multiple places for consistent logout behavior
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import { RiLogoutBoxLine } from 'react-icons/ri';
import useAuthStore from '../../store/authStore';

export default function LogoutButton({ variant = 'default', className = '', showText = true }) {
  const router = useRouter();
  const { logout, isLoading } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    // Add confirmation for default variant
    if (variant === 'default') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (!confirmed) return;
    }
    
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if there's an error
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const baseClasses = 'flex items-center gap-2 rounded-lg font-medium transition-all disabled:cursor-not-allowed';
  const variantClasses = {
    default: 'px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/30',
    compact: 'p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10',
    prominent: 'px-4 py-2 text-sm bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20',
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      title={isLoggingOut ? 'Signing out...' : 'Sign out'}
    >
      {isLoggingOut ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {showText && <span>Signing out...</span>}
        </>
      ) : (
        <>
          <RiLogoutBoxLine size={16} />
          {showText && <span>Sign Out</span>}
        </>
      )}
    </button>
  );
}
