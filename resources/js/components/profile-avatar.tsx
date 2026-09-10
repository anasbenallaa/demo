import { router } from '@inertiajs/react';
import { type ChangeEvent, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import {
    destroy as removeAvatar,
    update as uploadAvatar,
} from '@/routes/profile/avatar';
import type { User } from '@/types';

const MAX_BYTES = 1024 * 1024; // 1MB
const ACCEPT = 'image/jpeg,image/png,image/webp';

export default function ProfileAvatar({ user }: { user: User }) {
    const getInitials = useInitials();
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string>();
    const [busy, setBusy] = useState(false);

    const onFile = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        setError(undefined);

        if (file.size > MAX_BYTES) {
            setError('The image must not be larger than 1MB.');
            return;
        }

        router.post(
            uploadAvatar().url,
            { avatar: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
                onError: (errors) => setError(errors.avatar),
            },
        );
    };

    const remove = () => {
        router.delete(removeAvatar().url, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="flex items-center gap-4">
            <Avatar className="size-20 rounded-full">
                {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                ) : null}
                <AvatarFallback className="rounded-full text-xl">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={onFile}
                    data-test="avatar-input"
                />

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => inputRef.current?.click()}
                        data-test="avatar-browse-button"
                    >
                        {busy ? 'Uploading…' : 'Browse…'}
                    </Button>

                    {user.avatar ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={busy}
                            onClick={remove}
                            data-test="avatar-remove-button"
                        >
                            Remove
                        </Button>
                    ) : null}
                </div>

                <InputError message={error} />
            </div>
        </div>
    );
}
