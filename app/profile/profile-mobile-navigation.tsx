'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  Users, 
  Settings,
  ChevronsUp,
  Home
} from 'lucide-react';
import { Button } from '../components/ui/button';
import Link from 'next/link';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProfileMobileNavigation({ activeTab, onTabChange }: MobileNavProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide navigation when scrolling down, show when scrolling up
      // Added a threshold to prevent flickering and a minimum scroll position
      if (currentScrollY > lastScrollY && currentScrollY > 100 && Math.abs(currentScrollY - lastScrollY) > 10) {
        setIsVisible(false);
        // Close expanded menu when hiding navigation
        if (isExpanded) {
          setIsExpanded(false);
        }
      } else if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    // Throttle the scroll event to improve performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [lastScrollY, isExpanded]);

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setIsExpanded(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const navItems = [
    { id: 'overview', icon: <User className="h-5 w-5" />, label: 'Overview' },
    { id: 'events', icon: <Calendar className="h-5 w-5" />, label: 'Events' },
    { id: 'friends', icon: <Users className="h-5 w-5" />, label: 'Friends' },
    { id: 'settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
  ];
  
  // Handle navigation to home
  const handleHomeClick = () => {
    // Close the expanded menu if open
    if (isExpanded) {
      setIsExpanded(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          role="navigation"
          aria-label="Mobile profile navigation"
        >
          <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg rounded-t-xl">
            {isExpanded && (
              <motion.div
                id="mobile-nav-expanded-menu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="p-2 grid grid-cols-4 gap-1"
                role="tablist"
                aria-label="Profile navigation"
              >
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    className={`flex-col h-16 rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-gray-100 dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
                    onClick={() => handleTabClick(item.id)}
                    aria-label={`${item.label} tab`}
                    aria-selected={activeTab === item.id}
                    aria-controls={`${item.id}-panel`}
                    role="tab"
                  >
                    <div className="h-5 w-5 mb-1">{item.icon}</div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Button>
                ))}
              </motion.div>
            )}
            
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none h-14 w-14 relative focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
                onClick={toggleExpand}
                aria-expanded={isExpanded}
                aria-controls="mobile-nav-expanded-menu"
                aria-label={isExpanded ? 'Close expanded menu' : 'Open menu'}
              >
                <ChevronsUp 
                  className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                />
                <span className="absolute -bottom-1 text-[10px] font-medium text-gray-500">
                  {isExpanded ? 'Close' : 'Menu'}
                </span>
              </Button>
              
              <Link href="/" passHref>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none h-14 w-14 relative focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  onClick={handleHomeClick}
                  aria-label="Go to home page"
                >
                  <Home className="h-5 w-5" />
                  <span className="absolute -bottom-1 text-[10px] font-medium text-gray-500">
                    Home
                  </span>
                </Button>
              </Link>
              
              <div className="grid grid-cols-4 flex-1">
                {navItems.slice(0, 4).map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    className={`flex-col h-14 rounded-none transition-all duration-200 ${
                      activeTab === item.id
                        ? 'text-teal-600 dark:text-teal-400 border-t-2 border-teal-500 bg-gray-50 dark:bg-gray-800/50 font-semibold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
                    onClick={() => handleTabClick(item.id)}
                    aria-label={`${item.label} tab`}
                    aria-selected={activeTab === item.id}
                    aria-controls={`${item.id}-panel`}
                    role="tab"
                  >
                    <div className="h-5 w-5 mb-1">{item.icon}</div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}