import { cn } from "@/lib/utils";

const steps = ["address", "shipping", "payment", "review", "success"] as const;

export function CheckoutStepper({ current }: { current: (typeof steps)[number] }) {
  return (
    <div className="mb-8 grid grid-cols-5 gap-2 rounded-lg border border-border bg-card p-3">
      {steps.map((step, index) => (
        <div key={step} className="text-center">
          <div
            className={cn(
              "mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium",
              index <= steps.indexOf(current)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {index + 1}
          </div>
          <p className="mt-2 text-xs capitalize text-muted-foreground">{step}</p>
        </div>
      ))}
    </div>
  );
}
