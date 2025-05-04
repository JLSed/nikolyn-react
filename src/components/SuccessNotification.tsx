import { useEffect } from "react";

interface SuccessNotificationProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
}

function SuccessNotification({
  message,
  isVisible,
  onHide,
}: SuccessNotificationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onHide();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  return (
    <div
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-transform duration-300 ${
        isVisible ? "scale-100" : "scale-0"
      }`}
    >
      <p className="text-lg font-semibold">{message}</p>
    </div>
  );
}

export default SuccessNotification;
