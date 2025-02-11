'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from "next-auth/react"
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/use-toast"
import { 
  User, 
  LogOut, 
  LogIn, 
  Loader2, 
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
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignIn = async () => {
    try {
      const result = await signIn('google', { 
        callbackUrl: '/', 
        redirect: false 
      })

      if (result?.error) {
        console.error('Sign-in error:', result.error)
        addToast({
          title: "Sign-in Failed",
          description: "Failed to sign in. Please try again.",
          variant: "destructive"
        })
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      console.error('Unexpected sign-in error:', error)
      addToast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign-out error:', error)
      addToast({
        title: "Sign-out Failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <nav className="relative" role="navigation" aria-label="Main navigation">
      <div className="hidden md:flex items-center justify-between w-full">
        <ul className="flex items-center space-x-4">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md transition-colors
                  hover:bg-accent hover:text-accent-foreground
                  ${pathname === item.href ? 'bg-accent text-accent-foreground' : ''}
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
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
                  {session.user?.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={handleSignIn}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign in
          </Button>
        )}
      </div>
    </nav>
  )
}