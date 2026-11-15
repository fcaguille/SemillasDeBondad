import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onCheckedChange,
  id,
  className,
  ...aria
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  className?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      id={id}
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-[7px] border-2 transition",
        checked ? "border-primary bg-primary text-white" : "border-[#C6CCC4] bg-card",
        className,
      )}
      {...aria}
    >
      {checked && <Check size={15} strokeWidth={3} />}
    </button>
  );
}
