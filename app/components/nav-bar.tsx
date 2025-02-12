'use client'

import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { FaBars, FaTimes, FaSignOutAlt, FaPen } from "react-icons/fa"
import { FiChevronDown } from "react-icons/fi"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/new", label: "New Post" },
  { href: "/about", label: "About" }
]

const menuVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  closed: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 }
  }
}

export function NavBar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav
      className={`w-full fixed top-0 left-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200" 
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex justify-between items-center py-4 px-6 relative">
        {/* Logo with hover effect */}
        <Link 
          href="/" 
          className="text-3xl font-bold tracking-wide group"
        >
          <span className="text-5xl font-mono bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent pb-2">
            OMW
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative group text-gray-700 hover:text-teal-400 transition-colors"
            >
              {item.label}
              {pathname === item.href && (
                <motion.span
                  className="absolute left-0 -bottom-1 w-full h-0.5 bg-teal-400"
                  layoutId="activeNav"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Authentication Section */}
        <div className="flex items-center gap-4">
          {status === "loading" && (
            <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
          )}

          {status === "unauthenticated" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => signIn("google")}
              className="hidden md:flex items-center px-4 py-2 bg-gradient-to-r from-teal-400 to-teal-500 text-white rounded-full shadow-lg hover:shadow-teal-200 transition-all"
            >
              <FaPen className="mr-2" />
              Get Started
            </motion.button>
          )}

          {status === "authenticated" && (
            <motion.div className="relative" whileHover={{ scale: 1.05 }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2"
              >
                <img
                  src={session.user?.image || ''}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-teal-400 object-cover"
                />
                <FiChevronDown className={`text-gray-600 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial="closed"
                    animate="open"
                    exit="closed"
                    variants={menuVariants}
                    className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-medium text-gray-800 truncate">{session.user?.name}</p>
                      <p className="text-sm text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full p-3 flex items-center text-red-500 hover:bg-gray-50 transition-colors"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            ref={mobileMenuRef}
            className="md:hidden absolute w-full bg-white shadow-xl border-t border-gray-100"
          >
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block p-3 rounded-lg transition-colors ${
                    pathname === item.href 
                      ? 'bg-teal-50 text-teal-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {status === "unauthenticated" && (
                <button
                  onClick={() => signIn("google")}
                  className="w-full p-3 text-left rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                >
                  Get Started
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}