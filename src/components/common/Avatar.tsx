import { cn } from "@/lib/utils";

export function Avatar({
  nickname,
  src,
  size = 40,
  className,
}: {
  nickname: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initials =
    nickname
      .replace("@", "")
      .replace(/[^A-Za-z]/g, "")
      .slice(0, 2)
      .toUpperCase() || "SB";
  return src ? (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-leaf to-brand-deep font-extrabold text-white",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}
