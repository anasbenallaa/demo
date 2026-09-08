import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    title: string;
    description?: string;
    /** Optional control shown on the right side of the card header. */
    action?: ReactNode;
    className?: string;
    /** Extra classes for the body wrapper (e.g. padding overrides). */
    bodyClassName?: string;
    children: ReactNode;
};

export default function SettingsCard({
    title,
    description,
    action,
    className,
    bodyClassName,
    children,
}: Props) {
    return (
        <div
            className={cn(
                'border-border/70 bg-card overflow-hidden rounded-xl border',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-4 px-6 py-4">
                <div className="space-y-0.5">
                    <h3 className="text-muted-foreground text-sm font-medium">
                        {title}
                    </h3>
                    {description ? (
                        <p className="text-muted-foreground/70 text-sm">
                            {description}
                        </p>
                    ) : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            <div
                className={cn(
                    'border-border/70 border-t px-6 py-6',
                    bodyClassName,
                )}
            >
                {children}
            </div>
        </div>
    );
}
