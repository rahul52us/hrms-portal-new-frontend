import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useToast, ToastPosition, Box, Text } from "@chakra-ui/react";
import { FiCheckCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import stores from "../../../store/stores";

const Notification = observer(() => {
  const {
    auth: { notification, closeNotication },
  } = stores;
  const toast = useToast();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <FiCheckCircle size={20} />;
      case "error":
        return <FiAlertCircle size={20} />;
      case "info":
        return <FiInfo size={20} />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (notification) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const toastId = toast({
        duration: notification.duration || 5000,
        isClosable: true,
        position: isMobile ? "bottom" : (notification.placement as ToastPosition) || "top-right",
        render: () => {
          const isError = notification.type === "error";
          const isSuccess = notification.type === "success";
          
          return (
            <div className={`flex items-start gap-4 px-5 py-4 rounded-2xl shadow-2xl w-full max-w-sm mx-auto mb-6 border backdrop-blur-xl ${
              isError 
                ? 'bg-[#130707]/95 border-red-500/30 shadow-red-500/20' 
                : isSuccess 
                  ? 'bg-[#071309]/95 border-green-500/30 shadow-green-500/20' 
                  : 'bg-[#070D13]/95 border-blue-500/30 shadow-blue-500/20'
            }`}>
              <div className={`flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-white/5 mt-0.5 ${
                isError ? 'text-red-500' : isSuccess ? 'text-green-500' : 'text-blue-500'
              }`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex flex-col pt-0.5">
                {notification.title && (
                  <span className={`font-black text-[11px] uppercase tracking-widest mb-1 ${
                    isError ? 'text-red-400' : isSuccess ? 'text-green-400' : 'text-blue-400'
                  }`}>
                    {notification.title}
                  </span>
                )}
                <span className="text-[13.5px] font-medium text-white/90 leading-snug">
                  {notification.message}
                </span>
              </div>
            </div>
          );
        },
      });

      setTimeout(() => {
        closeNotication();
        toast.close(toastId);
      }, notification.duration || 5000);
    }
  }, [notification, toast, closeNotication]);

  return null;
});

export default Notification;
