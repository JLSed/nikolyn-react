import { createContext, useContext, useState, ReactNode } from "react";

interface ConfirmOptions {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => void;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
  }>({
    isOpen: false,
    options: {
      message: "",
      onConfirm: () => {},
    },
  });

  const confirm = (options: ConfirmOptions) => {
    setState({
      isOpen: true,
      options,
    });
  };

  const handleConfirm = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
    // Use setTimeout to avoid React state update conflicts
    setTimeout(() => {
      state.options.onConfirm();
    }, 0);
  };

  const handleCancel = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
    if (state.options.onCancel) {
      setTimeout(() => {
        state.options.onCancel?.();
      }, 0);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Confirmation Dialog */}
      {state.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {state.options.title || "Confirm Action"}
            </h2>
            <p className="mb-6 text-gray-700">{state.options.message}</p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={handleCancel}
              >
                {state.options.cancelText || "Cancel"}
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-red-700"
                onClick={handleConfirm}
              >
                {state.options.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
