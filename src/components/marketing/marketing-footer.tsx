import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { FOOTER_NAV } from "@/lib/constants/marketing-nav";

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <Container className="py-14">
        {/* flex-wrap columns so the footer grows gracefully as rounds add columns
            (Use cases / Resources / Company) without leaving empty grid cells. */}
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
          <div className="flex max-w-xs flex-col gap-3">
            <Logo />
            <p className="text-sm text-pretty text-muted-foreground">
              Collect every photo and video from your event — guests scan a QR
              code and upload in seconds. No app, no account.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-8">
            {FOOTER_NAV.map((column) => (
              <div key={column.title} className="flex min-w-28 flex-col gap-3">
                <p className="text-sm font-medium text-foreground">
                  {column.title}
                </p>
                <ul className="flex flex-col gap-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t pt-6">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Partyreel
          </p>
        </div>
      </Container>
    </footer>
  );
}
