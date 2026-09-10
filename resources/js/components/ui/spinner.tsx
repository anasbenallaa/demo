import { Loading03Icon } from "@hugeicons/core-free-icons"

import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

function Spinner({
  className,
  ...props
}: Omit<React.ComponentProps<"svg">, "strokeWidth">) {
  return (
    <Icon
      iconNode={Loading03Icon}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
