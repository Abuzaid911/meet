import Link from 'next/link';
import { Calendar, Linkedin, Github } from 'lucide-react'; // Example icons

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/40 border-t border-border mt-auto w-full">
      <div className="container mx-auto px-6 py-8 md:py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-muted-foreground">
        
        {/* Column 1: Brand & Description */}
        <div className="space-y-3">
          <Link href="/" className="flex items-center space-x-2 text-foreground font-semibold text-lg">
             <Calendar className="h-6 w-6 text-primary" /> 
             <span>MeetOn</span>
          </Link>
          <p>
            Simplifying event planning and scheduling among friends.
            Plan, invite, and connect effortlessly.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Quick Links</h4>
          <nav className="space-y-2">
            <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
            <li><Link href="/events/create" className="hover:text-primary transition-colors">Create Event</Link></li>
            <li><Link href="/profile" className="hover:text-primary transition-colors">My Profile</Link></li>
            {/* Add other relevant links */} 
            {/* <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li> */} 
          </nav>
        </div>

        {/* Column 3: Legal & Social */}
        <div>
            <h4 className="font-medium text-foreground mb-3">Connect</h4>
             <div className="flex space-x-4">
                {/* Replace with actual social links */}
                <Link href="https://github.com/Abuzaid911" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Github className="h-5 w-5" /></Link>
                <Link href="https://www.linkedin.com/in/ahmed-abuzaid-a65732185/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
            </div>
        </div>
      </div>

      {/* Bottom Bar - Add website link */}
      <div className="bg-muted/60 py-4 border-t border-border">
        <div className="container mx-auto px-6 text-center text-xs text-muted-foreground">
          &copy; {currentYear} MeetOn. All rights reserved. Developed by <Link href="https://abuzaid.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary transition-colors">Abuzaid</Link>.
        </div>
      </div>
    </footer>
  );
} 