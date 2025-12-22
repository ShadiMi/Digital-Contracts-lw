'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface UserProfile {
  username: string;
  full_name: string | null;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('token');
      const authenticated = !!token;
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        try {
          // Fetch user profile
          const userResponse = await api.get('/api/users/profile');
          setUser(userResponse.data);
          
          // Fetch notification count
          const notifResponse = await api.get('/api/notifications/count');
          setNotificationCount(notifResponse.data.count);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setNotificationCount(0);
      }
    };
    
    checkAuth();
    // Check auth status when pathname changes or periodically
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleLogout = () => {
    Cookies.remove('token');
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center px-4 text-xl font-semibold text-primary-600 hover:text-primary-700">
              Digital Contracts
            </Link>
            <div className="flex space-x-1 ml-4">
              {isAuthenticated && (
                <>
                  <Link
                    href="/"
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      pathname === '/' 
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    href="/contracts"
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      pathname?.startsWith('/contracts') 
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    My Contracts
                  </Link>
                </>
              )}
              <Link
                href="/about"
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname === '/about' 
                    ? 'text-primary-600 bg-primary-50' 
                    : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                About Us
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notification Icon */}
                <Link
                  href="/notifications"
                  className="relative inline-flex items-center p-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                  title="Notifications"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Link>

                {/* Profile Icon */}
                <Link
                  href="/profile"
                  className="inline-flex items-center p-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                  title="Profile"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>

                {/* Username */}
                <span className="text-sm font-medium text-gray-700">
                  {user?.full_name || user?.username}
                </span>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

