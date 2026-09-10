import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { forwardRef } from 'react';

export type { IconSvgElement };

/**
 * App-wide icon type. Every icon in the app is a HugeIcons SVG object
 * imported from `@hugeicons/core-free-icons`.
 */
export type AppIcon = IconSvgElement;

type IconProps = Omit<React.ComponentProps<typeof HugeiconsIcon>, 'icon'> & {
    /** A HugeIcons icon, e.g. `import { Home01Icon } from '@hugeicons/core-free-icons'`. */
    iconNode?: IconSvgElement | null;
};

/**
 * Thin wrapper around HugeIcons' `<HugeiconsIcon />` so the rest of the app has
 * a single, stable icon entry point. Renders nothing when no icon is provided.
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
    ({ iconNode, ...props }, ref) => {
        if (!iconNode) {
            return null;
        }

        return <HugeiconsIcon ref={ref} icon={iconNode} {...props} />;
    },
);

Icon.displayName = 'Icon';

export { HugeiconsIcon };
