import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { NavBar } from './components/nav-bar'
import { ToastProvider } from './components/ui/use-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Social Scheduler',
  description: 'Schedule meetings and events with your friends',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <NavBar />
          <ToastProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow container mx-auto p-4">
                {children}
              </main>
            </div>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}