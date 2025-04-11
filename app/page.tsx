"use client"

import { useState, useEffect } from "react"
import { EventFeed } from "./components/event-feed"
import { AddEventModal } from "./components/add-event-modal"
import { useSession } from "next-auth/react"
import { Button } from "./components/ui/button"
import { 
  Calendar, 
  PlusCircle, 
  Search, 
  Users, 
  Clock, 
  ChevronDown,  
  TrendingUp, 
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "./components/ui/input"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "./components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs"

const features = [
  {
    title: "Create Events",
    description: "Plan gatherings, meetings, and activities with ease.",
    icon: <Calendar className="h-10 w-10 text-teal-400" />,
  },
  {
    title: "Invite Friends",
    description: "Bring your social circle together for memorable experiences.",
    icon: <Users className="h-10 w-10 text-blue-500" />,
  },
  {
    title: "Real-time RSVPs",
    description: "Know who's coming with instant attendance updates.",
    icon: <Clock className="h-10 w-10 text-indigo-500" />,
  },
]

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
}

export default function Home() {
  const { data: session, status } = useSession()
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const isLoading = status === "loading"

  const handleAddEvent = () => setIsAddEventModalOpen(true)
  const handleCloseEventModal = () => setIsAddEventModalOpen(false)

  const handleEventAdded = () => {
    setRefreshKey((prev) => prev + 1)
    setIsAddEventModalOpen(false)
  }

  // Hide scroll indicator after scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false)
      } else {
        setShowScrollIndicator(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Dark mode detection


  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Decorative Background Elements - Slightly adjusted */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-60 -right-40 w-96 h-96 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        {/* Optional subtle pattern */}
        {/* <div className="absolute inset-0 bg-[url('/path/to/subtle-pattern.svg')] opacity-5"></div> */}
      </div>

      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-24 px-4 md:px-8 lg:px-16 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
              Welcome to <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">MeetOn</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Plan and manage events with friends, all in one place. Create, invite, and track RSVPs effortlessly.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {session ? (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button 
                    onClick={handleAddEvent} 
                    size="lg"
                    className="text-base px-8 py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-full hover:from-primary/90 hover:to-blue-500/90 shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create New Event
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button 
                    asChild
                    size="lg"
                    className="text-base px-8 py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-full hover:from-primary/90 hover:to-blue-500/90 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Link href="/auth/signin">Get Started Now</Link>
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <AnimatePresence>
            {showScrollIndicator && (
              <motion.div 
                className="flex justify-center mt-8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col items-center animate-bounce">
                  <span className="text-sm text-gray-500 mb-1">Scroll for more</span>
                  <ChevronDown className="h-6 w-6 text-gray-400" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feature Cards - Added subtle hover effect */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <Card className="h-full hover:shadow-lg hover:border-primary/20 dark:hover:border-primary/40 transition-all border border-border/50 dark:border-border/50">
                  <CardHeader className="flex flex-col items-center text-center pb-2">
                    <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Event Feed Section with Search and Filtering */}
      <section className="py-16 md:py-20 px-4 md:px-8 lg:px-16 bg-background border-t border-border rounded-t-3xl relative z-10 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center">
              <TrendingUp className="mr-3 h-7 w-7 text-primary" />
              Upcoming Events
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-grow sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  className="pl-10 bg-muted/40 border-border/50 focus:border-primary focus:bg-background"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs defaultValue="all" className="mb-8" onValueChange={setFilter}>
            <TabsList className="bg-muted/40 p-1 rounded-full">
              <TabsTrigger value="all" className="rounded-full text-sm px-4 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"> All Events </TabsTrigger>
              <TabsTrigger value="thisWeek" className="rounded-full text-sm px-4 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"> This Week </TabsTrigger>
              <TabsTrigger value="thisMonth" className="rounded-full text-sm px-4 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"> This Month </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Enhanced Event Feed */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <EventFeed key={refreshKey} searchTerm={searchTerm} filter={filter} />
          </motion.div>
        </div>
      </section>

      {/* Logged Out CTA Section */}
      {!session && status !== 'loading' && (
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/90 to-blue-500/90 text-primary-foreground relative z-10 mt-[-1px]">
           <div className="container mx-auto px-6 text-center">
               <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
                 <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Planning?</h2>
                 <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 opacity-90">
                    Sign up today and join the easiest way to coordinate events with your friends and community.
                 </p>
                 <Button 
                    asChild 
                    size="lg"
                    variant="secondary"
                    className="text-base px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all bg-white text-primary hover:bg-white/90"
                 >
                   <Link href="/auth/signin">Sign Up for Free</Link>
                 </Button>
              </motion.div>
           </div>
        </section>
      )}

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={handleCloseEventModal}
        onEventAdded={handleEventAdded}
      />
    </div>
  )
}
