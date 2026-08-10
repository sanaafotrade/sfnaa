"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANTS = {
  danger: {
    iconBg: "linear-gradient(135deg, #dc2626, #ef4444)",
    iconColor: "#fff",
    buttonBg: "linear-gradient(135deg, #dc2626, #b91c1c)",
    buttonHover: "#991b1b",
    accentColor: "#dc2626",
    Icon: Trash2,
  },
  warning: {
    iconBg: "linear-gradient(135deg, #f59e0b, #d97706)",
    iconColor: "#fff",
    buttonBg: "linear-gradient(135deg, #f59e0b, #d97706)",
    buttonHover: "#b45309",
    accentColor: "#f59e0b",
    Icon: AlertTriangle,
  },
  info: {
    iconBg: "linear-gradient(135deg, #3b82f6, #2563eb)",
    iconColor: "#fff",
    buttonBg: "linear-gradient(135deg, #3b82f6, #2563eb)",
    buttonHover: "#1d4ed8",
    accentColor: "#3b82f6",
    Icon: AlertTriangle,
  },
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "حذف",
  cancelText = "إلغاء",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const v = VARIANTS[variant];
  const VIcon = v.Icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 24,
              width: 400,
              maxWidth: "90vw",
              overflow: "hidden",
              boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
            }}
          >
            {/* Icon */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: 32,
                paddingBottom: 8,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: v.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 8px 24px ${v.accentColor}40`,
                }}
              >
                <VIcon style={{ width: 28, height: 28, color: v.iconColor }} />
              </div>
            </div>

            {/* Text */}
            <div style={{ padding: "16px 32px 24px", textAlign: "center" }}>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: 8,
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "#64748b",
                  lineHeight: 1.6,
                }}
              >
                {message}
              </p>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: "0 24px 24px",
              }}
            >
              <button
                onClick={onCancel}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: loading ? "#94a3b8" : v.buttonBg,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: loading ? "none" : `0 4px 12px ${v.accentColor}30`,
                  transition: "transform 0.1s",
                }}
              >
                {loading ? (
                  <Loader2
                    style={{
                      width: 16,
                      height: 16,
                      animation: "confirm-spin 1s linear infinite",
                    }}
                  />
                ) : (
                  <VIcon style={{ width: 16, height: 16 }} />
                )}
                {confirmText}
              </button>
            </div>
          </motion.div>

          <style>{`
            @keyframes confirm-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
