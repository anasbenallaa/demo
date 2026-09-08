import { router } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
import PasskeyItem from '@/components/passkey-item';
import PasskeyRegistration from '@/components/passkey-register';
import SettingsCard from '@/components/settings-card';
import type { Passkey } from '@/types/auth';

export type Props = {
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

const EmptyState = () => {
    return (
        <div className="border-border/70 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
            <div className="bg-muted mb-2 flex size-12 items-center justify-center rounded-2xl">
                <KeyRound className="text-muted-foreground size-6" />
            </div>
            <p className="text-base font-semibold">No passkeys yet</p>
            <p className="text-muted-foreground text-sm">
                Add a passkey to sign in without a password.
            </p>
        </div>
    );
};

export default function ManagePasskeys(props: Props) {
    const passkeys = props.passkeys ?? [];

    const handleDelete = (id: number, onError: () => void) => {
        router.delete(destroy.url(id), {
            preserveScroll: true,
            onError,
        });
    };

    const handleRegisterSuccess = () => {
        router.reload();
    };

    if (!(props.canManagePasskeys ?? false)) {
        return null;
    }

    return (
        <SettingsCard
            title="Passkeys"
            description="Manage your passkeys for passwordless sign-in."
        >
            <div className="space-y-6">
                {passkeys.length > 0 ? (
                    <div className="border-border/70 overflow-hidden rounded-lg border">
                        {passkeys.map((passkey) => (
                            <PasskeyItem
                                key={passkey.id}
                                passkey={passkey}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState />
                )}

                <PasskeyRegistration onSuccess={handleRegisterSuccess} />
            </div>
        </SettingsCard>
    );
}
