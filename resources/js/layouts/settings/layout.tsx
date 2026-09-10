import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { useCurrentUrl } from '@/hooks/use-current-url';

const headings: Record<string, { title: string; description: string }> = {
    '/settings/security': {
        title: 'Security',
        description:
            'Manage your password, two-factor authentication, and passkeys.',
    },
    '/settings/profile': {
        title: 'Profile',
        description: 'Update your name, email address, and profile picture.',
    },
};

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { currentUrl } = useCurrentUrl();
    const heading = headings[currentUrl] ?? headings['/settings/profile'];

    return (
        <div className="px-4 py-6">
            <Heading title={heading.title} description={heading.description} />

            <section className="space-y-6">{children}</section>
        </div>
    );
}
