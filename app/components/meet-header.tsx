"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Bell, Menu } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { Badge } from "../components/ui/badge"
import { useMediaQuery } from "@/lib/hooks/use-media-query"
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet"

interface MeetHeaderProps {
  hasNotifications?: boolean
}

export function MeetHeader({ hasNotifications = false }: MeetHeaderProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAuthenticated = status === 'authenticated'
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isScrolled, setIsScrolled] = useState(false)
  
  const { scrollY } = useScroll()
  const backdropBlur = useTransform(scrollY, [0, 50], [0, 6])
  
  // Get initials from name
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?"
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }
  
  // Listen for scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const handleSignOut = async () => {
    router.push('/auth/signout')
  }
  
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 py-3 px-4 sm:px-6 transition-all"
      style={{
        backdropFilter: `blur(${backdropBlur}px)`,
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
        boxShadow: isScrolled ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
      }}
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <motion.div
            className="bg-gradient-to-r from-primary to-blue-600 rounded-lg w-8 h-8 flex items-center justify-center text-white font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            M
          </motion.div>
          <span className="font-bold text-lg hidden sm:inline-block">MeetOn</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {isMobile ? (
                <MobileMenu 
                  user={session?.user} 
                  hasNotifications={hasNotifications} 
                  onSignOut={handleSignOut}
                />
              ) : (
                <>
                  <nav className="hidden md:flex items-center space-x-6">
                    <Link 
                      href="/events" 
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      Events
                    </Link>
                    <Link 
                      href="/friends" 
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      Friends
                    </Link>
                    <Link 
                      href="/profile" 
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      Profile
                    </Link>
                  </nav>
                  
                  <Link href="/notifications">
                    <div className="relative">
                      <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                      {hasNotifications && (
                        <Badge 
                          className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-red-500" 
                          variant="destructive"
                        />
                      )}
                    </div>
                  </Link>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                          <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium">{session?.user?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            @{session?.user?.username || session?.user?.name?.split(' ')[0].toLowerCase()}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/profile')}>
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/profile/settings')}>
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm" className="hover:text-primary transition-colors">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="default" size="sm">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}

// Mobile menu component
function MobileMenu({ user, hasNotifications, onSignOut }: { 
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
  } | null | undefined;
  hasNotifications: boolean; 
  onSignOut: () => void;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-6">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
              <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">
                @{user?.username || (user?.name ? user.name.split(' ')[0].toLowerCase() : 'user')}
              </p>
            </div>
          </div>
          
          <nav className="flex flex-col space-y-4">
            <Link 
              href="/" 
              className="text-sm font-medium hover:text-primary transition-colors py-2"
            >
              Home
            </Link>
            <Link 
              href="/events" 
              className="text-sm font-medium hover:text-primary transition-colors py-2"
            >
              Events
            </Link>
            <Link 
              href="/friends" 
              className="text-sm font-medium hover:text-primary transition-colors py-2"
            >
              Friends
            </Link>
            <Link 
              href="/profile" 
              className="text-sm font-medium hover:text-primary transition-colors py-2"
            >
              Profile
            </Link>
            <Link 
              href="/notifications" 
              className="text-sm font-medium hover:text-primary transition-colors py-2 flex items-center"
            >
              Notifications
              {hasNotifications && (
                <Badge 
                  className="ml-2 h-2 w-2 p-0 bg-red-500" 
                  variant="destructive"
                />
              )}
            </Link>
          </nav>
          
          <div className="mt-auto">
            <Button className="w-full" variant="default" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 