import Image from "next/image";

import { StyledQr } from "@/components/app/styled-qr";
import { QR_PRESETS } from "@/lib/constants/qr-presets";

import { COVER_PHOTO, EVENT_NAME } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

const QR_VALUE = "https://partyreel.com/e/maya-and-jay";
const MONO_QR = QR_PRESETS.classic.options;

/**
 * Touchpoint: the QR table card, the printed growth artifact every guest
 * actually scans (and every future host first meets). Real scannable QRs
 * (the app's own StyledQr + the classic mono preset). Rendered as physical
 * cards on a neutral table surface; all three print pure black and white.
 */
export function QrCardVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Minimal ink"
        rationale="QR, name, one instruction: the quietest possible object. Prints anywhere, disappears into any tablescape."
        framed={false}
      >
        <Table>
          <Card>
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <StyledQr value={QR_VALUE} size={150} style={MONO_QR} />
              <p data-dir-display className="mt-4 text-xl leading-snug text-balance text-zinc-950">
                {EVENT_NAME}
              </p>
              <p className="mt-1.5 text-[11px] text-zinc-500">
                Scan to add your photos
              </p>
            </div>
          </Card>
        </Table>
      </Variant>

      <Variant
        n={2}
        name="Invitation frame"
        rationale="A double hairline and small caps borrow the stationery register: the card reads as part of the invitation suite."
        framed={false}
      >
        <Table>
          <Card>
            <div className="m-3 flex flex-1 flex-col items-center justify-center border border-zinc-300 px-5 text-center">
              <div className="m-1 flex flex-1 flex-col items-center justify-center self-stretch border border-zinc-300 px-4">
                <p className="text-[9px] tracking-[0.28em] text-zinc-500 uppercase">
                  You&rsquo;re invited
                </p>
                <p data-dir-display className="mt-2 text-xl leading-snug text-balance text-zinc-950">
                  {EVENT_NAME}
                </p>
                <div className="mt-4">
                  <StyledQr value={QR_VALUE} size={124} style={MONO_QR} />
                </div>
                <p className="mt-3 text-[9px] tracking-[0.22em] text-zinc-500 uppercase">
                  June 14 · Scan to share photos
                </p>
              </div>
            </div>
          </Card>
        </Table>
      </Variant>

      <Variant
        n={3}
        name="Photo-backed"
        rationale="The cover photo wraps the card; the QR sits on a white inset so it still scans. The loudest, the most this-event."
        framed={false}
      >
        <Table>
          <Card>
            <div className="relative flex-1">
              <Image src={COVER_PHOTO} alt="" fill sizes="260px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/45" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center p-4">
                <div className="rounded-lg bg-white p-2.5 shadow-[0_6px_20px_rgba(0,0,0,0.3)]">
                  <StyledQr value={QR_VALUE} size={110} style={MONO_QR} />
                </div>
                <p data-dir-display className="mt-3 text-center text-lg leading-snug text-white">
                  {EVENT_NAME}
                </p>
                <p className="mt-0.5 text-[10px] text-white/80">
                  Scan to add your photos
                </p>
              </div>
            </div>
          </Card>
        </Table>
      </Variant>
    </div>
  );
}

/* A neutral tabletop so the cards read as PRINT, not UI: fixed warm-gray
   surround in both modes (paper does not dark-mode). */
function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center rounded-[var(--radius)] bg-zinc-200 px-6 py-8">
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex aspect-[5/7] w-full max-w-[250px] flex-col overflow-hidden rounded-xl bg-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.4)]">
      {children}
    </div>
  );
}
