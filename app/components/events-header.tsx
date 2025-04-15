"use client";

import { motion } from "framer-motion";
import { SparklesIcon, CalendarIcon } from "lucide-react";

export function EventsHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-border/40 shadow-sm"
    >
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-blue-500/10 p-6 md:p-8 lg:p-10">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <CalendarIcon className="absolute top-6 right-6 w-32 h-32 text-primary/20" />
          <SparklesIcon className="absolute bottom-6 right-16 w-24 h-24 text-blue-500/20" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Events Calendar
          </h1>
          
          <p className="mt-3 text-muted-foreground text-sm md:text-base">
            Discover and organize events with friends. Track RSVPs, get reminders, and 
            connect your personal calendar.
          </p>
        </div>
      </div>
    </motion.div>
  );
} 