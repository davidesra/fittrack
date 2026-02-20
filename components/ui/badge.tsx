import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-[#2a2a32] text-gray-300": variant === "default",
          "bg-emerald-500/15 text-emerald-400": variant === "success",
          "bg-yellow-500/15 text-yellow-400": variant === "warning",
          "bg-red-500/15 text-red-400": variant === "error",
          "bg-blue-500/15 text-blue-400": variant === "info",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
