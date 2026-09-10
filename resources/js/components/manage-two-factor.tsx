import { ShieldCheckIcon } from '@hugeicons/core-free-icons';
import { Form } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import SettingsCard from '@/components/settings-card';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { disable, enable } from '@/routes/two-factor';

export type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function ManageTwoFactor(props: Props) {
    const requiresConfirmation = props.requiresConfirmation ?? false;
    const twoFactorEnabled = props.twoFactorEnabled ?? false;

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    if (!(props.canManageTwoFactor ?? false)) {
        return null;
    }

    const enableAction = hasSetupData ? (
        <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSetupModal(true)}
        >
            <Icon iconNode={ShieldCheckIcon} />
            Continue setup
        </Button>
    ) : (
        <Form {...enable.form()} onSuccess={() => setShowSetupModal(true)}>
            {({ processing }) => (
                <Button
                    variant="outline"
                    size="sm"
                    type="submit"
                    disabled={processing}
                >
                    Configure 2FA
                </Button>
            )}
        </Form>
    );

    return (
        <>
            <SettingsCard
                title="Two-factor authentication"
                description="Add a time-based one-time password to protect your account."
                action={twoFactorEnabled ? undefined : enableAction}
            >
                {twoFactorEnabled ? (
                    <div className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                            You will be prompted for a secure, random pin during
                            login, which you can retrieve from the
                            TOTP-supported application on your phone.
                        </p>

                        <Form {...disable.form()}>
                            {({ processing }) => (
                                <Button
                                    variant="destructive"
                                    type="submit"
                                    disabled={processing}
                                >
                                    Disable 2FA
                                </Button>
                            )}
                        </Form>

                        <TwoFactorRecoveryCodes
                            recoveryCodesList={recoveryCodesList}
                            fetchRecoveryCodes={fetchRecoveryCodes}
                            errors={errors}
                        />
                    </div>
                ) : (
                    <div className="border-border/70 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
                        <div className="bg-muted mb-2 flex size-12 items-center justify-center rounded-2xl">
                            <Icon
                                iconNode={ShieldCheckIcon}
                                className="text-muted-foreground size-6"
                            />
                        </div>
                        <p className="text-base font-semibold">
                            Two-factor authentication is off
                        </p>
                        <p className="text-muted-foreground text-sm">
                            Configure an authenticator app to add another
                            sign-in check.
                        </p>
                    </div>
                )}
            </SettingsCard>

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={twoFactorEnabled}
                qrCodeSvg={qrCodeSvg}
                manualSetupKey={manualSetupKey}
                clearSetupData={clearSetupData}
                fetchSetupData={fetchSetupData}
                errors={errors}
            />
        </>
    );
}
