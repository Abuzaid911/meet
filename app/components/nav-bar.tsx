"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { 
  Home, 
  Calendar, 
  User, 
  Menu, 
  X, 
  LogIn, 
  LogOut,
  PlusCircle
} from "lucide-react"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { NotificationBell } from "./notification-bell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

// Nav item with icon, text, and active state
interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick?: () => void
}

function NavItem({ href, icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

export function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [profile, setProfile] = useState<{ image: string | null } | null>(null)

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/user')
          if (response.ok) {
            const data = await response.json()
            setProfile(data)
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
        }
      }
    }

    fetchProfile()
  }, [session?.user])
  
  // Track scroll position for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Direct sign out function - no longer using AuthButton
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  }

  // Desktop navigation items
  const navItems = [
    { href: "/", icon: <Home className="h-4 w-4" />, label: "Home" },
    { href: "/events", icon: <Calendar className="h-4 w-4" />, label: "Events" },
    { href: "/profile", icon: <User className="h-4 w-4" />, label: "Profile" },
  ]

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 ${
      isScrolled 
        ? "bg-background/95 backdrop-blur-sm border-b shadow-sm" 
        : "bg-background border-b"
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent"
          >
            <Calendar className="h-6 w-6 text-teal-500" />
            OMW
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
              />
            ))}
          </div>

          {/* Actions: Notifications, Create Event, Profile */}
          <div className="flex items-center gap-2">
            {/* Create Event Button (desktop only) */}
            {session && (
              <Button 
                asChild
                variant="default" 
                size="sm"
                className="hidden md:flex bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
              >
                <Link href="/events/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Event
                </Link>
              </Button>
            )}
            
            {/* Notifications */}
            {session && <NotificationBell />}
            
            {/* Auth Status / Profile */}
            {status === 'loading' ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.image || session.user?.image || undefined} alt={session.user?.name || 'User'} />
                      <AvatarFallback>
                        {session.user?.name?.[0] || session.user?.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/events">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>My Events</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link href="/auth/signin">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
            
            {/* Mobile menu button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  aria-label="Toggle Menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] max-w-[300px]">
                <div className="flex flex-col gap-6 pt-6">
                  <div className="flex items-center justify-between">
                    <Link 
                      href="/" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 font-bold text-xl"
                    >
                      <Calendar className="h-6 w-6 text-teal-500" />
                      <span className="bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">
                        OMW
                      </span>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <nav className="flex flex-col gap-1">
                    {navItems.map((item) => (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        isActive={pathname === item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                      />
                    ))}
                    
                    {/* Mobile-only Create Event Button */}
                    {session && (
                      <div className="mt-4">
                        <Button 
                          asChild
                          className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                        >
                          <Link href="/events/new" onClick={() => setIsMobileMenuOpen(false)}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create New Event
                          </Link>
                        </Button>
                      </div>
                    )}
                  </nav>
                  
                  {/* Mobile Auth Status */}
                  <div className="mt-auto border-t pt-4">
                    {session ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile?.image || session.user?.image || undefined} alt={session.user?.name || 'User'} />
                            <AvatarFallback>
                              {session.user?.name?.[0] || session.user?.email?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-medium">{session.user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {session.user?.email}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full flex items-center justify-center group transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950 dark:hover:text-red-400"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleSignOut();
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                          Sign out
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        asChild 
                        variant="default" 
                        className="w-full"
                      >
                        <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}