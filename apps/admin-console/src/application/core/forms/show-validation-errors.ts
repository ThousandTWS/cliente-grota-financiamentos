import type { FieldErrors, FieldValues } from "react-hook-form";
import { toast } from "sonner";

export function showValidationErrors<TValues extends FieldValues>(
  formErrors: FieldErrors<TValues>,
  fieldNames: Record<string, string>,
) {
  Object.keys(formErrors).forEach((key) => {
    const error = formErrors[key];
    const message =
      error && typeof error === "object" && "message" in error
        ? error.message
        : undefined;

    if (typeof message !== "string" || !message) {
      return;
    }

    const fieldName = fieldNames[key] || key;
    toast.error(`${fieldName}: ${message}`);
  });
}
