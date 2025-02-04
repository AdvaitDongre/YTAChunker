import { toast, Toaster } from 'react-hot-toast';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

// Custom notification styles
const toastStyles = {
  success: {
    style: {
      background: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
    },
    icon: <Check className="w-4 h-4" />,
    className: 'animate-fade-in',
  },
  error: {
    style: {
      background: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
    },
    icon: <X className="w-4 h-4" />,
    className: 'animate-shake',
  },
  warning: {
    style: {
      background: 'hsl(var(--warning))',
      color: 'hsl(var(--warning-foreground))',
    },
    icon: <AlertTriangle className="w-4 h-4" />,
    className: 'animate-bounce',
  },
  info: {
    style: {
      background: 'hsl(var(--secondary))',
      color: 'hsl(var(--secondary-foreground))',
    },
    icon: <Info className="w-4 h-4" />,
    className: 'animate-fade-in',
  },
};

// Notification helper functions
export const notify = {
  success: (message: string) => 
    toast.success(message, {
      ...toastStyles.success,
      duration: 3000,
    }),

  error: (message: string) => 
    toast.error(message, {
      ...toastStyles.error,
      duration: 4000,
    }),

  warning: (message: string) =>
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-fade-in' : 'animate-fade-out'
        } max-w-md w-full bg-card shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            {toastStyles.warning.icon}
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Close
          </button>
        </div>
      </div>
    )),

  info: (message: string) =>
    toast.custom(message, toastStyles.info),

  promise: async (
    promise: Promise<any>,
    messages: { loading: string; success: string; error: string }
  ) =>
    toast.promise(promise, messages, {
      loading: {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
      },
      success: toastStyles.success,
      error: toastStyles.error,
    }),
};

// Toaster component to be added to your layout
export const NotificationsProvider = () => (
  <Toaster
    position="top-right"
    reverseOrder={false}
    gutter={8}
    containerClassName=""
    containerStyle={{}}
    toastOptions={{
      className: '',
      duration: 3000,
      style: {
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
      },
    }}
  />
); 