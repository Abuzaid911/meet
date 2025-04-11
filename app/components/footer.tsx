import Link from 'next/link';
import { Linkedin, Github } from 'lucide-react'; 

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t border-border mt-auto w-full">
      <div className="container mx-auto px-6 py-6 text-sm text-muted-foreground">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Copyright & Developer Info */}
          <div className='text-center md:text-left text-xs'>
             &copy; {currentYear} MeetOn. Developed by <Link href="https://abuzaid.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors">Abuzaid</Link>.
          </div>

          {/* Links (Simplified) */}
          <nav className="flex flex-wrap justify-center md:justify-end items-center gap-x-6 gap-y-2 text-xs md:text-sm">
             {/* Social Links */}
             <div className="flex items-center gap-x-4">
                 <Link href="https://github.com/Abuzaid911" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="GitHub">
                    <Github className="h-4 w-4" />
                 </Link>
                 <Link href="https://www.linkedin.com/in/ahmed-abuzaid-a65732185/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="LinkedIn">
                    <Linkedin className="h-4 w-4" />
                 </Link>
             </div>
          </nav>

        </div>

      </div>
    </footer>
  );
} 