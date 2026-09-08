import { Link, router } from '@inertiajs/react';
import { Check, ChevronDown, LogOut, Palette, Settings } from 'lucide-react';
import { useState } from 'react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

const appearanceOptions: { value: Appearance; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'system', label: 'System' },
    { value: 'dark', label: 'Dark' },
];

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const { appearance, updateAppearance } = useAppearance();
    const [appearanceOpen, setAppearanceOpen] = useState(false);

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="cursor-pointer"
                    aria-expanded={appearanceOpen}
                    onSelect={(event) => {
                        event.preventDefault();
                        setAppearanceOpen((open) => !open);
                    }}
                >
                    <Palette className="mr-2" />
                    Appearance
                    <ChevronDown
                        className={cn(
                            'ml-auto size-4 shrink-0 opacity-60 transition-transform duration-200',
                            appearanceOpen && 'rotate-180',
                        )}
                    />
                </DropdownMenuItem>

                <div
                    className={cn(
                        'grid transition-[grid-template-rows] duration-200 ease-out',
                        appearanceOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                >
                    <div className="overflow-hidden">
                        {appearanceOpen &&
                            appearanceOptions.map(({ value, label }) => (
                                <DropdownMenuItem
                                    key={value}
                                    className="cursor-pointer pl-8"
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        updateAppearance(value);
                                    }}
                                >
                                    <span
                                        className={cn(
                                            appearance !== value &&
                                                'text-muted-foreground',
                                        )}
                                    >
                                        {label}
                                    </span>
                                    {appearance === value && (
                                        <Check className="text-primary ml-auto size-4 shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                    </div>
                </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
