import {
    Dialog,
    DialogContent,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { appConfig } from "@/config/app.config"

interface RestrictedModalProps {
    open: boolean
    userName?: string
    userLogin?: string
}

export function RestrictedModal({
    open,
    userName,
    userLogin,
}: RestrictedModalProps) {
    return (
        <Dialog
            open={open}
            // onOpenChange dikunci — modal tidak bisa ditutup
            onOpenChange={() => {}}
        >
            <DialogContent
                // Matikan close button bawaan
                showCloseButton={false}
                // Prevent close on overlay click & escape key
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className="h-11/12 min-w-11/12 gap-0 overflow-hidden p-0"
            >
                <div className="flex h-full flex-col items-center justify-center gap-2">
                    <div>
                        <h1>
                            Tidak ada sesi aktif untuk user {userLogin} (
                            {userName})
                        </h1>
                    </div>
                    <div>
                        <p>Silahkan login kembali untuk melanjutkan</p>
                    </div>
                    <Button
                        onClick={() => {
                            window.location.href = appConfig.odoo.posUrl
                        }}
                    >
                        Login ke Odoo
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
