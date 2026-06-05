/**
 * useBarcode — camera-based barcode scanner using `@zxing/browser`.
 *
 * Returns a `videoRef` to attach to a <video> element, plus `start`/`stop`
 * controls and the most recently decoded code.
 *
 *   const { videoRef, isScanning, start, stop, lastCode } = useBarcode({
 *     onCode: (code) => addItemByBarcode(code),
 *   })
 *
 * The hook auto-stops on first decode to avoid duplicate scans.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import {
    BrowserMultiFormatReader,
    type IScannerControls,
} from "@zxing/browser"

type UseBarcodeOptions = {
    /** Fires once per decoded code. After firing, the scanner stops. */
    onCode?: (code: string) => void
    /** Restrict decoder to specific formats. Default: most retail formats. */
    formats?: Array<
        | "EAN_13"
        | "EAN_8"
        | "UPC_A"
        | "UPC_E"
        | "CODE_128"
        | "CODE_39"
        | "QR_CODE"
    >
}

export function useBarcode(options: UseBarcodeOptions = {}) {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const controlsRef = useRef<IScannerControls | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [lastCode, setLastCode] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const onCodeRef = useRef(options.onCode)

    // Keep latest callback in a ref so we don't restart the camera on every
    // parent re-render.
    useEffect(() => {
        onCodeRef.current = options.onCode
    }, [options.onCode])

    const stop = useCallback(() => {
        controlsRef.current?.stop()
        controlsRef.current = null
        setIsScanning(false)
    }, [])

    const start = useCallback(async () => {
        if (isScanning) return
        if (!videoRef.current) {
            setError("video element not attached")
            return
        }

        try {
            setError(null)
            const reader = new BrowserMultiFormatReader(
                options.formats as never
            )
            const controls = await reader.decodeFromVideoDevice(
                undefined,
                videoRef.current,
                (result, err) => {
                    if (result) {
                        const code = result.getText()
                        setLastCode(code)
                        onCodeRef.current?.(code)
                        // Auto-stop after first successful decode
                        controls.stop()
                        controlsRef.current = null
                        setIsScanning(false)
                    }
                    // ignore NotFoundException — fires every frame without a code
                }
            )
            controlsRef.current = controls
            setIsScanning(true)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Camera unavailable")
            setIsScanning(false)
        }
    }, [isScanning, options.formats])

    useEffect(() => {
        return () => {
            controlsRef.current?.stop()
            controlsRef.current = null
        }
    }, [])

    return {
        videoRef,
        isScanning,
        lastCode,
        error,
        start,
        stop,
    }
}
