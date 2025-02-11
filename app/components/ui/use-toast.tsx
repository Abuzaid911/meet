'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { X } from 'lucide-react'

export interface Toast {
  id: string
  title: string
  description?: string
  duration?: number
  variant?: 'default' | 'destructive' | 'success'
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeouts = useRef<{ [key: string]: NodeJS.Timeout }>({})

  // Function to remove a toast
  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))

    // Clear timeout if it exists
    if (timeouts.current[id]) {
      clearTimeout(timeouts.current[id])
      delete timeouts.current[id]
    }
  }, [])

  // Function to add a toast
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { ...toast, id }
    setToasts((prevToasts) => [...prevToasts, newToast])

    if (toast.duration !== Infinity) {
      timeouts.current[id] = setTimeout(() => removeToast(id), toast.duration || 3000)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-md shadow-md p-4 flex justify-between items-center transition-opacity duration-300 ${
              toast.variant === 'destructive' ? 'bg-red-500 text-white' : 
              toast.variant === 'success' ? 'bg-green-500 text-white' : 'bg-white text-gray-800'
            }`}
          >
            <div>
              <h4 className="font-semibold">{toast.title}</h4>
              {toast.description && <p className="text-sm">{toast.description}</p>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="ml-4">
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
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