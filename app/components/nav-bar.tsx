'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';

const navItems = [{ href: '/', label: 'Home' }, { href: '/events', label: 'Events' }];

const menuVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
  closed: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

export function NavBar() {
  const { status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav
      className={`w-full fixed top-0 left-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200 dark:bg-gray-900/95 dark:border-gray-800'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto flex justify-between items-center py-4 px-6 relative">
        <Link href="/" className="text-3xl font-bold tracking-wide group">
          <span className="text-5xl font-mono bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent pb-2 hover:from-blue-500 hover:to-teal-400 transition-all duration-300">
            OMW
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative group text-gray-700 dark:text-gray-300 hover:text-teal-400 transition-colors"
            >
              {item.label}
              {pathname === item.href && (
                <motion.span
                  className="absolute left-0 -bottom-1 w-full h-0.5 bg-teal-400"
                  layoutId="activeNav"
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                />
              )}
            </Link>
          ))}
          {status === 'authenticated' && (
            <Link
              href="/profile"
              className="relative group text-gray-700 dark:text-gray-300 hover:text-teal-400 transition-colors"
            >
              Profile
              {pathname === '/profile' && (
                <motion.span
                  className="absolute left-0 -bottom-1 w-full h-0.5 bg-teal-400"
                  layoutId="activeNav"
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                />
              )}
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {status === 'authenticated' ? (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <FaSignOutAlt className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => signIn()}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Sign In
            </button>
          )}
        </div>

        <button
          className="md:hidden text-gray-700 dark:text-gray-300 hover:text-teal-400 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              ref={mobileMenuRef}
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuVariants}
              className="absolute top-full right-0 w-64 mt-2 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {status === 'authenticated' && (
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
              )}
              <div className="border-t border-gray-200 dark:border-gray-800 mt-2 pt-2">
                {status === 'authenticated' ? (
                  <button
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-rose-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      signIn();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-teal-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}