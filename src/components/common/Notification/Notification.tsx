import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info } from "lucide-react";

export type NotificationType = "success" | "error" | "info";

interface NotificationProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const getNotificationStyles = (type: NotificationType) => {
  switch (type) {
    case "success":
      return "bg-green-500/10 border-green-500/30 text-green-400";
    case "error":
      return "bg-red-500/10 border-red-500/30 text-red-400";
    case "info":
      return "bg-blue-500/10 border-blue-500/30 text-blue-400";
  }
};

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "success":
      return <CheckCircle className="w-5 h-5" />;
    case "error":
      return <XCircle className="w-5 h-5" />;
    case "info":
      return <Info className="w-5 h-5" />;
  }
};

const Notification = ({
  type,
  message,
  isVisible,
  onClose,
}: NotificationProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div
            className={`px-4 py-3 rounded-lg shadow-lg border bg-primary backdrop-blur-md ${getNotificationStyles(
              type
            )}`}
          >
            <div className="flex items-center gap-3">
              {getNotificationIcon(type)}
              <p className="text-white">{message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
