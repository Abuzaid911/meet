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
  PlusCircle,
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
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
        ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  }

  const navItems = [
    { href: "/", icon: <Home className="h-4 w-4" />, label: "Home" },
    { href: "/events", icon: <Calendar className="h-4 w-4" />, label: "Events" },
    { href: "/profile", icon: <User className="h-4 w-4" />, label: "Profile" },
  ]

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 ${
      isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-border/40" : "bg-white border-b"
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-blue-600 to-gray-600 bg-clip-text text-transparent"
          >
            <Calendar className="h-6 w-6 text-blue-500" />
            MeetOn
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {navItems.map(item => (
              <NavItem key={item.href} {...item} isActive={pathname === item.href} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {session && <NotificationBell />}

            {status === 'loading' ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.image || session.user?.image || undefined} alt={session.user?.name || 'User'} />
                      <AvatarFallback>{session.user?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <div className="text-sm font-medium">{session.user?.name}</div>
                    <div className="text-xs text-muted-foreground">{session.user?.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/events">My Events</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link href="/auth/signin">
                  <LogIn className="h-4 w-4 mr-1" /> Sign In
                </Link>
              </Button>
            )}

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex justify-between items-center mb-4">
                  <Link href="/" className="font-bold text-lg">MeetOn</Link>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex flex-col gap-3">
                  {navItems.map(item => (
                    <NavItem
                      key={item.href}
                      {...item}
                      isActive={pathname === item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  ))}
                  {session && (
                    <Button
                      asChild
                      className="mt-4 w-full bg-gradient-to-r from-blue-500 to-gray-600 hover:from-gray-700 hover:to-blue-700"
                    >
                      <Link href="/events/new" onClick={() => setIsMobileMenuOpen(false)}>
                        <PlusCircle className="h-4 w-4 mr-2" /> Create Event
                      </Link>
                    </Button>
                  )}
                  <div className="border-t pt-4 mt-4">
                    {session ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          handleSignOut()
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Sign out
                      </Button>
                    ) : (
                      <Button asChild className="w-full">
                        <Link href="/auth/signin">
                          <LogIn className="h-4 w-4 mr-2" /> Sign In
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
    