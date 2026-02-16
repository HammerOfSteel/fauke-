import { CheckCircle, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
}

export default function Toast({ message, type }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border text-sm font-medium ${
          type === "success"
            ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
            : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
        }`}
      >
        {type === "success" ? (
          <CheckCircle size={16} className="text-green-500" />
        ) : (
          <AlertCircle size={16} className="text-red-500" />
        )}
        {message}
      </div>
    </div>
  );
}
