import re, sys, os, subprocess
CUT=sys.argv[1]
R="/Users/gibby/local/ai/partyreel"; os.chdir(R)
plan=open("/Users/gibby/.claude/plans/you-are-the-new-tender-globe.md").read()
def section(head_re):
    m=re.search(r"(^## "+head_re+r".*?)(?=^#{1,2} |\Z)", plan, re.S|re.M)
    assert m, head_re
    return m.group(1).strip()
rules=section(r"The ownership rules every manifest follows")
def files(cmd):
    return [l for l in subprocess.run(cmd,shell=True,capture_output=True,text=True).stdout.split("\n") if l]
dash_components=[f"src/components/app/dashboard/{f}" for f in os.listdir("src/components/app/dashboard") if f!="events-empty-teaser.tsx"]
social=[f"src/components/social/{f}" for f in os.listdir("src/components/social") if f!="guest-list.tsx"]
OWNS={
"voice-wiring":[
 "src/lib/constants/marketing-voice.ts","src/lib/constants/site.ts","src/lib/constants/feature-pages.ts","src/lib/constants/features.ts",
 "src/lib/constants/press.ts","src/lib/constants/careers.ts","src/lib/constants/events.ts","src/lib/constants/events.test.ts",
 "src/lib/content/help.ts","src/lib/content/llms.ts","src/lib/og/marketing-og-card.tsx","src/app/opengraph-image.tsx",
 "src/app/(marketing)/(cinema)/events/opengraph-image.tsx","src/app/(marketing)/(cinema)/events/[slug]/opengraph-image.tsx",
 "src/app/(marketing)/(cinema)/events/page.tsx","src/app/(marketing)/(cinema)/blog/page.tsx",
 "src/components/marketing/sections/home/trust-strip.tsx","src/components/marketing/sections/home/no-app.tsx",
 "src/components/marketing/sections/reel/guest-share-section.tsx","src/components/marketing/sections/features/qr/entry-flow.tsx",
 "src/components/marketing/sections/features/qr/print-shop.tsx","src/components/marketing/sections/features/album/entry-phone.tsx",
 "src/components/marketing/sections/features/album/album-copy.ts","src/components/marketing/sections/features/album/how-much-fits.tsx",
 "src/components/marketing/sections/how-it-works/guest-pictures.tsx","src/components/marketing/chrome/marketing-footer.tsx",
 "src/components/marketing/jsonld.tsx","src/components/marketing/faq-data.ts","src/components/marketing/sections/pricing/plan-cards.tsx",
 "src/components/marketing/sections/home/pricing-teaser.tsx","src/components/marketing/mock-parity.test.ts",
 "src/components/guest/entry-modal.tsx","src/components/guest/enter-event-prompt.tsx","src/components/guest/gallery-empty-state.tsx",
 "src/components/guest/gallery-empty-state.test.tsx","src/components/guest/save-event-button.tsx","src/components/likes/likes-provider.tsx",
 "src/components/app/welcome-flow.tsx","src/components/app/dashboard/events-empty-teaser.tsx","src/app/(dev)/design/sandbox/voice/",
 "content/help/","content/blog/"],
"home-wiring":[
 "src/app/(app)/dashboard/page.tsx","src/app/(app)/dashboard/loading.tsx","src/app/(app)/dashboard/actions.ts","src/app/(app)/dashboard/upgraded-toast.tsx",
 *dash_components,"src/lib/dashboard/","src/lib/db/queries/profile.ts","src/lib/db/queries/pulse.ts","src/app/(app)/layout.tsx",
 "src/components/app/user-menu.tsx","src/components/app/manage-billing-button.tsx","src/components/app/checkout-button.tsx",
 "src/app/(app)/account/","src/app/(guest)/u/",*social,"src/components/ui/table.tsx","src/components/ui/toggle-group.tsx"],
"hub-wiring":[
 "src/app/(app)/dashboard/[eventId]/","src/lib/event/","src/components/app/host-command-strip.tsx","src/components/app/event-feed/",
 "src/components/app/share/","src/components/app/event-share-dialog.tsx","src/components/app/event-qr.tsx","src/components/app/copy-share-link.tsx",
 "src/components/app/qr-designer-dialog.tsx","src/components/app/qr-preset-picker.tsx","src/components/app/styled-qr.tsx",
 "src/components/app/event-settings/","src/components/app/event-slug-control.tsx","src/components/app/recently-deleted-grid.tsx",
 "src/components/shared/app-shell.tsx","src/components/shared/crumbs.tsx","src/components/ui/sheet.tsx","src/components/ui/floating-layer.ts",
 "src/components/ui/floating-layer.test.ts"],
"glass-material":["src/app/(dev)/design/sandbox/glass/"],
"guest-verify":["src/app/(dev)/design/sandbox/guest-verify/"],
"notifications":["src/app/(dev)/design/sandbox/notifications/"],
"album-afterlife":["src/app/(dev)/design/sandbox/album-afterlife/"],
"host-insights":["src/app/(dev)/design/sandbox/host-insights/"],
"a11y-paths":["src/app/(dev)/design/sandbox/a11y-paths/"],
"album-find":["src/app/(dev)/design/sandbox/album-find/"],
"dark-surfaces":["src/app/(dev)/design/sandbox/dark-surfaces/"],
"buttons-pairs":["src/app/(dev)/design/sandbox/body-type/"],
"toasts":["src/app/(dev)/design/sandbox/toasts/"],
"home-states":["src/app/(dev)/design/sandbox/app-shape/"],
"overtaken":["src/app/(dev)/design/(shell)/lab/_desk/","src/app/(dev)/design/(shell)/lab/[board]/","src/components/lab/","src/app/(dev)/design/sandbox/overtaken.ts","src/app/(dev)/design/sandbox/overtaken.test.ts"],
}

OWNS.update({
"glass-wiring":["src/components/shared/masonry.tsx","src/components/shared/masonry.test.tsx","src/components/shared/media-lightbox.tsx","src/components/shared/media-lightbox.test.tsx","src/components/shared/media-lightbox.lazy.tsx","src/components/shared/lit-edge-contract.test.ts","src/components/shared/play-badge.tsx","src/components/shared/backdrop/photo-section.css",
 "src/components/app/media-grid.tsx","src/components/app/host-media-grid.tsx","src/components/app/recently-deleted-grid.tsx","src/components/app/my-uploads-gallery.tsx","src/components/app/my-likes-gallery.tsx","src/components/app/event-card.tsx","src/components/app/event-feed/selectable-media-grid.tsx",
 "src/components/likes/like-button.tsx","src/components/guest/guest-masonry.tsx","src/components/guest/guest-reel-overlay.tsx","src/app/(dev)/design/sandbox/glass/","src/app/globals.css","src/lib/glass.ts","src/lib/glass.test.ts","docs/systems/design-system.md"],
"guest-wiring":["src/components/guest/entry-shell.tsx","src/components/guest/entry-modal.tsx","src/components/guest/entry-modal.test.tsx","src/components/guest/entry-step-transition.tsx","src/components/guest/event-experience.tsx","src/components/guest/live-gallery.tsx","src/components/guest/live-gallery.css","src/components/guest/ghost-grid.tsx","src/components/guest/gallery-empty-state.tsx","src/components/guest/gallery-empty-state.test.tsx","src/components/guest/save-account-prompt.tsx","src/components/guest/guest-upload.tsx","src/components/guest/guest-share.tsx","src/components/guest/report-dialog.tsx",
 "src/components/ui/sheet.tsx","src/lib/guest/","src/lib/db/mutations/guest-media.ts","src/app/(guest)/e/[token]/","src/app/api/guests/gallery/route.ts","src/app/api/guests/remove/","src/app/api/guests/mine/","docs/systems/guest-flow.md"],
"door-wiring":["src/app/(auth)/","src/components/auth/","src/components/guest/enter-event-prompt.tsx","src/components/guest/save-event-button.tsx","src/components/likes/likes-provider.tsx","src/components/app/welcome-flow.tsx","src/app/(app)/welcome/","src/lib/supabase/client.ts","src/lib/env.ts","src/lib/auth/remembered-email.ts","src/lib/auth/door-failure.ts","src/lib/auth/remembered-email.test.ts","src/lib/auth/door-failure.test.ts","src/app/(app)/account/passkeys-card.tsx","src/app/(app)/account/passkeys-actions.ts","docs/systems/auth-accounts.md"],
"admin-wiring":["src/app/admin/page.tsx","src/app/admin/layout.tsx","src/app/admin/error.tsx","src/app/admin/not-found.tsx","src/app/admin/accounts/","src/app/admin/albums/","src/app/admin/applicants/","src/app/admin/announcements/","src/app/admin/exports/","src/app/admin/forensics/","src/app/admin/jobs/","src/app/admin/metrics/","src/app/admin/reels/","src/app/admin/security/","src/app/admin/support/",
 "src/components/admin/admin-shell.tsx","src/components/admin/admin-nav.tsx","src/components/admin/operator-alerts.tsx","src/components/admin/applicants-list.tsx","src/components/admin/announcement-compose.tsx","src/components/admin/announcement-list.tsx","src/components/admin/moderation-grid.tsx","src/components/admin/admin-bar.tsx","src/components/admin/admin-rail.tsx","src/components/admin/health-band.tsx","src/components/admin/admin-palette.tsx","src/components/admin/inbox-pane.tsx","src/components/admin/destructive-sheet.tsx","src/components/admin/queue-list.tsx","src/components/admin/sparkline.tsx","src/components/admin/metric-card.tsx","src/components/admin/metrics-charts.tsx","src/components/admin/metrics-charts.lazy.tsx","src/components/admin/support-list.tsx",
 "src/lib/admin/","src/lib/jobs/health-summary.ts","src/lib/db/queries/metrics.ts","src/components/ui/table.tsx","src/components/ui/table.test.tsx","src/components/ui/command-palette.tsx","src/components/ui/command-palette.test.tsx","src/components/ui/badge.tsx","src/app/(dev)/design/sandbox/admin/","docs/systems/admin-observability.md"],
"vocab-wiring":["src/app/(app)/dashboard/loading.tsx","src/app/(app)/dashboard/[eventId]/loading.tsx","src/app/(app)/dashboard/[eventId]/reel/loading.tsx","src/components/shared/route-skeleton.tsx","src/components/shared/route-skeleton.test.tsx",
 "src/components/app/event-feed/review-actions.tsx","src/components/app/event-feed/gallery-actions.tsx","src/components/app/event-feed/event-feed-action-bar.tsx","src/components/app/event-feed/event-gallery.tsx","src/components/app/event-feed/event-hub.test.tsx","src/components/app/event-feed/bulk-bar.tsx","src/components/app/event-feed/bulk-bar.test.tsx",
 "src/components/ui/tooltip.tsx","src/components/shared/action-tooltip.tsx","src/components/shared/tooltip-slide.tsx","src/components/ui/floating-layer.ts","src/components/ui/floating-layer.test.ts","src/components/providers.tsx","src/components/ui/confirm-switch.tsx","src/components/ui/confirm-switch.test.tsx","src/components/app/event-settings/uploads-section.tsx","src/components/shared/tile-size-control.tsx","src/components/shared/tile-size-control.test.tsx","src/lib/shared/use-tile-size.ts","src/lib/shared/tile-size-cookie.ts","docs/systems/host-app.md"],
"avatar-wiring":["src/components/ui/avatar.tsx","src/components/ui/avatar.test.tsx","src/lib/avatar/","src/app/(dev)/design/sandbox/seed-avatar/","src/components/social/","src/components/app/user-menu.tsx","src/components/app/account-avatar-form.tsx","src/components/guest/guest-account-menu.tsx","src/components/guest/guest-header.tsx","src/app/api/me/menu/","src/app/(app)/account/page.tsx","src/app/(guest)/u/","docs/systems/profiles-social.md"],
})

# the ladder's files: the grep minus the other lanes' files and prefixes, minus depicted and button files
grep=files("git grep -lE 'text-\\[(7|8|9|11|13|15|17)px\\]|text-\\[0\\.8rem\\]|tracking-\\[0\\.14em\\]' -- src ':!src/app/(dev)'")
others=[p for k,v in OWNS.items() for p in v]
depicted={"src/components/marketing/sections/how-it-works/host-pictures.tsx","src/components/marketing/sections/features/album/visibility-frames.tsx",
 "src/components/marketing/sections/features/privacy/access-switch.tsx","src/components/marketing/sections/features/guests/profiles-section.tsx",
 "src/components/marketing/press/press-sheet.tsx","src/components/marketing/help/help-emblems.tsx","src/components/marketing/sections/features/curation/review-switch.tsx"}
yaml=None
_orch=open("docs/tracks/orchestrator.md").read()
_fm=_orch.split("---")[1]
orch_owns=[l.strip()[2:].strip() for l in _fm.split("\n") if l.strip().startswith("- ") and ("src/" in l or "docs/" in l or "scripts/" in l or ".github" in l)]
def owned_by_other(f):
    return any(f==p or (p.endswith("/") and f.startswith(p)) for p in others+orch_owns) or f.startswith("src/components/dev/")
ladder=[f for f in grep if not owned_by_other(f) and f not in depicted and f!="src/components/ui/button.tsx" and not f.startswith("src/app/admin/") and not f.startswith("src/components/reel/")]
OWNS["ladder-wiring"]=["src/app/theme.css","src/app/globals.css","src/lib/utils.ts","src/lib/type-ladder-policy.test.ts",
 "src/components/marketing/system/eyebrow.tsx","src/components/marketing/system/caption.tsx","src/app/admin/","src/components/reel/",
 "src/lib/reel/engine/player.tsx","src/app/(dev)/design/(shell)/library/foundations/type-ladder.tsx",*sorted(set(ladder))]
# collision check
allp=[(k,p) for k,v in OWNS.items() for p in v]
for i,(k1,p1) in enumerate(allp):
    for k2,p2 in allp[i+1:]:
        if k1!=k2 and (p1==p2 or (p1.endswith("/") and p2.startswith(p1)) or (p2.endswith("/") and p1.startswith(p2))):
            print("OVERLAP", k1, p1, k2, p2)
READS={
"voice-wiring":["src/app/(dev)/design/rules/bible.ts","docs/reviews/voice.json","docs/design/rulings.md","src/components/marketing/system/page-hero.tsx","src/lib/constants/tiers.ts","src/components/app/create-event-wizard.tsx","src/app/(guest)/e/[token]/not-found.tsx"],
"ladder-wiring":["docs/reviews/body-type.json","docs/design/rulings.md","src/app/(dev)/design/sandbox/body-type/","src/components/ui/button.tsx","docs/systems/design-system.md"],
"home-wiring":["src/components/shared/app-shell.tsx","docs/reviews/app-shape.json","src/app/(dev)/design/sandbox/app-shape/","src/lib/constants/tiers.ts","docs/systems/billing-caps.md","docs/systems/profiles-social.md","src/components/app/event-share-dialog.tsx","src/lib/event/","src/components/app/dashboard/events-empty-teaser.tsx","src/components/social/guest-list.tsx"],
"hub-wiring":["src/components/social/guest-list.tsx","src/components/app/host-media-grid.tsx","src/components/shared/masonry.tsx","src/components/shared/media-lightbox.tsx","src/components/app/reel-panel.tsx","src/components/reel/","src/components/app/export/","src/lib/constants/tiers.ts","docs/reviews/app-shape.json","src/app/(dev)/design/sandbox/app-shape/","src/components/marketing/system/morph-delegate.tsx","src/app/(app)/layout.tsx","docs/systems/host-app.md"],
"album-afterlife":["docs/systems/lifecycle-recovery.md","docs/systems/billing-caps.md","src/app/api/cron/purge/route.ts","src/lib/email/templates.ts","src/components/guest/save-event-button.tsx","src/components/app/export/export-dialog.tsx","src/app/(guest)/u/[slug]/page.tsx","src/app/(dev)/design/sandbox/emails/spec.ts","src/app/(dev)/design/sandbox/export-flow/spec.ts","docs/design/rulings.md"],
"host-insights":["src/lib/db/queries/metrics.ts","src/components/admin/metrics-charts.tsx","src/lib/analytics/events.ts","src/components/social/guest-list.tsx","src/components/likes/like-button.tsx","src/app/(app)/dashboard/[eventId]/page.tsx","src/app/(dev)/design/sandbox/admin/spec.ts","src/app/(dev)/design/sandbox/app-shape/spec.ts","docs/design/rulings.md"],
"a11y-paths":["src/components/shared/media-lightbox.tsx","src/components/shared/kbd.tsx","src/components/shared/masonry.tsx","src/components/guest/entry-modal.tsx","src/components/guest/guest-bar.tsx","src/components/ui/floating-layer.ts","src/components/marketing/help/help-palette.tsx","src/app/(dev)/design/sandbox/host-curation/spec.ts","src/app/(dev)/design/sandbox/media-viewer/spec.ts","docs/systems/testing-verification.md","docs/design/rulings.md"],
"notifications":["src/components/app/notification-bell.tsx","src/lib/notifications/build.ts","src/components/app/notification-prefs-form.tsx","src/lib/social/notification-prefs.ts","src/app/admin/announcements/page.tsx","src/components/admin/announcement-compose.tsx","src/components/admin/announcement-list.tsx","docs/systems/notifications-analytics-growth.md","src/app/(dev)/design/sandbox/emails/spec.ts","src/app/(dev)/design/sandbox/app-shape/spec.ts","docs/design/rulings.md"],
"album-find":["src/components/guest/live-gallery.tsx","src/components/guest/guest-masonry.tsx","src/components/shared/masonry.tsx","src/components/app/event-feed/event-filter-pills.tsx","src/components/social/guest-list.tsx","src/app/api/guests/gallery/route.ts","docs/systems/guest-flow.md","docs/systems/uploads-and-r2.md","src/app/(dev)/design/sandbox/app-vocabulary/spec.ts","src/app/(dev)/design/sandbox/guest-shape/spec.ts","docs/design/rulings.md"],
"dark-surfaces":["src/components/providers.tsx","src/components/app/user-menu.tsx","src/app/globals.css","src/app/theme.css","src/app/globals-theme-contract.test.ts","docs/systems/design-system.md","docs/design/rulings.md"],
"guest-verify":["docs/systems/guest-flow.md","docs/systems/auth-accounts.md","docs/systems/database-security.md","src/components/guest/enter-event-prompt.tsx","src/components/auth/email-sign-in.tsx","src/components/guest/entry-modal.tsx","src/components/app/event-settings/uploads-section.tsx","src/lib/media/uploader-identity.ts","src/components/social/guest-list.tsx","src/app/(dev)/design/sandbox/seed-avatar/gradient.ts","docs/design/rulings.md"],
"buttons-pairs":["docs/reviews/body-type.json","docs/design/rulings.md","src/components/ui/button.tsx","src/components/app/export/download-all-button.tsx","src/components/app/event-feed/gallery-actions.tsx","src/components/guest/live-gallery.tsx"],
"toasts":["src/components/ui/sonner.tsx","src/app/layout.tsx","src/app/globals.css","src/components/guest/guest-upload.tsx","src/components/app/event-feed/event-feed-action-bar.tsx","src/app/(dev)/design/sandbox/guest-upload/spec.ts","src/app/(dev)/design/sandbox/host-curation/spec.ts","src/app/(dev)/design/sandbox/export-flow/spec.ts","src/app/(dev)/design/sandbox/app-pricing/spec.ts","docs/design/rulings.md"],
"home-states":["docs/reviews/app-shape.json","docs/design/rulings.md","src/app/(app)/dashboard/page.tsx","src/components/app/dashboard/","src/lib/dashboard/"],
"overtaken":["scripts/lab-review.mjs","docs/reviews/README.md","docs/reviews/","docs/design/rulings.md","src/app/(dev)/design/touchpoints.ts","src/app/(dev)/design/sandbox/registry.ts","src/app/(dev)/design/review/ledger.ts","src/app/(dev)/design/review/status.ts"],
"glass-material":["docs/reviews/glass.json","docs/design/rulings.md","src/components/shared/media-lightbox.tsx","src/components/app/host-media-grid.tsx","src/components/guest/guest-reel-overlay.tsx","src/components/ui/floating-layer.ts","src/components/guest/guest-bar.tsx","src/components/likes/like-button.tsx","src/components/guest/guest-masonry.tsx"],
}
BOARD={"album-afterlife":"album-afterlife # a new board: after first-event at the merge","host-insights":"host-insights   # a new board: after host-curation at the merge","a11y-paths":"a11y-paths      # a new board: after app-vocabulary at the merge","notifications":"notifications   # a new board: registers at the head of DESK_ORDER, the Orchestrator moves it after app-vocabulary","album-find":"album-find      # a new board: after guest-shape at the merge","dark-surfaces":"dark-surfaces   # a new board: after glass at the merge","guest-verify":"guest-verify    # a new board: registers at the head of DESK_ORDER, the Orchestrator moves it after guest-shape","buttons-pairs":"body-type       # round two on the same board id, the buttons rung alone","toasts":"toasts          # a new board: registers at the head of DESK_ORDER, the Orchestrator moves it after app-vocabulary","home-states":"app-shape       # round two on the same board id, the home across host states","overtaken":"none            # lab infrastructure: the overtaken mechanism and the judgment lines; no board of its own","voice-wiring":"voice           # retires at this lane's merge","ladder-wiring":"body-type       # six rungs wired here; the buttons rung is round two's, another lane","home-wiring":"app-shape       # wiring; the board itself is round two's, another lane","hub-wiring":"app-shape       # wiring; the board itself is round two's, another lane","glass-material":"glass           # round two on the same board id"}
LANE_SECTION={"album-afterlife":r"Lane 14: `album-afterlife`","host-insights":r"Lane 15: `host-insights`","a11y-paths":r"Lane 16: `a11y-paths`","notifications":r"Lane 11: `notifications`","album-find":r"Lane 12: `album-find`","dark-surfaces":r"Lane 13: `dark-surfaces`","guest-verify":r"Lane 5: `guest-verify`","buttons-pairs":r"Lane 4: `body-type` round two on `buttons`","toasts":r"Lane 6: `toasts`","home-states":r"Lane 9: `app-shape` round two on the home","overtaken":r"Lane 10: `overtaken`","voice-wiring":r"Lane 1: `voice-wiring`","ladder-wiring":r"Lane 2: `ladder-wiring`","home-wiring":r"Lane 7: `home-wiring`","hub-wiring":r"Lane 8: `hub-wiring`","glass-material":r"Lane 3: `glass-material`"}
VERDICTS=section(r"The verdict map \(every answer, what it becomes; the option")
READS.update({
"glass-wiring":["docs/reviews/glass.json","docs/design/rulings.md","src/components/ui/floating-layer.ts","src/components/ui/dialog.tsx","src/components/shared/action-tooltip.tsx","src/components/admin/moderation-grid.tsx"],
"guest-wiring":["docs/reviews/guest-shape.json","docs/design/rulings.md","src/components/guest/enter-event-prompt.tsx","src/components/guest/guest-masonry.tsx","src/components/shared/masonry.tsx","src/components/shared/media-lightbox.tsx","src/lib/db/types.ts","supabase/migrations/20260609150000_remove_my_upload.sql","supabase/migrations/20260920090000_remove_my_upload_by_session.sql","docs/systems/database-security.md","src/app/(dev)/design/sandbox/guest-shape/"],
"door-wiring":["docs/reviews/app-door.json","docs/design/rulings.md","src/components/guest/entry-modal.tsx","src/components/guest/entry-shell.tsx","src/components/guest/save-account-prompt.tsx","src/app/admin/layout.tsx","src/components/admin/mfa-challenge.tsx","src/lib/constants/marketing-media.ts","src/app/(dev)/design/sandbox/app-door/"],
"admin-wiring":["docs/reviews/admin.json","docs/design/rulings.md","src/app/admin/reports/","src/components/app/report-review.tsx","src/components/admin/triage-status-control.tsx","src/lib/moderation/","src/components/ui/sheet.tsx","src/app/(dev)/design/sandbox/help-center/","src/lib/content/help-search-rank.ts","src/app/(dev)/design/sandbox/admin-triage/spec.ts"],
"vocab-wiring":["docs/reviews/app-vocabulary.json","docs/design/rulings.md","src/components/shared/masonry.tsx","src/components/ui/navigation-menu.tsx","src/app/(marketing)/marketing.css",".claude/skills/transitions-dev/08-page-side-by-side.md","src/lib/dashboard/events-view.ts","src/app/(dev)/design/sandbox/app-vocabulary/"],
"avatar-wiring":["docs/reviews/seed-avatar.json","docs/design/rulings.md","src/lib/supabase/avatar-storage.ts","src/components/guest/event-experience.tsx","src/components/guest/entry-modal.tsx","src/app/(app)/layout.tsx","src/app/(guest)/e/[token]/page.tsx"],
})
BOARD.update({"glass-wiring":"glass           # retires at this lane's merge","guest-wiring":"guest-shape     # wiring; round two on the chrome and the welcome is another lane","door-wiring":"app-door        # wiring; round two on the welcome tour is another lane","admin-wiring":"admin           # retires at this lane's merge (the fixtures survive as a Library demo)","vocab-wiring":"app-vocabulary  # wiring; round two on the gallery's controls is another lane","avatar-wiring":"seed-avatar     # wiring; round two on the look is another lane"})
LANE_SECTION.update({"glass-wiring":r"Lane 1: `glass-wiring`","guest-wiring":r"Lane 2: `guest-wiring`","door-wiring":r"Lane 3: `door-wiring`","admin-wiring":r"Lane 4: `admin-wiring`","vocab-wiring":r"Lane 5: `vocab-wiring`","avatar-wiring":r"Lane 6: `avatar-wiring`"})

# Tonight's explorations (the night, second): lab-only boards on surfaces no open ask can reach.
EXPLORE={"venue-screen":"Opus","pwa-install":"Sonnet","legal-reading":"Sonnet","about-page":"Sonnet","blog-reading":"Sonnet","og-cards":"Sonnet","feature-anatomy":"Sonnet","llms-surface":"Sonnet","host-insights":"Sonnet"}
for _t in EXPLORE:
    OWNS.setdefault(_t, [f"src/app/(dev)/design/sandbox/{_t}/"])
    READS.setdefault(_t, ["docs/design/rulings.md","src/app/(dev)/design/touchpoints.ts","docs/STATUS.md"])
    BOARD.setdefault(_t, f"{_t:<15} # a new board: registers at the head of DESK_ORDER; the Orchestrator moves it into its leverage place at the merge")
LANE_SECTION.update({"venue-screen":r"Lane 21: `venue-screen`","pwa-install":r"Lane 22: `pwa-install`","legal-reading":r"Lane 23: `legal-reading`","about-page":r"Lane 24: `about-page`","blog-reading":r"Lane 25: `blog-reading`","og-cards":r"Lane 26: `og-cards`","feature-anatomy":r"Lane 27: `feature-anatomy`","llms-surface":r"Lane 28: `llms-surface`"})
EXPLORE_TEXT="""**Goal.** A lab-only EXPLORATION cut on the night of 2026-09-20 under Will's standing instruction (verbatim in `docs/design/rulings.md`, "the night" and "the night, second"): a surface no open board has asked about, drawn as a catalog he selects from; every option on the real surface with fixtures, phone first; no production byte. Its questions were checked against every ask still open on the desk so that answering what is left cannot shift them. Read the brief end to end before the first edit; where it says recommended, draw that option first and say why in the spec's `because`."""


QUEUE={"overtaken-2","guest-shape-r2"}
OWNS.update({"overtaken-2":["src/app/(dev)/design/sandbox/overtaken.ts","src/app/(dev)/design/sandbox/overtaken.test.ts"],"guest-shape-r2":["src/app/(dev)/design/sandbox/guest-shape/"]})
READS.update({"overtaken-2":["docs/design/rulings.md","docs/reviews/","src/app/(dev)/design/touchpoints.ts","src/app/(dev)/design/sandbox/registry.ts","src/app/(dev)/design/(shell)/lab/_desk/","src/components/lab/"],
              "guest-shape-r2":["docs/reviews/guest-shape.json","docs/reviews/demo-event.json","docs/design/rulings.md","src/components/guest/event-experience.tsx","src/components/guest/live-gallery.tsx","src/components/guest/entry-modal.tsx","src/components/guest/entry-shell.tsx","src/components/guest/guest-masonry.tsx","src/components/shared/floating-add-button.tsx","src/app/(dev)/design/sandbox/demo-event/"]})
BOARD.update({"overtaken-2":"none            # lab infrastructure: the judgment lines for the sixth batch's reach; no board of its own","guest-shape-r2":"guest-shape     # round two on the same board id: the chrome, the welcome, where a guest finds theirs"})
LANE_SECTION.update({"overtaken-2":r"Lane 29: `overtaken-2`","guest-shape-r2":r"Lane 30: `guest-shape-r2`"})
QUEUE_TEXT="**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, \"The queue after wave one\"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, \"the sixth batch\"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first."


QUEUE.add("welcome-tour")
OWNS.update({"welcome-tour":["src/app/(dev)/design/sandbox/app-door/"]})
READS.update({"welcome-tour":["docs/reviews/app-door.json","docs/design/rulings.md","src/components/app/welcome-flow.tsx","src/lib/constants/how-it-works.ts","src/components/marketing/sections/how-it-works/","src/app/(app)/welcome/"]})
BOARD.update({"welcome-tour":"app-door        # round two on the same board id: the welcome tour's design"})
LANE_SECTION.update({"welcome-tour":r"Lane 31: `welcome-tour`"})


QUEUE.update({"album-controls","avatar-look","pricing-fit","demo-doors"})
OWNS.update({"album-controls":["src/app/(dev)/design/sandbox/app-vocabulary/"],"avatar-look":["src/app/(dev)/design/sandbox/seed-avatar/"],"pricing-fit":["src/app/(dev)/design/sandbox/pricing-page/"],"demo-doors":["src/app/(dev)/design/sandbox/demo-event/"]})
READS.update({"album-controls":["docs/reviews/app-vocabulary.json","docs/design/rulings.md","src/components/app/event-feed/event-gallery.tsx","src/components/shared/tile-size-control.tsx","src/components/app/event-feed/event-cards-row.tsx","src/components/ui/sheet.tsx"],
              "avatar-look":["docs/reviews/seed-avatar.json","docs/design/rulings.md","src/lib/avatar/","src/components/ui/avatar.tsx","src/components/social/guest-list.tsx"],
              "pricing-fit":["docs/reviews/pricing-page.json","docs/design/rulings.md","src/components/marketing/sections/pricing/","src/lib/constants/tiers.ts"],
              "demo-doors":["docs/reviews/demo-event.json","docs/design/rulings.md","src/components/marketing/chrome/marketing-footer.tsx","src/components/marketing/system/demo-ticket.tsx","src/components/marketing/sections/home/live-demo.tsx","src/components/shared/album-stream/"]})
BOARD.update({"album-controls":"app-vocabulary  # round two on the same board id: where the host gallery's controls live","avatar-look":"seed-avatar     # round two on the same board id: the look","pricing-fit":"pricing-page    # round two on the same board id: find your plan size, and the phone row","demo-doors":"demo-event      # round two on the same board id: the door"})
LANE_SECTION.update({"album-controls":r"Lane 32: `album-controls`","avatar-look":r"Lane 33: `avatar-look`","pricing-fit":r"Lane 34: `pricing-fit`","demo-doors":r"Lane 35: `demo-doors`"})


QUEUE.add("help-sync")
OWNS.update({"help-sync":["content/help/","src/lib/constants/legal-privacy.tsx","src/lib/constants/legal-terms.tsx","src/lib/content/help.ts"]})
READS.update({"help-sync":["docs/design/rulings.md","docs/systems/guest-flow.md","docs/systems/auth-accounts.md","docs/systems/host-app.md","src/components/auth/","src/components/guest/","src/app/(app)/dashboard/[eventId]/"]})
BOARD.update({"help-sync":"none            # production follow-up: the help articles the wiring lanes made stale; no board"})
LANE_SECTION.update({"help-sync":r"Lane 36: `help-sync`"})


QUEUE.add("type-sync")
OWNS.update({"type-sync":["src/lib/type-ladder-policy.test.ts",
  # the body allow-list's `lane` entries at the cut (2026-09-20, read from the test): nine files no manifest owns now
  "src/components/marketing/chrome/marketing-footer.tsx","src/components/guest/enter-event-prompt.tsx",
  "src/components/marketing/sections/home/pricing-teaser.tsx","src/components/marketing/sections/features/album/how-much-fits.tsx",
  "src/components/marketing/sections/home/no-app.tsx","src/components/marketing/sections/events/event-statement.tsx",
  "src/components/marketing/sections/features/qr/qr-hero.tsx","src/components/marketing/sections/reel/reel-hero.tsx",
  "src/components/marketing/sections/reel/wysiwyg-section.tsx",
  # the `pending` entries (hub-wiring's two, still standing) and the app-shape lanes' files for the mechanical step-name swap
  "src/components/app/","src/app/(app)/"]})
READS.update({"type-sync":["src/app/theme.css","docs/systems/design-system.md","docs/reviews/body-type.json","docs/design/rulings.md","src/lib/utils.ts"]})
BOARD.update({"type-sync":"none            # production follow-up: the ladder's body scan closes and the step names land; no board"})
LANE_SECTION.update({"type-sync":r"Lane 37: `type-sync`"})

SIXTH={"glass-wiring","guest-wiring","door-wiring","admin-wiring","vocab-wiring","avatar-wiring"}
OWNS.update({
"pricing-wiring":["src/app/(marketing)/(cinema)/pricing/","src/components/marketing/sections/pricing/","docs/systems/marketing-content.md"],
"demo-wiring":["src/components/guest/entry-modal.tsx","src/components/guest/event-experience.tsx","src/components/guest/guest-header.tsx","src/components/guest/guest-upload.tsx","src/components/marketing/chrome/marketing-footer.tsx","src/components/marketing/system/demo-ticket.tsx","src/components/marketing/sections/home/live-demo.tsx","src/lib/demo.ts"],
})
READS.update({
"pricing-wiring":["docs/reviews/pricing-page.json","docs/design/rulings.md","src/lib/constants/tiers.ts","src/lib/constants/marketing-voice.ts","src/app/(dev)/design/sandbox/pricing-page/"],
"demo-wiring":["docs/reviews/demo-event.json","docs/design/rulings.md","src/lib/guest/use-gallery-doorbell.ts","src/components/guest/live-gallery.tsx","src/app/(dev)/design/sandbox/demo-event/","docs/systems/guest-flow.md"],
})
BOARD.update({"pricing-wiring":"pricing-page    # wiring six of eight; round two on fit and the phone row is another lane","demo-wiring":"demo-event      # wiring six of seven; round two on the doors is another lane"})
LANE_SECTION.update({"pricing-wiring":r"Lane 7: `pricing-wiring`","demo-wiring":r"Lane 8: `demo-wiring`"})
SIXTH.update({"pricing-wiring","demo-wiring"})

VERDICTS6=section(r"The verdict map \(every answer, what it becomes\)\n")
SMALL6=section(r"The small batch, synthesized")
SEAM6=section(r"The seam, landed by the Orchestrator")

CONTEXT=section(r"Context")
for track in (sys.argv[2].split(",") if len(sys.argv)>2 else ["voice-wiring","ladder-wiring","home-wiring","hub-wiring","glass-material","overtaken"]):
    body=section(LANE_SECTION[track])
    goal=body.split("\n",1)[1].strip()
    owns="\n".join(f"  - {p}" for p in OWNS[track]); reads="\n".join(f"  - {p}" for p in READS[track])
    doc=f"""---
track: {track}
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "{CUT}"          # the launch-prep SHA the branch was cut from
board: {BOARD[track]}
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
{owns}
reads:                  # single-sources you depend on: never duplicate, never edit
{reads}
---

# lp/{track}

{EXPLORE_TEXT if track in EXPLORE else QUEUE_TEXT if track in QUEUE else "**Goal.** " + ("Will's sixth batch (2026-09-20, build `806695d`) answered the next five boards on the desk and glass round two, and a second paste the same hour answered the demo and the pricing page; this lane is one of eight cut from them, on the seam the Orchestrator landed first." if track in SIXTH else "Will's fifth batch (2026-09-19, build `69a9a17`) answered the four boards at the head of the desk; this lane is one of ten cut from it.")} His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section {'"the sixth batch"' if track in SIXTH else '"the fifth batch"'}); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at {'`806695d1`' if track in SIXTH else '`69a9a177`'})

{goal}

## The verdict map (every answer of the batch; this lane wires only its own board's)

{'(no verdict map: an exploration asks; the rules of the exploration shape are in docs/PROGRAM.md and the board precedents in src/app/(dev)/design/sandbox/)' if track in EXPLORE else VERDICTS6.split(chr(10),1)[1].strip() if track in QUEUE else (VERDICTS6 if track in SIXTH else VERDICTS).split(chr(10),1)[1].strip()}{chr(10)+chr(10)+SEAM6+chr(10)+chr(10)+SMALL6 if track in SIXTH else ''}

## The ownership rules every lane follows this round

{rules.split(chr(10),1)[1].strip()}

**Binds.** The bible (`/design/library`), the contracts of every component under a path you own, and the policies;
Will's notes in the ledger and rulings.md; the ownership rules above; CLAUDE.md's working loop (doc-check via Context7
first: Next 16, Tailwind v4, zod v4 and Supabase SSR drift). `DESIGN_PREVIEW_KEY` rides the environment, never a command
line. Never edit a record doc (`docs/CHANGELOG.md`, `STATUS.md`, `ROADMAP.md`, `ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/design/rulings.md`, `docs/reviews/`); a `docs/systems/` fact inside your lane is refined in place and listed below.
Stage explicitly; never `--no-verify` or force-push; the `Co-Authored-By` trailer on every commit.

**Verify on.** For a production lane: the gate on the synced tree (`pnpm design:rules`, the specimen collector
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` with the 8 known warnings, `pnpm test`,
`pnpm build`), each on its own exit code; `pnpm lab:smoke --base http://localhost:<your port>` whole; the surfaces the Handoff is
judged on, local at 1440 and 375 (the Orchestrator red-teams them on the alias). For a lab lane: the board at 1440 and 375 with
reduced motion honoured, `pnpm lab:smoke` whole, `pnpm lab:demo --board <board> --base http://localhost:<your port>` pressing
every step (a backdrop-filter step reports UNPAINTED in headless Chrome: capture it by hand and say so). One process at a
time on this machine; your dev server on your own port, killed by port before a build, a test run and the handoff.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Every claim below (a retirement, a migration, a gate, a fix) names its artifact (a commit hash, a log line, a file path), so
  the Orchestrator checks rather than believes; a claim with no artifact is read as unverified.
- Gates on the synced tree: design:rules ok, specimens ok, typecheck ok, lint ok (8 known), test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board <board>` ok (a board)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each: `<id>: <the builder's verdict>; a kept one becomes <the Library entry it lands as>`
- Calls his to overrule on the alias, one line each
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them)
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
"""
    open(f"docs/tracks/{track}.md","w").write(doc)
    print(track, "owns", len(OWNS[track]), "lines", len(doc.split("\n")))
