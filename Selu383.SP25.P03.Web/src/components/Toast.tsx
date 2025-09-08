import "../styles/Toast.css";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export const Toast = ({ message, type = "success", onClose }: ToastProps) => {
  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};
