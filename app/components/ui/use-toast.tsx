'use client'

import { createContext, useCallback, useContext, useState } from 'react'

// Define the structure of a toast notification
export interface Toast {
  id: string
  title: string
  description?: string
  duration?: number
  variant?: 'default' | 'destructive' | 'success'
}

// Define the toast context type
interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

// Create the toast context
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Provider component for toast functionality
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Remove a toast by ID - define before addToast to avoid circular dependency
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // Add a new toast
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }
    
    setToasts((prev) => [...prev, newToast])
    
    // Auto-remove toast after duration (default: 5 seconds)
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

// Custom hook for using the toast system
export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export default useToast