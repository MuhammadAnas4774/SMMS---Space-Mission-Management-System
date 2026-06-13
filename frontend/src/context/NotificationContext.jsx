import { createContext, useCallback, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const push = useCallback((message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }, []);

  const value = useMemo(
    () => ({
      notifySuccess: (msg) => push(msg, "success"),
      notifyError: (msg) => push(msg, "error"),
      notifyInfo: (msg) => push(msg, "info"),
    }),
    [push]
  );

  return (
    <NotificationContext.Provider value={{ ...value, notifications }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {notifications.map((n) => (
          <div key={n.id} className={`toast toast-${n.type}`}>
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotify outside NotificationProvider");
  return ctx;
}
