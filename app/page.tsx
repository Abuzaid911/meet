"use client"

import { useState, useEffect, useRef } from "react"
// Removing unused import
// import { EventFeed } from "./components/event-feed"
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
  Sparkles,
  // Removing unused import
  // Star,
  ArrowRight
} from "lucide-react"
import { motion, AnimatePresence, useScroll, useTransform, useInView, useSpring } from "framer-motion"
import { Input } from "./components/ui/input"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "./components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs"
import { EventCarousel } from "./components/event-carousel"

const features = [
  {
    title: "Create Events",
    description: "Plan gatherings, meetings, and activities with ease.",
    icon: <Calendar className="h-10 w-10 text-blue-400" />,
  },
  {
    title: "Invite Friends",
    description: "Bring your social circle together for memorable experiences.",
    icon: <Users className="h-10 w-10 text-blue-600" />,
  },
  {
    title: "Real-time RSVPs",
    description: "Know who's coming with instant attendance updates.",
    icon: <Clock className="h-10 w-10 text-blue-800" />,
  },
]

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    }
  }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "backOut"
    }
  }
}

const FloatingParticle = ({ delay = 0, left, top, size = 6, color = "primary" }: 
  { delay?: number, left: string, top: string, size?: number, color?: string }) => {
  return (
    <motion.div 
      className={`absolute w-${size} h-${size} rounded-full bg-${color} opacity-60 blur-sm`}
      style={{ left, top }}
      initial={{ y: 0 }}
      animate={{ 
        y: [0, -15, 0],
        opacity: [0.6, 0.9, 0.6],
        scale: [1, 1.2, 1]
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
    />
  )
}

export default function Home() {
  const { data: session, status } = useSession()
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const isLoading = status === "loading"
  
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const eventsRef = useRef<HTMLDivElement>(null)
  
  const heroInView = useInView(heroRef, { once: false, amount: 0.3 })
  const featuresInView = useInView(featuresRef, { once: false, amount: 0.2 })
  const eventsInView = useInView(eventsRef, { once: false, amount: 0.1 })
  
  const { scrollYProgress } = useScroll()
  const headerScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.6])
  const springHeaderScale = useSpring(headerScale, { stiffness: 100, damping: 30 })
  const springHeaderOpacity = useSpring(headerOpacity, { stiffness: 100, damping: 30 })

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

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="absolute top-0 -left-40 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-40"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        ></motion.div>
        
        <motion.div 
          className="absolute top-60 -right-40 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        ></motion.div>
        
        <motion.div 
          className="absolute bottom-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{
            x: [0, 60, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        ></motion.div>
        
        {/* Floating particles */}
        <FloatingParticle left="10%" top="20%" delay={0} color="blue-400" />
        <FloatingParticle left="20%" top="60%" delay={1.5} color="blue-400" />
        <FloatingParticle left="70%" top="15%" delay={0.8} color="blue-700" />
        <FloatingParticle left="85%" top="50%" delay={2.2} size={4} color="blue-900" />
        <FloatingParticle left="40%" top="75%" delay={1.1} size={5} color="blue-900" />
      </div>

      {/* Hero Section */}
      <section 
        ref={heroRef} 
        className="pt-20 pb-16 md:pt-28 md:pb-24 px-4 md:px-8 lg:px-16 relative z-10"
      >
        <div className="max-w-5xl mx-auto">
          <motion.div 
            style={{ 
              scale: springHeaderScale,
              opacity: springHeaderOpacity
            }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex justify-center mb-6">
                <motion.div 
                  className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span>Your social calendar, reimagined</span>
                </motion.div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight relative text-gray-400">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent relative">
                  MeetOn
                  <div className="absolute -top-3 -right-4">
                    <motion.div
                      initial={{ rotate: -15, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
                    >
                    </motion.div>
                  </div>
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
                Plan and manage events with friends, all in one place. Create, invite, and track RSVPs effortlessly.
              </p>
            </motion.div>
            
            <div className="flex flex-wrap justify-center gap-4">
              {session ? (
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
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
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
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
                <motion.div 
                  className="flex flex-col items-center"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                >
                  <span className="text-sm text-gray-500 mb-1">Scroll for more</span>
                  <ChevronDown className="h-6 w-6 text-gray-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feature Cards with staggered animation */}
          <motion.div 
            ref={featuresRef}
            variants={staggerContainer}
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.2 }
                }}
              >
                <Card className="h-full border border-border/50 dark:border-border/50 relative overflow-hidden group">
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  <CardHeader className="flex flex-col items-center text-center pb-2 relative z-10">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4"
                    >
                      {feature.icon}
                    </motion.div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center relative z-10">
                    <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Event Feed Section with enhanced animations */}
      <motion.section 
        ref={eventsRef}
        initial={{ opacity: 0 }}
        animate={eventsInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="py-16 md:py-20 px-4 md:px-8 lg:px-16 bg-background border-t border-border rounded-t-3xl relative z-10 min-h-screen"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate={eventsInView ? "visible" : "hidden"}
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold tracking-tight flex items-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Sparkles className="mr-3 h-7 w-7 text-primary" />
              </motion.div>
              Upcoming Events
            </motion.h2>
            
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 w-full md:w-auto"
            >
              <motion.div 
                className="relative flex-grow sm:max-w-xs"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  className="pl-10 bg-muted/40 border-border/50 focus:border-primary focus:bg-background"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate={eventsInView ? "visible" : "hidden"}
          >
            <Tabs defaultValue="all" className="mb-8" onValueChange={setFilter}>
              <TabsList className="bg-muted/40 p-1 rounded-full">
                <TabsTrigger value="all" className="rounded-full text-sm px-4 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"> All Events </TabsTrigger>
                <TabsTrigger value="thisWeek" className="rounded-full text-sm px-4 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"> This Week </TabsTrigger>
                <TabsTrigger value="thisMonth" className="rounded-full text-sm px-4 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"> This Month </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
          
          {/* Enhanced Event Feed with sliding animations */}
          <AnimatePresence mode="wait">
            <motion.div
              key={filter + refreshKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden"
            >
              {/* Animated gradient overlay on edges for scroll indication */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
              
              {/* Event Feed with animated carousel */}
              <motion.div
                initial={{ x: 20 }}
                animate={{ x: 0 }}
                className="carousel-container pb-8"
              >
                <EventCarousel key={refreshKey} searchTerm={searchTerm} filter={filter} />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Logged Out CTA Section with enhanced animations */}
      {!session && status !== 'loading' && (
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="py-16 md:py-24 bg-gradient-to-r from-primary/90 to-blue-500/90 text-primary-foreground relative z-10 mt-[-1px] overflow-hidden"
        >
          {/* Animated background shapes */}
          <motion.div 
            className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            animate={{
              x: [50, 150, 50],
              y: [0, 100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [50, 0, 50],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
           
          <div className="container mx-auto px-6 text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Planning?</h2>
              <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 opacity-90">
                Sign up today and join the easiest way to coordinate events with your friends and community.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  asChild 
                  size="lg"
                  variant="secondary"
                  className="text-base px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all bg-white text-primary hover:bg-white/90 group"
                >
                  <Link href="/auth/signin" className="flex items-center">
                    Sign Up for Free
                    <motion.div
                      initial={{ x: 0, opacity: 0.5 }}
                      animate={{ x: 5, opacity: 1 }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="ml-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
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
