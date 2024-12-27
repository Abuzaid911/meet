'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/use-toast"
import { 
  User, 
  LogOut, 
  LogIn, 
  Loader2, 
  Menu, 
  X,
  Home,
  Calendar,
  UserCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
  { href: '/calendar', label: 'Calendar', icon: <Calendar className="h-4 w-4" /> },
  { href: '/profile', label: 'Profile', icon: <UserCircle className="h-4 w-4" /> },
]

export function NavBar() {
  const { data: session, status } = useSession()
  const { addToast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleSignIn = async () => {
    try {
      const result = await signIn('google', { 
        callbackUrl: '/', 
        redirect: false 
      })

      if (result?.error) {
        console.error('Sign-in error:', result.error)
        addToast('Failed to sign in. Please try again.', 'error')
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      console.error('Unexpected sign-in error:', error)
      addToast('An unexpected error occurred. Please try again.', 'error')
    }
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign-out error:', error)
      addToast('Failed to sign out. Please try again.', 'error')
    } finally {
      setIsSigningOut(false)
    }
  }

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md transition-colors
              hover:bg-accent hover:text-accent-foreground
              ${pathname === item.href ? 'bg-accent text-accent-foreground' : ''}
            `}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        </li>
      ))}
    </>
  )

  return (
    <nav className="relative" role="navigation" aria-label="Main navigation">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between w-full">
        <ul className="flex items-center space-x-4">
          <NavLinks />
        </ul>

        {status === "loading" ? (
          <Button variant="ghost" disabled>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2">Loading...</span>
          </Button>
        ) : session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={session.user?.image || undefined} 
                    alt={session.user?.name || 'User avatar'} 
                  />
                  <AvatarFallback>
                    {session.user?.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[150px] truncate">
                  {session.user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-destructive focus:text-destructive"
              >
                {isSigningOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            variant="default" 
            onClick={handleSignIn}
            className="flex items-center"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign in
          </Button>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center justify-between w-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>

        {status === "authenticated" && (
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={session.user?.image || undefined} 
              alt={session.user?.name || 'User avatar'} 
            />
            <AvatarFallback>
              {session.user?.name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="absolute top-full left-0 right-0 bg-background border-b z-50 md:hidden"
        >
          <ul className="p-4 space-y-2">
            <NavLinks />
            <li className="pt-2 border-t">
              {status === "loading" ? (
                <Button variant="ghost" disabled className="w-full justify-start">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </Button>
              ) : session ? (
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  {isSigningOut ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Sign out
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={handleSignIn}
                  className="w-full justify-start"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in
                </Button>
              )}
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}