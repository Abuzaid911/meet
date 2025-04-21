'use client'

import Link from "next/link"
import { createAuthClient } from "better-auth/react"
import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"
import { Bell, Menu } from "lucide-react"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Badge } from "../components/ui/badge"
import { useMediaQuery } from "@/lib/hooks/use-media-query"
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet"
import { Button } from "../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"

const { useSession } = createAuthClient()

interface MeetHeaderProps {
  hasNotifications?: boolean
}

export function MeetHeader({ hasNotifications = false }: MeetHeaderProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isScrolled, setIsScrolled] = useState(false)
  
  const { scrollY } = useScroll()
  const backdropBlur = useTransform(scrollY, [0, 50], [0, 6])
  
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Helper function to safely get username
  const getUsername = (): string => {
    if (!session?.user) return '';
    
    // Check if username exists using type from better-auth.d.ts
    const userWithUsername = session.user as { username?: string | null };
    if (userWithUsername.username) return userWithUsername.username;
    
    // Fallback to first part of name
    return session.user.name?.split(' ')[0].toLowerCase() || '';
  };
  
  // Listen for scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = async () => {
    router.push('/auth/signout')
  }

  return (
    <motion.header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled ? "bg-white shadow-sm border-b border-gray-200" : "bg-white"
      }`}
      style={{
        backdropFilter: `blur(${backdropBlur.get()}px)`,
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-blue-600 to-gray-600 bg-clip-text text-transparent"
          >
            MeetOn
          </Link>
          
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                {isMobile ? (
                  <MobileMenu 
                    user={session.user} 
                    hasNotifications={hasNotifications}
                    onSignOut={handleSignOut}
                  />
                ) : (
                  <>
                    <Link 
                      href="/notifications" 
                      className="relative group"
                    >
                      <Bell className="h-5 w-5 text-gray-500 group-hover:text-gray-900 transition-colors" />
                      {hasNotifications && (
                        <Badge 
                          className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-red-500" 
                          variant="destructive"
                        />
                      )}
                    </Link>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 overflow-hidden">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || 'User'} />
                            <AvatarFallback>{getInitials(session.user?.name)}</AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <div className="flex items-center justify-start gap-2 p-2">
                          <div className="flex flex-col space-y-1 leading-none">
                            <p className="font-medium">{session?.user?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              @{getUsername()}
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