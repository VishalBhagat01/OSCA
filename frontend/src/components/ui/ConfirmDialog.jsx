import Modal from "./Modal";
import Button from "./Button";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm action",
  description = "Are you sure?",
  confirmText = "Confirm",
  variant = "danger",
  loading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <div className="space-y-6 pr-6">
      <div className="space-y-2">
        <span className="eyebrow">{variant === "danger" ? "Irreversible" : "Confirm"}</span>
        <h3 className="font-display text-2xl leading-tight text-bone">{title}</h3>
        <p className="text-sm leading-relaxed text-bone-2">{description}</p>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-rule pt-5">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
