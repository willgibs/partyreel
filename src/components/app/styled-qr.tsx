"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { FileExtension } from "qr-code-styling";

import type { QrStyleOptions } from "@/lib/constants/qr-presets";

// The QRCodeStyling instance type, referenced type-only (the value is loaded by
// the dynamic import below). `default` is the class, and the class name doubles
// as its instance type.
type QrInstance = import("qr-code-styling").default;

export type StyledQrHandle = {
  download: (name: string, extension: FileExtension) => void;
};

type StyledQrProps = {
  /** The data the QR encodes (the guest-join URL). */
  value: string;
  /** Total square size in px (includes the quiet-zone margin). */
  size: number;
  style: QrStyleOptions;
  className?: string;
};

function buildOptions(value: string, size: number, style: QrStyleOptions) {
  return {
    type: "svg" as const,
    width: size,
    height: size,
    data: value,
    // Quiet zone — proportional so it survives a bare download (no surrounding
    // white tile). Scanners need a clear border to lock on.
    margin: Math.round(size * 0.1),
    ...style,
  };
}

// Renders a styled QR via qr-code-styling. That library touches window/document
// on construction, so it is dynamically imported and instantiated INSIDE the
// effect — never at module or render scope, which would crash the client
// component's SSR pass in Next 16. The instance is reused across prop changes
// (.update) and exposes an imperative .download() to the parent.
export const StyledQr = forwardRef<StyledQrHandle, StyledQrProps>(
  function StyledQr({ value, size, style, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const qrRef = useRef<QrInstance | null>(null);
    // Latest props, read inside the async mount effect to avoid a stale closure
    // if they change before the dynamic import resolves.
    const latest = useRef({ value, size, style });
    latest.current = { value, size, style };

    useImperativeHandle(
      ref,
      () => ({
        download(name, extension) {
          void qrRef.current?.download({ name, extension });
        },
      }),
      [],
    );

    // Mount once: load the lib, build the instance, append it.
    useEffect(() => {
      let cancelled = false;
      const container = containerRef.current;
      void (async () => {
        const { default: QRCodeStyling } = await import("qr-code-styling");
        if (cancelled) return;
        const { value, size, style } = latest.current;
        const qr = new QRCodeStyling(buildOptions(value, size, style));
        qrRef.current = qr;
        if (container) qr.append(container);
      })();
      return () => {
        cancelled = true;
        qrRef.current = null;
        container?.replaceChildren();
      };
    }, []);

    // Re-render in place when the encoded value or style changes. No-ops until
    // the instance exists (the mount effect already used the latest props).
    useEffect(() => {
      qrRef.current?.update(buildOptions(value, size, style));
    }, [value, size, style]);

    return <div ref={containerRef} className={className} aria-hidden />;
  },
);
