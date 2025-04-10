'use client'

import { useToast } from './use-toast'
import { X } from 'lucide-react'

// Toaster component that renders active toasts
export function Toaster() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-md shadow-md p-4 flex justify-between items-center transition-opacity duration-300 ${
            toast.variant === 'destructive' ? 'bg-red-500 text-white' : 
            toast.variant === 'success' ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200'
          }`}
        >
          <div>
            <h4 className="font-semibold">{toast.title}</h4>
            {toast.description && <p className="text-sm">{toast.description}</p>}
          </div>
          <button 
            onClick={() => removeToast(toast.id)} 
            className="ml-4 text-current opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}