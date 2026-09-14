import { cn } from "@/lib/cn";

export function Logo({ className, mark = "dark" }: { className?: string; mark?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-xl font-medium", className)}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect x="1" y="1" width="24" height="24" rx="6" className={mark === "dark" ? "fill-accent-600" : "fill-paper"} />
        <path
          d="M7 8.5H17.5M7 12.5H14.5"
          stroke={mark === "dark" ? "#fbf9f4" : "#6e2430"}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M6.8 17.6C8.4 16 9.6 18.6 11 17.2C12.4 15.8 13 18.6 14.6 17.2C16 16 16.6 18 18.5 17.4"
          stroke={mark === "dark" ? "#fbf9f4" : "#6e2430"}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={mark === "dark" ? "text-ink-900" : "text-paper"}>
        Facture<span className="text-accent-600">GO</span>
      </span>
    </span>
  );
}
