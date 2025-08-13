import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      status: {
        pending: "bg-warning-light text-warning border border-warning/20",
        ongoing: "bg-primary-light text-primary border border-primary/20",
        resolved: "bg-success-light text-success border border-success/20",
        default: "bg-muted text-muted-foreground border border-border",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      status: "default",
      size: "md",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status?: 'pending' | 'ongoing' | 'resolved';
}

const StatusBadge = ({ className, status, size, ...props }: StatusBadgeProps) => {
  return (
    <div
      className={cn(statusBadgeVariants({ status, size }), className)}
      {...props}
    />
  );
};

export { StatusBadge, statusBadgeVariants };