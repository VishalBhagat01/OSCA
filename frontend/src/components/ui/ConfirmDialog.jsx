import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  children,
}) => {
  const iconConfig = {
    danger: {
      icon: AlertTriangle,
      color: "text-red-400 bg-red-500/10 border-red-500/20",
      buttonVariant: "danger",
    },
    success: {
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      buttonVariant: "success",
    },
    primary: {
      icon: CheckCircle2,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      buttonVariant: "primary",
    },
  };

  const config = iconConfig[variant] || iconConfig.danger;
  const IconComponent = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showClose={!loading} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${config.color}`}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {children && <div className="pt-2">{children}</div>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
