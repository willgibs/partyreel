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
# the closing sitting's wiring lanes (2026-09-20 evening), cut only for the verdicts that ask for them
QUEUE.update({"avatar-mesh-wiring","buttons-wiring","pricing-split-wiring","demo-frame-wiring","home-states-wiring","guest-chrome-wiring","welcome-film-wiring","controls-home-wiring"})
OWNS.update({"avatar-mesh-wiring":['src/lib/avatar/', 'src/app/(dev)/design/sandbox/seed-avatar/', 'docs/systems/auth-accounts.md'],"buttons-wiring":['src/components/ui/button.tsx', 'src/lib/type-ladder-policy.test.ts', 'src/app/(dev)/design/sandbox/body-type/', 'docs/systems/design-system.md'],"pricing-split-wiring":['src/components/marketing/sections/pricing/', 'src/app/(dev)/design/sandbox/pricing-page/', 'docs/systems/marketing-content.md'],"demo-frame-wiring":['src/components/marketing/system/demo-ticket.tsx', 'src/components/marketing/sections/home/cinema-hero.tsx', 'src/components/marketing/chrome/marketing-footer.tsx', 'src/components/marketing/chrome/mega-panel.tsx', 'src/components/marketing/system/demo-cta-link.tsx', 'src/app/(dev)/design/sandbox/demo-event/', 'docs/systems/marketing-content.md'],"home-states-wiring":['src/components/app/dashboard/', 'src/app/(app)/dashboard/page.tsx', 'docs/systems/host-app.md'],"guest-chrome-wiring":['src/components/guest/', 'src/app/(dev)/design/sandbox/guest-shape/', 'docs/systems/guest-flow.md'],"welcome-film-wiring":['src/components/app/welcome-flow.tsx', 'src/app/(app)/welcome/', 'src/app/(dev)/design/sandbox/app-door/'],"controls-home-wiring":['src/components/app/event-feed/event-gallery.tsx', 'src/components/shared/tile-size-control.tsx', 'src/lib/shared/use-tile-size.ts', 'src/app/(dev)/design/sandbox/app-vocabulary/']})
READS.update({"avatar-mesh-wiring":['src/components/ui/avatar.tsx', 'src/components/social/guest-list.tsx', 'docs/reviews/seed-avatar.json', 'docs/design/rulings.md'],"buttons-wiring":['src/components/app/export/download-all-button.tsx', 'src/components/app/event-feed/gallery-actions.tsx', 'docs/reviews/body-type.json', 'docs/design/rulings.md'],"pricing-split-wiring":['src/lib/constants/tiers.ts', 'src/lib/constants/marketing-voice.ts', 'docs/reviews/pricing-page.json', 'docs/design/rulings.md'],"demo-frame-wiring":['src/components/marketing/sections/home/live-demo.tsx', 'docs/reviews/demo-event.json', 'docs/design/rulings.md'],"home-states-wiring":['src/lib/dashboard/', 'src/app/(dev)/design/sandbox/app-shape/', 'docs/reviews/app-shape.json', 'docs/design/rulings.md'],"guest-chrome-wiring":['src/components/shared/masonry.tsx', 'src/lib/guest/', 'docs/reviews/guest-shape.json', 'docs/design/rulings.md'],"welcome-film-wiring":['src/lib/constants/how-it-works.ts', 'src/components/marketing/sections/how-it-works/', 'docs/reviews/app-door.json', 'docs/design/rulings.md'],"controls-home-wiring":['src/components/app/event-feed/event-cards-row.tsx', 'src/components/ui/sheet.tsx', 'docs/reviews/app-vocabulary.json', 'docs/design/rulings.md']})
BOARD.update({"avatar-mesh-wiring":"seed-avatar     # wired by this lane; the board retires unless his verdicts keep it open","buttons-wiring":"body-type       # wired by this lane; the board retires unless his verdicts keep it open","pricing-split-wiring":"pricing-page    # wired by this lane; the board retires unless his verdicts keep it open","demo-frame-wiring":"demo-event      # wired by this lane; the board retires unless his verdicts keep it open","home-states-wiring":"app-shape       # wired by this lane; the board retires unless his verdicts keep it open","guest-chrome-wiring":"guest-shape     # wired by this lane; the board retires unless his verdicts keep it open","welcome-film-wiring":"app-door        # wired by this lane; the board retires unless his verdicts keep it open","controls-home-wiring":"app-vocabulary  # wired by this lane; the board retires unless his verdicts keep it open"})
LANE_SECTION.update({"avatar-mesh-wiring":r"Lane 38: `avatar-mesh-wiring`","buttons-wiring":r"Lane 39: `buttons-wiring`","pricing-split-wiring":r"Lane 40: `pricing-split-wiring`","demo-frame-wiring":r"Lane 41: `demo-frame-wiring`","home-states-wiring":r"Lane 42: `home-states-wiring`","guest-chrome-wiring":r"Lane 43: `guest-chrome-wiring`","welcome-film-wiring":r"Lane 44: `welcome-film-wiring`","controls-home-wiring":r"Lane 45: `controls-home-wiring`"})

# the closing sitting's first batch (2026-09-20 18:20 EDT): the verdicts' deltas on the drafted owns, and two new lanes
QUEUE.update({"overtaken-3","guest-verify-r2"})
OWNS.update({
"guest-chrome-wiring":["src/components/guest/","src/components/shared/masonry.tsx","src/components/shared/masonry.test.tsx","src/components/shared/floating-add-button.tsx","src/app/(dev)/design/sandbox/guest-shape/","docs/systems/guest-flow.md"],
"controls-home-wiring":["src/components/app/event-feed/event-gallery.tsx","src/components/shared/tile-size-control.tsx","src/components/shared/view-menu.tsx","src/lib/shared/use-tile-size.ts","src/lib/shared/tile-size-cookie.ts","src/app/(dev)/design/sandbox/app-vocabulary/"],
"home-states-wiring":["src/components/app/dashboard/","src/app/(app)/dashboard/page.tsx","src/lib/dashboard/","src/app/(dev)/design/sandbox/app-shape/","docs/systems/host-app.md"],
"overtaken-3":["src/app/(dev)/design/sandbox/overtaken.ts","src/app/(dev)/design/sandbox/overtaken.test.ts"],
"guest-verify-r2":["src/app/(dev)/design/sandbox/guest-verify/"],
})
READS.update({
"guest-chrome-wiring":["src/lib/guest/","src/app/api/guests/mine/route.ts","src/components/ui/sheet.tsx","src/components/ui/dialog.tsx","src/components/app/media-grid.tsx","docs/reviews/guest-shape.json","docs/design/rulings.md"],
"controls-home-wiring":["src/components/ui/dropdown-menu.tsx","src/components/app/dashboard/events-section.tsx","src/components/app/event-feed/event-cards-row.tsx","src/components/ui/floating-layer.ts","docs/reviews/app-vocabulary.json","docs/design/rulings.md"],
"home-states-wiring":["docs/reviews/app-shape.json","docs/design/rulings.md"],
"overtaken-3":["docs/design/rulings.md","docs/reviews/","src/app/(dev)/design/touchpoints.ts","src/app/(dev)/design/sandbox/registry.ts","src/app/(dev)/design/(shell)/lab/_desk/","src/components/lab/"],
"guest-verify-r2":["docs/systems/guest-flow.md","docs/systems/auth-accounts.md","docs/systems/database-security.md","docs/systems/billing-caps.md","src/lib/constants/tiers.ts","supabase/migrations/","src/components/auth/account-door.tsx","src/components/auth/email-sign-in.tsx","src/lib/auth/door-failure.ts","src/lib/auth/remembered-email.ts","src/components/guest/enter-event-prompt.tsx","src/components/guest/entry-modal.tsx","src/components/guest/save-account-prompt.tsx","src/lib/guest/","src/lib/media/uploader-identity.ts","src/components/social/guest-list.tsx","src/components/shared/media-lightbox.tsx","docs/reviews/guest-verify.json","docs/design/rulings.md"],
})
BOARD.update({"overtaken-3":"none            # lab infrastructure: the judgment lines for the closing sitting's first batch; no board of its own","guest-verify-r2":"guest-verify    # round two on the same board id: the identity shape whole; round one's four rulings held"})
LANE_SECTION.update({"overtaken-3":r"Lane 46: `overtaken-3`","guest-verify-r2":r"Lane 47: `guest-verify` round two"})

# the toasts verdicts (2026-09-20 20:05 EDT): the board's wiring lane
QUEUE.update({"toasts-wiring"})
OWNS.update({"toasts-wiring":["src/components/ui/sonner.tsx","src/app/globals.css","src/lib/toast.ts","src/app/(dev)/design/sandbox/toasts/","docs/systems/design-system.md"]})
READS.update({"toasts-wiring":["src/components/ui/floating-layer.ts","src/components/shared/app-shell.tsx","src/components/guest/guest-header.tsx","docs/reviews/toasts.json","docs/design/rulings.md"]})
BOARD.update({"toasts-wiring":"toasts          # wired by this lane; the board retires (its five asks ruled whole)"})
LANE_SECTION.update({"toasts-wiring":r"Lane 48: `toasts-wiring`"})

# the guest View menu follow-up (2026-09-20 20:25 EDT): the mount guest-chrome-wiring lost with its worktree
QUEUE.update({"guest-view-menu"})
OWNS.update({"guest-view-menu":["src/components/guest/live-gallery.tsx","src/app/(guest)/e/[token]/page.tsx","src/app/(guest)/e/[token]/actions.ts","docs/systems/guest-flow.md"]})
READS.update({"guest-view-menu":["src/components/shared/view-menu.tsx","src/lib/shared/tile-size-cookie.ts","src/components/app/event-feed/event-gallery.tsx","src/app/(app)/dashboard/[eventId]/page.tsx","src/components/shared/masonry.tsx","src/components/guest/guest-masonry.tsx","docs/design/rulings.md"]})
BOARD.update({"guest-view-menu":"none            # a production follow-up of guest-chrome-wiring (guest-shape retired at fd42c759); no board"})
LANE_SECTION.update({"guest-view-menu":r"Lane 49: `guest-view-menu`"})

# the closing sitting's second batch (2026-09-20 ~22:45 EDT): the owns deltas on four drafted lanes, and two new lanes
QUEUE.update({"app-pricing-wiring","overtaken-4"})
OWNS.update({
"avatar-mesh-wiring":["src/lib/avatar/","src/components/ui/avatar.tsx","src/app/(dev)/design/sandbox/seed-avatar/","docs/systems/auth-accounts.md"],
"pricing-split-wiring":["src/components/marketing/sections/pricing/","src/app/(marketing)/(cinema)/pricing/page.tsx","src/app/(dev)/design/sandbox/pricing-page/","docs/systems/marketing-content.md"],
"demo-frame-wiring":["src/components/marketing/system/demo-ticket.tsx","src/components/marketing/sections/home/cinema-hero.tsx","src/components/marketing/chrome/marketing-footer.tsx","src/components/marketing/chrome/mega-panel.tsx","src/components/marketing/system/demo-cta-link.tsx","src/components/marketing/chrome/footer-demo.tsx","src/app/(dev)/design/sandbox/demo-event/"],
"welcome-film-wiring":["src/components/app/welcome-flow.tsx","src/components/app/welcome-flow.css","src/app/(app)/welcome/","src/app/(dev)/design/sandbox/app-door/","docs/systems/host-app.md"],
"app-pricing-wiring":["src/components/app/pricing/","src/components/app/user-menu.tsx","src/components/app/checkout-button.tsx","src/components/app/manage-billing-button.tsx","src/app/(app)/dashboard/upgraded-toast.tsx","src/app/(app)/dashboard/page.tsx","src/app/(app)/account/page.tsx","src/app/(app)/account/plan-card.test.ts","src/components/app/event-settings/event-password-control.tsx","src/components/app/event-settings/event-settings-form.tsx","src/components/app/event-settings/visibility-section.tsx","src/components/app/event-settings/uploads-section.tsx","src/components/app/event-slug-control.tsx","src/components/app/event-share-sheet.tsx","src/components/app/create-event-wizard.tsx","src/components/app/restore-event-button.tsx","src/components/app/recently-deleted-grid.tsx","src/components/app/dashboard/storage-meter.tsx","src/app/api/stripe/checkout/route.ts","src/app/(dev)/design/sandbox/app-pricing/","docs/systems/billing-caps.md"],
"overtaken-4":["src/app/(dev)/design/sandbox/overtaken.ts","src/app/(dev)/design/sandbox/overtaken.test.ts"],
})
READS.update({
"avatar-mesh-wiring":["src/components/social/guest-list.tsx","docs/reviews/seed-avatar.json","docs/design/rulings.md"],
"pricing-split-wiring":["src/lib/constants/tiers.ts","src/lib/constants/marketing-voice.ts","docs/reviews/pricing-page.json","docs/design/rulings.md"],
"demo-frame-wiring":["src/components/marketing/sections/home/live-demo.tsx","src/components/marketing/sections/home/hero-stream.ts","src/components/shared/album-stream/","docs/reviews/demo-event.json","docs/design/rulings.md"],
"welcome-film-wiring":["src/lib/constants/how-it-works.ts","src/components/marketing/sections/how-it-works/","src/app/(app)/actions.ts","docs/reviews/app-door.json","docs/design/rulings.md"],
"app-pricing-wiring":["src/lib/constants/tiers.ts","src/lib/constants/marketing-voice.ts","src/components/ui/sheet.tsx","src/components/ui/dialog.tsx","src/components/ui/tooltip.tsx","src/lib/stripe/","src/app/(dev)/design/sandbox/overtaken.ts","docs/reviews/app-pricing.json","docs/design/rulings.md"],
"overtaken-4":["docs/design/rulings.md","docs/reviews/","src/app/(dev)/design/touchpoints.ts","src/app/(dev)/design/sandbox/registry.ts","src/app/(dev)/design/(shell)/lab/_desk/","src/components/lab/"],
})
BOARD.update({"app-pricing-wiring":"app-pricing     # wired by this lane; the board retires (its eight asks ruled whole)","overtaken-4":"none            # lab infrastructure: the judgment lines for the closing sitting's second batch; no board of its own"})
LANE_SECTION.update({"app-pricing-wiring":r"Lane 50: `app-pricing-wiring`","overtaken-4":r"Lane 51: `overtaken-4`"})

# the closing sitting's third batch (2026-09-21 ~01:40 EDT): three new lanes (two boards ruled whole, one desk pass)
QUEUE.update({"first-event-wiring","guest-upload-wiring","overtaken-5"})
OWNS.update({
"first-event-wiring":["src/components/app/create-event-wizard.tsx","src/components/app/qr-preset-picker.tsx","src/app/(app)/dashboard/new/","src/app/(app)/dashboard/page.tsx","src/components/app/share/event-share-sheet.tsx","src/components/app/share/share.css","src/components/app/share/event-share.test.tsx","src/components/app/event-share-dialog.tsx","src/components/app/event-card-qr.tsx","src/components/app/event-qr.tsx","src/components/app/print/","src/app/(print)/","src/app/(app)/dashboard/[eventId]/page.tsx","src/app/api/events/[eventId]/live/","src/lib/events/host-fingerprint.ts","src/lib/events/host-fingerprint.test.ts","src/lib/qr/","src/components/app/event-uploads.tsx","src/components/app/event-feed/launch-list.tsx","src/components/app/event-feed/launch-list.test.tsx","src/components/app/event-feed/event-gallery.tsx","src/components/app/host-media-grid.tsx","src/components/app/event-feed/event-hub.test.tsx","src/app/(dev)/design/sandbox/first-event/","src/app/globals.css","docs/systems/host-app.md"],
"guest-upload-wiring":["src/components/guest/","src/lib/guest/use-upload-queue.ts","src/lib/guest/arrival-glow.ts","src/lib/shared/arrival.ts","src/lib/shared/arrival.test.ts","src/lib/shared/use-live-poll.ts","src/components/shared/masonry.tsx","src/components/shared/masonry.test.tsx","src/components/shared/arrival.css","src/components/shared/lit-edge-contract.test.ts","src/app/(dev)/design/sandbox/guest-upload/","docs/systems/guest-flow.md","docs/systems/uploads-and-r2.md"],
"overtaken-5":["src/app/(dev)/design/sandbox/overtaken.ts","src/app/(dev)/design/sandbox/overtaken.test.ts"],
})
READS.update({
"first-event-wiring":["src/lib/guest/use-gallery-doorbell.ts","src/lib/guest/refresh-coalescer.ts","src/lib/events/gallery-fingerprint.ts","src/components/shared/masonry.tsx","src/components/guest/live-gallery.tsx","src/components/marketing/chrome/footer-qr.tsx","src/components/marketing/system/demo-ticket.tsx","src/components/marketing/sections/features/qr/print-shop.tsx","src/lib/constants/tiers.ts","src/lib/constants/qr-presets.ts","src/lib/dashboard/next-step.ts","src/components/app/pricing/","src/components/app/event-settings/","src/components/ui/sheet.tsx","src/app/api/","src/app/legal-print.test.ts","src/components/shared/lit-edge-contract.test.ts","docs/reviews/first-event.json","docs/design/rulings.md"],
"guest-upload-wiring":["src/lib/upload/uploader.ts","src/lib/upload/server-pipeline.ts","src/app/api/r2/","src/lib/media/limits.ts","src/lib/media/validators.ts","src/lib/guest/reconcile-gallery-items.ts","src/lib/db/queries/guest-events.ts","src/components/ui/sheet.tsx","src/components/ui/sonner.tsx","src/components/shared/legal-consent-line.tsx","src/lib/constants/legal-terms.tsx","src/lib/type-ladder-policy.test.ts","src/components/marketing/mock-parity.test.ts","docs/reviews/guest-upload.json","docs/design/rulings.md"],
"overtaken-5":["docs/design/rulings.md","docs/reviews/","src/app/(dev)/design/touchpoints.ts","src/app/(dev)/design/sandbox/registry.ts","src/app/(dev)/design/(shell)/lab/_desk/","src/components/lab/"],
})
BOARD.update({"first-event-wiring":"first-event     # wired by this lane; the board retires (its eight asks ruled whole)","guest-upload-wiring":"guest-upload    # wired by this lane; the board retires (its eight asks ruled whole)","overtaken-5":"none            # lab infrastructure: the judgment lines for the closing sitting's third batch; merges first; no board of its own"})
LANE_SECTION.update({"first-event-wiring":r"Lane 52: `first-event-wiring`","guest-upload-wiring":r"Lane 53: `guest-upload-wiring`","overtaken-5":r"Lane 54: `overtaken-5`"})

FIXES={"third-batch-fixes","identity-fixes","door-fixes","heal-validator","guest-email-migration","guest-email-server","guest-email-door","guest-email-claims","identity-copy-fixes","name-gate","identity-door","identity-claims","identity-profile","reel-engine-live","reel-engine-video","reel-view","reel-front","reel-screen"}
FIX_TEXT="**Goal.** A production follow-up cut by the Orchestrator from the red-team on the `launch-prep` alias (2026-09-21, build `5e210ef8`, the third batch whole): the defects it found in the third batch's wiring, fixed in place. No board, no new ruling, nothing reopened: the rulings this wiring answers are in `docs/design/rulings.md` under \"the closing sitting's third batch\", and every one stands as wired. The lane's brief follows; read it end to end before the first edit."
FIX_TEXTS={"guest-email-server":"**Goal.** Wave 1 of the guest identity round, cut by the Orchestrator at wave 0's record from Will's ruling of 2026-09-22 (rulings.md \"guest identity: name only, unconfirmed email, verified account\", every sentence his): the wire (the optional email through the join, the attach route, the identity that never reads it, the crack closed, the forensics, the profile queries), announced in the Handoff for the door lane and merged first. No board, no new ruling. The lane's brief follows; read it end to end before the first edit.","guest-email-door":"**Goal.** Wave 1 of the guest identity round, cut by the Orchestrator at wave 0's record from Will's ruling of 2026-09-22 (rulings.md \"guest identity: name only, unconfirmed email, verified account\", every sentence his): the door's optional field, the guest menu's two labels and its add-email dialog, the mark's word \"Unverified\", the offer card's prefill and the gate line, on the wire the server lane announces. No board, no new ruling. The lane's brief follows; read it end to end before the first edit.","guest-email-claims":"**Goal.** Wave 1 of the guest identity round, cut by the Orchestrator at wave 0's record from Will's ruling of 2026-09-22 (rulings.md \"guest identity: name only, unconfirmed email, verified account\", every sentence his): the claim ticket as one plain card on the dashboard with its confirmation, the welcome page's name prefill, the attended-events default inverted, and the legal and help pages. No board, no new ruling. The lane's brief follows; read it end to end before the first edit.","guest-email-migration":"**Goal.** Wave 0 of the guest identity round, cut by the Orchestrator from Will's ruling of 2026-09-22 (rulings.md \"guest identity: name only, unconfirmed email, verified account\", every sentence his): the schema the three wave-1 lanes code against, written as SQL files with their pins and rolled-back checks; the Orchestrator applies them. No board, no production TypeScript beyond the tests named. The lane's brief follows; read it end to end before the first edit.","heal-validator":"**Goal.** A production follow-up cut by the Orchestrator from the re-check on the `launch-prep` alias (2026-09-22, build `36fcde3c`, the door round whole): the one finding it made, fixed in place. No board, no new ruling, nothing reopened: the rulings this wiring answers are in `docs/design/rulings.md` under \"the door as three steps\" and \"the door's first look\", and every one stands as wired. The lane's brief follows; read it end to end before the first edit.","door-fixes":"**Goal.** A production follow-up cut by the Orchestrator from the red-team on the `launch-prep` alias (2026-09-21, build `27ff8a9e`, the door round whole): the two defects it found in the door's wiring, fixed in place. No board, no new ruling, nothing reopened: the rulings this wiring answers are in `docs/design/rulings.md` under \"the door as three steps\", and every one stands as wired. The lane's brief follows; read it end to end before the first edit.","identity-fixes":"**Goal.** A production follow-up cut by the Orchestrator from the red-team on the `launch-prep` alias (2026-09-21, build `c7015a26`, the identity reshape and the overtaken audit whole): the three defects and three polish items it found in the identity reshape's wiring, fixed in place. No board, no new ruling, nothing reopened: the rulings this wiring answers are in `docs/design/rulings.md` under \"the identity reshape: Require verified emails\", and every one stands as wired. The lane's brief follows; read it end to end before the first edit."}
OWNS.update({
"third-batch-fixes":["src/components/guest/upload/","src/components/guest/guest-upload.tsx","src/components/guest/guest-upload.test.tsx","src/components/guest/event-experience.tsx","src/lib/guest/use-upload-queue.ts","src/components/app/print/","docs/systems/guest-flow.md"],
})
READS.update({
"third-batch-fixes":["src/components/guest/live-gallery.tsx","src/components/guest/guest-masonry.tsx","src/components/ui/sheet.tsx","src/app/(print)/","src/app/globals.css","src/lib/media/validators.ts","docs/systems/host-app.md","docs/design/rulings.md"],
})
BOARD.update({"third-batch-fixes":"none            # production follow-up: the alias red-team's two defects and one polish item on the third batch's wiring; no board"})
LANE_SECTION.update({"third-batch-fixes":r"Lane 55: `third-batch-fixes`"})
OWNS.update({"identity-fixes":["src/components/guest/","src/lib/guest/","src/lib/observability/","docs/systems/guest-flow.md","docs/systems/admin-observability.md"]})
READS.update({"identity-fixes":["src/app/api/guests/route.ts","src/app/api/guests/name/route.ts","src/app/api/r2/presign-upload/route.ts","src/app/api/r2/complete-upload/route.ts","src/lib/events/gallery-access.server.ts","src/components/shared/media-lightbox.tsx","src/app/error.tsx","src/components/shared/route-error.tsx","docs/design/rulings.md"]})
BOARD.update({"identity-fixes":"none            # production follow-up: the alias red-team's three defects and three polish items on the identity reshape's wiring; no board"})
LANE_SECTION.update({"identity-fixes":r"Lane 66: `identity-fixes`"})
OWNS.update({"door-fixes":["src/components/guest/live-gallery.tsx","src/components/guest/live-gallery.test.tsx","src/components/guest/event-experience.tsx","src/app/api/guests/gallery/","docs/systems/guest-flow.md"]})
READS.update({"door-fixes":["src/lib/guest/session-cookie.ts","src/lib/guest/use-stored-session.ts","src/lib/events/gallery-access.server.ts","src/lib/events/gallery-fingerprint.ts","docs/design/rulings.md"]})
BOARD.update({"door-fixes":"none            # production follow-up: the door red-team's two defects on the alias (the stricter drift, the 304's heal); no board"})
LANE_SECTION.update({"door-fixes":r"Lane 70: `door-fixes`"})
OWNS.update({"heal-validator":["src/app/api/guests/gallery/route.ts","src/app/api/guests/gallery/route.test.ts","docs/systems/guest-flow.md","docs/systems/testing-verification.md"]})
READS.update({"heal-validator":["src/lib/guest/session-cookie.ts","src/lib/events/gallery-fingerprint.ts","src/components/guest/live-gallery.tsx"]})
BOARD.update({"heal-validator":"none            # production follow-up: the door-fixes re-check's one finding (the edge 304s a matching validator and drops the cookie); no board"})
LANE_SECTION.update({"heal-validator":r"Lane 71: `heal-validator`"})
OWNS.update({"guest-email-migration":["supabase/migrations/20260922120000_guest_pending_email.sql","supabase/migrations/20260922122000_profile_shown_events.sql","src/lib/db/migration-guards.test.ts","src/lib/social/public-profile-visibility.test.ts","src/lib/validation/profile.test.ts"]})
READS.update({"guest-email-migration":["supabase/migrations/20260921150000_identity_require_verified_email.sql","supabase/migrations/20260609120000_claim_anonymous_uploads.sql","supabase/migrations/20260919140000_profile_rpc_anon_viewer_gate.sql","supabase/migrations/20260920090000_remove_my_upload_by_session.sql","supabase/migrations/20260729180000_qa_q3_escalation_guards.sql","src/lib/db/types.ts","docs/systems/database-security.md","docs/design/rulings.md"]})
BOARD.update({"guest-email-migration":"none            # production, wave 0 of the guest identity round: the schema (pending_email, the claim RPCs, profile_shown_events) as SQL files the Orchestrator applies; no board"})
LANE_SECTION.update({"guest-email-migration":r"Lane 72: `guest-email-migration`"})
OWNS.update({"guest-email-server":["src/app/api/guests/", "src/lib/validation/upload.ts", "src/lib/validation/upload.test.ts", "src/lib/db/mutations/guest.ts", "src/lib/db/queries/social.ts", "src/lib/db/queries/social.guest-identity.test.ts", "src/lib/db/mutations/social.ts", "src/app/(app)/account/social-actions.ts", "src/lib/social/cards.ts", "src/lib/media/uploader-identity.ts", "src/lib/media/uploader-identity.test.ts", "src/lib/r2/grid-items.ts", "src/lib/r2/grid-items.email-safety.test.ts", "src/lib/forensics/capture.ts", "src/lib/forensics/capture.test.ts", "src/app/admin/forensics/", "src/lib/errors/codes.ts", "src/lib/security/abuse-rate-limit.ts", "docs/systems/database-security.md", "docs/systems/admin-observability.md"]})
READS.update({"guest-email-server":["src/lib/db/types.ts", "src/lib/guest/session-cookie.ts", "supabase/migrations/20260922120000_guest_pending_email.sql", "supabase/migrations/20260922122000_profile_shown_events.sql", "docs/design/rulings.md"]})
BOARD.update({"guest-email-server":"none            # production, wave 1 of the guest identity round: the wire, the identity, the crack closed, the forensics, the profile queries; merges first; no board"})
LANE_SECTION.update({"guest-email-server":r"Lane 73: `guest-email-server`"})
OWNS.update({"guest-email-door":["src/components/guest/", "src/lib/guest/", "src/components/shared/unverified-mark.tsx", "src/components/shared/unverified-mark.test.tsx", "src/components/auth/account-door.tsx", "content/help/require-verified-emails-explained.mdx", "content/help/what-guests-can-and-cant-see.mdx", "docs/systems/guest-flow.md", "docs/systems/auth-accounts.md"]})
READS.update({"guest-email-door":["src/lib/db/types.ts", "src/components/auth/email-sign-in.tsx", "src/lib/auth/remembered-email.ts", "src/components/shared/media-lightbox.tsx", "src/components/social/guest-list.tsx", "src/components/marketing/mock-parity.test.ts", "docs/design/rulings.md"]})
BOARD.update({"guest-email-door":"none            # production, wave 1 of the guest identity round: the door's optional field, the menu, the mark's word, the gate line; no board"})
LANE_SECTION.update({"guest-email-door":r"Lane 74: `guest-email-door`"})
OWNS.update({"guest-email-claims":["src/components/app/dashboard/claims-card.tsx", "src/components/app/dashboard/claims-card.test.tsx", "src/app/(app)/dashboard/claims-actions.ts", "src/app/(app)/dashboard/page.tsx", "src/app/(app)/welcome/page.tsx", "src/lib/db/queries/claims.ts", "src/lib/db/queries/claims.test.ts", "src/components/social/attended-events-visibility.tsx", "src/components/social/attended-events-visibility.test.tsx", "src/lib/constants/legal-privacy.tsx", "src/lib/constants/legal-terms.tsx", "content/help/why-an-event-asks-for-your-email.mdx", "content/help/how-guests-join-and-upload.mdx", "content/help/save-an-event-and-find-your-uploads.mdx", "content/help/profiles-guest-lists-and-following.mdx", "content/help/display-name-and-profile-photo.mdx", "docs/systems/profiles-social.md", "docs/systems/host-app.md"]})
READS.update({"guest-email-claims":["src/lib/db/queries/social.ts", "src/app/(app)/account/social-actions.ts", "src/lib/db/mutations/social.ts", "src/lib/welcome.ts", "src/app/(app)/account/actions.ts", "src/components/ui/dialog.tsx", "src/lib/db/types.ts", "src/lib/constants/legal.ts", "docs/design/rulings.md"]})
BOARD.update({"guest-email-claims":"none            # production, wave 1 of the guest identity round: the claim ticket on the dashboard, the profile default, legal and help; no board"})
LANE_SECTION.update({"guest-email-claims":r"Lane 75: `guest-email-claims`"})
FIX_TEXTS["identity-copy-fixes"]="**Goal.** One fix from the identity round's red-team on the alias (2026-09-22, `a9299629`), cut by the Orchestrator at the red-team's record: the claims confirmation before Finish reads \"Permanently delete the 1 photo and video added under your email at these 1 event?\" for one upload at one event. Make the sentence read naturally for every count (one upload is \"photo or video\", several are \"photos and videos\"; one event is \"this event\", several \"these M events\"), pin the four forms in the card's test, and change nothing else in the card: its real shape is the lab's. The Lane section at the foot of the Orchestrator's plan file carries the exact sentences; this manifest's brief is a copy of it."
OWNS.update({"identity-copy-fixes":["src/components/app/dashboard/claims-card.tsx","src/components/app/dashboard/claims-card.test.tsx"]})
READS.update({"identity-copy-fixes":["docs/design/rulings.md","src/lib/utils.ts"]})
BOARD.update({"identity-copy-fixes":"none            # production fix from the identity round's red-team: the claims confirmation's grammar; no board"})
LANE_SECTION.update({"identity-copy-fixes":r"Lane 76: `identity-copy-fixes`"})
FIX_TEXTS["name-gate"]="**Goal.** Will's ruling of 2026-09-22 (~11:52 EDT, rulings.md \"the morning after the identity round\"): \"I wanted to ensure an account without a name wasn't moving around the app as a normal user. Name always required, even if one character.\" Today only the dashboard root and event creation send a nameless profile to /welcome; /account and every event room render for one. Close it at the group: every (app) route except /welcome redirects a nameless profile to /welcome, once, in one place (a nested `(named)` route group with its own layout, recommended), pinned by a source-level test; the two existing page-level redirects kept; one line in auth-accounts.md. The Lane section at the foot of the Orchestrator's plan file carries the shape; this manifest's brief is a copy of it."
OWNS.update({"name-gate":["src/app/(app)/","docs/systems/auth-accounts.md","docs/systems/host-app.md"]})
READS.update({"name-gate":["src/lib/welcome.ts","src/lib/validation/profile.ts","src/lib/db/queries/profile.ts","src/lib/supabase/request-auth.ts","src/proxy.ts","docs/design/rulings.md"]})
BOARD.update({"name-gate":"none            # production, Will's ruling of 2026-09-22: a nameless account moves nowhere but the welcome page; no board"})
LANE_SECTION.update({"name-gate":r"Lane 77: `name-gate`"})
FIX_TEXTS["identity-door"]="**Goal.** A NEW lab board on Will's word (2026-09-22, rulings.md \"guest identity\" and \"the morning after the identity round\": \"I'd like to run most of this through the lab once our foundation is complete\"; the foundation is whole on the alias): the door sheet with the optional email, the sign-in nudge, the verified gate's framing, the guest menu's two states and where Remove your email lives (five asks). A catalog to select from, the shipped state one option among three or four per ask, the same guest in the same world, at 1440 and 375; nothing here wires production. The Lane section at the foot of the Orchestrator's plan file carries every ask and option; this manifest's brief is a copy of it."
FIX_TEXTS["identity-claims"]="**Goal.** A NEW lab board on Will's word (2026-09-22, rulings.md \"guest identity\" and \"the morning after the identity round\": \"I'd like to run most of this through the lab once our foundation is complete\"; the foundation is whole on the alias): the claim ticket's home on the dashboard, the pointer from the follow moment after a confirmation, the claim pass, the removal confirmation and what Finish does next (five asks). A catalog to select from, the shipped state one option among three or four per ask, the same guest in the same world, at 1440 and 375; nothing here wires production. The Lane section at the foot of the Orchestrator's plan file carries every ask and option; this manifest's brief is a copy of it."
FIX_TEXTS["identity-profile"]="**Goal.** A NEW lab board on Will's word (2026-09-22, rulings.md \"guest identity\" and \"the morning after the identity round\": \"I'd like to run most of this through the lab once our foundation is complete\"; the foundation is whole on the alias): the profile setup (the wizard line folded in), choosing which attended events show, when the app invites the setup, and what an empty page says (four asks). A catalog to select from, the shipped state one option among three or four per ask, the same guest in the same world, at 1440 and 375; nothing here wires production. The Lane section at the foot of the Orchestrator's plan file carries every ask and option; this manifest's brief is a copy of it."
OWNS.update({"identity-door":["src/app/(dev)/design/sandbox/identity-door/"],"identity-claims":["src/app/(dev)/design/sandbox/identity-claims/"],"identity-profile":["src/app/(dev)/design/sandbox/identity-profile/"]})
READS.update({"identity-door":["src/components/guest/","src/components/auth/account-door.tsx","src/components/shared/unverified-mark.tsx","src/app/(dev)/design/sandbox/guest-capture/","src/components/lab/","src/app/(dev)/design/touchpoints.ts","docs/design/rulings.md","docs/systems/guest-flow.md"],"identity-claims":["src/components/app/dashboard/claims-card.tsx","src/components/guest/follow-moment-card.tsx","src/components/app/notification-bell.tsx","src/app/(dev)/design/sandbox/guest-capture/","src/components/lab/","src/app/(dev)/design/touchpoints.ts","docs/design/rulings.md","docs/systems/host-app.md","docs/systems/profiles-social.md"],"identity-profile":["src/components/social/attended-events-visibility.tsx","src/app/(guest)/u/","src/app/(app)/","src/app/(dev)/design/sandbox/guest-capture/","src/components/lab/","src/app/(dev)/design/touchpoints.ts","docs/design/rulings.md","docs/systems/profiles-social.md","docs/ROADMAP.md"]})
BOARD.update({"identity-door":"identity-door   # a new board: the identity flows, the door sheet with an email","identity-claims":"identity-claims # a new board: the identity flows, the claim ticket","identity-profile":"identity-profile # a new board: the identity flows, the profile setup"})
LANE_SECTION.update({"identity-door":r"Lane 78: `identity-door`","identity-claims":r"Lane 79: `identity-claims`","identity-profile":r"Lane 80: `identity-profile`"})
FIX_TEXTS["reel-engine-live"]="**Goal.** THE REEL ROUND (Will, 2026-09-22, rulings.md \"the reel, reconceived\": the reel becomes a live, looping montage of everything the album shows, no host action, no stored file). Build the ROLLING live composer beside the shipped fixed one, as a library with a lab harness and no production surface: the seeded take per loop from the quick-add brain, windows overlapping by one clip and handing over mid-hold, an immediate drop, the splice, the surface pacing with the hold guard in planReel, the refcounted bitmap cache, the live player with a monotonic clock and per-clip assets, and the harness at /design/lab/tools/reel-live over local fixtures. The Lane section at the foot of the Orchestrator's plan file carries every deliverable and constraint; this manifest's brief is a copy of it."
FIX_TEXTS["reel-engine-video"]="**Goal.** THE REEL ROUND (Will, 2026-09-22, rulings.md \"the reel, reconceived\"; his ruling: \"Range-window decode on device\" behind an \"Include videos\" toggle). Motion video in the reel by a six-second window of the ORIGINAL fetched by range through mediabunny's Input/UrlSource and decoded on the viewer's device: the reader with bounded retries and disposal, the per-play byte budget with the K-loop cadence and the session ceiling, the fallback ladder to the poster, a synchronous frameAt ring the draw reads, the encoder's await prepareFrame, and a harness over local mov and webm fixtures. A library with no production surface. The Lane section at the foot of the Orchestrator's plan file carries every deliverable and constraint; this manifest's brief is a copy of it."
FIX_TEXTS["reel-view"]="**Goal.** A NEW lab board, THE REEL ROUND (Will, 2026-09-22, rulings.md \"the reel, reconceived\"): the reel's full-screen view, eight asks (the chrome and its fade, the control set, the just-added beat, the tap, the posture, the hand pacing, the loop's turn, reduced motion), every reel frame the real engine over the fixture album, at 1440 and 375; a catalog to select from, nothing wiring production. The Lane section at the foot of the Orchestrator's plan file carries every ask and option; this manifest's brief is a copy of it."
FIX_TEXTS["reel-front"]="**Goal.** A NEW lab board, THE REEL ROUND (Will, 2026-09-22, rulings.md \"the reel, reconceived\"): the album's head, seven asks (the living tile, its verbs, the small states, the yours-first beat, the door's backdrop where the decision is already full, the head once uploads close, the host's hub card as the reel's face), every tile option measured for what it adds to the first paint; a catalog to select from, nothing wiring production. The Lane section at the foot of the Orchestrator's plan file carries every ask and option; this manifest's brief is a copy of it."
FIX_TEXTS["reel-screen"]="**Goal.** A NEW lab board, THE REEL ROUND (Will, 2026-09-22, rulings.md \"the reel, reconceived\"; his ruling: \"A first-class screen mode\"): the venue screen at 1920 by 1080, eight asks (the QR's corner, the event's name, the caption, the wall pacing, the idle and empty states, the Start plate, Review on the wall, how the host opens it); a catalog to select from, nothing wiring production. The Lane section at the foot of the Orchestrator's plan file carries every ask and option; this manifest's brief is a copy of it."
OWNS.update({"reel-engine-live":["src/lib/reel/live/","src/lib/reel/engine/player-live.tsx","src/lib/reel/engine/player-live.test.tsx","src/lib/reel/engine/asset-cache.ts","src/lib/reel/engine/asset-cache.test.ts","src/lib/reel/engine/layout.ts","src/lib/reel/engine/layout.test.ts","src/lib/reel/engine/timeline.ts","src/lib/reel/engine/timeline.test.ts","src/app/(dev)/design/(shell)/lab/tools/reel-live/"],"reel-engine-video":["src/lib/reel/engine/video/","src/lib/reel/engine/assets.ts","src/lib/reel/engine/assets.test.ts","src/lib/reel/engine/reel-types.ts","src/lib/reel/engine/styles/mood.ts","src/lib/reel/engine/encode.ts","src/app/(dev)/design/(shell)/lab/tools/reel-video/"],"reel-view":["src/app/(dev)/design/sandbox/reel-view/"],"reel-front":["src/app/(dev)/design/sandbox/reel-front/"],"reel-screen":["src/app/(dev)/design/sandbox/reel-screen/"]})
READS.update({"reel-engine-live":["src/lib/reel/engine/","src/lib/reel/quick-add.ts","src/lib/reel/build-reel-props.ts","src/lib/guest/reconcile-gallery-items.ts","src/app/(dev)/design/(shell)/lab/tools/reel-parity/","src/app/(dev)/design/sandbox/gallery-fixtures.ts","docs/systems/host-app.md","docs/systems/uploads-and-r2.md"],"reel-engine-video":["node_modules/mediabunny/dist/modules/src/input.d.ts","node_modules/mediabunny/dist/modules/src/source.d.ts","node_modules/mediabunny/dist/modules/src/media-sink.d.ts","node_modules/mediabunny/dist/modules/src/input-track.d.ts","src/lib/reel/engine/","src/lib/r2/grid-items.ts","docs/systems/uploads-and-r2.md"],"reel-view":["src/components/guest/guest-reel-overlay.tsx","src/lib/reel/engine/","src/app/(dev)/design/sandbox/media-viewer/","src/app/(dev)/design/sandbox/gallery-fixtures.ts","src/components/lab/","src/app/(dev)/design/touchpoints.ts","src/app/(dev)/design/sandbox/overtaken.ts","docs/design/rulings.md"],"reel-front":["src/components/guest/event-experience.tsx","src/components/guest/guest-reel-card.tsx","src/components/reel/poster-card.tsx","src/components/guest/entry-shell.tsx","src/app/(app)/dashboard/[eventId]/page.tsx","src/lib/demo.ts","src/app/(dev)/design/sandbox/guest-capture/","src/app/(dev)/design/sandbox/gallery-fixtures.ts","src/components/lab/","src/app/(dev)/design/touchpoints.ts","docs/design/rulings.md","docs/systems/guest-flow.md"],"reel-screen":["src/components/guest/event-experience.tsx","src/lib/reel/engine/player.tsx","content/help/show-the-album-live-on-a-screen.mdx","src/app/(dev)/design/sandbox/host-curation/","src/app/(dev)/design/sandbox/gallery-fixtures.ts","src/components/lab/","src/app/(dev)/design/touchpoints.ts","docs/design/rulings.md"]})
BOARD.update({"reel-engine-live":"none            # engineering: the rolling live composer and its harness; no board of its own","reel-engine-video":"none            # engineering: motion video by a range-fetched window decoded on device; no board of its own","reel-view":"reel-view       # a new board: the reel round, the reel's full-screen view","reel-front":"reel-front      # a new board: the reel round, the album's head","reel-screen":"reel-screen     # a new board: the reel round, the venue screen"})
LANE_SECTION.update({"reel-engine-live":r"Lane 81: `reel-engine-live`","reel-engine-video":r"Lane 82: `reel-engine-video`","reel-view":r"Lane 83: `reel-view`","reel-front":r"Lane 84: `reel-front`","reel-screen":r"Lane 85: `reel-screen`"})
DOOR={"door-steps","upload-gate-host","reshape-guest-capture"}
DOOR_TEXT={'door-steps': '**Goal.** The guest side of Will\'s door ruling (2026-09-21, verbatim in `docs/design/rulings.md` under \\"the door as three steps: the name before the album, the first upload asked, Require an upload to view\\"; read it first, every sentence binds): the door becomes one held sheet with no exit (the welcome, the password when there is one, the name, the email held until confirmed when the host requires verified emails, the first upload asked inside the sheet), then the album; the new switch\'s gate is enforced server-side through the decision with a reason and the cookie the join sets. Wave 0 landed the schema (`events.require_upload_to_view`, `get_event_by_qr_token` returning it, `get_upload_gate` service-role only), so code against real types. No board, no new ruling: the plan Will approved (its two fresh-context reviews folded in) is the brief below; read it end to end before the first edit, build every line of it, and list every call you took under \\"his to overrule\\".', 'upload-gate-host': '**Goal.** The host\'s side of Will\'s door ruling (2026-09-21, verbatim in `docs/design/rulings.md` under \\"the door as three steps\\"): the switch Require an upload to view in the event settings, its confirm on the ON edge, the guest-experience sentences composed for it, its help article and the two it touches, and the docs lines. Wave 0 landed the schema, so code against real types. The guest side is `door-steps`, cut beside this lane on disjoint owns; never touch its files. No board, no new ruling; the brief below is the approved plan\'s; read it end to end before the first edit.', 'reshape-guest-capture': '**Goal.** A lab-only RESHAPE of the `guest-capture` board\'s tiles after the door ruling (Will, 2026-09-21, verbatim in `docs/design/rulings.md` under \\"the door as three steps\\") and its wiring (`door-steps`) changed the door the board draws: the previews are redrawn on the shipped components so that Will never judges a picture of a door that no longer exists. NOT a new board: no verdict recorded, no ask removed or added, the five questions stand for his review; `lab:demo --board guest-capture` and the registry tests are the proof. Read the brief end to end before the first edit.'}
OWNS.update({
"door-steps":["src/components/guest/","src/lib/guest/","src/lib/events/gallery-access.ts","src/lib/events/gallery-access.test.ts","src/lib/events/gallery-access.server.ts","src/lib/events/gallery-fingerprint.ts","src/lib/events/gallery-fingerprint.test.ts","src/lib/db/queries/guest-events.ts","src/lib/db/queries/guest-gate.ts","src/app/(guest)/","src/app/api/guests/","src/app/api/export/guest/","src/app/api/reel/download/","src/app/api/r2/complete-upload/","src/lib/upload/server-pipeline.ts","src/lib/security/telemetry-redaction.ts","src/lib/security/telemetry-redaction.test.ts","src/lib/constants/legal-privacy.tsx","src/components/marketing/sections/features/qr/entry-flow.tsx","src/components/marketing/sections/features/album/entry-phone.tsx","src/components/marketing/sections/how-it-works/guest-pictures.tsx","src/lib/constants/how-it-works.ts","src/components/marketing/mock-parity.test.ts","content/help/how-guests-join-and-upload.mdx","content/help/browse-the-album.mdx","content/help/what-guests-can-and-cant-see.mdx","content/help/messages-guests-might-see.mdx","content/help/why-an-event-asks-for-your-email.mdx","content/help/require-verified-emails-explained.mdx","content/help/show-the-album-live-on-a-screen.mdx","content/help/save-an-event-and-find-your-uploads.mdx","content/help/turn-off-uploads-or-cap-file-size.mdx","docs/systems/guest-flow.md","docs/systems/database-security.md"],
"upload-gate-host":["src/components/app/event-settings/","src/components/app/event-settings-form.tsx","src/lib/validation/event.ts","src/lib/validation/event.test.ts","src/lib/db/mutations/events.ts","src/lib/events/guest-experience-summary.ts","src/lib/events/guest-experience-summary.test.ts","content/help/require-an-upload-to-view-explained.mdx","content/help/event-settings-explained.mdx","content/help/who-can-see-your-event.mdx","src/lib/content/help.ts","docs/systems/host-app.md","docs/PRD.md","docs/PRICING.md"],
"reshape-guest-capture":["src/app/(dev)/design/sandbox/guest-capture/"],
})
READS.update({
"door-steps":["supabase/migrations/20260922003000_require_upload_to_view.sql","src/lib/db/types.ts","src/components/ui/sheet.tsx","src/lib/upload/uploader.ts","src/app/api/r2/presign-upload/route.ts","src/lib/errors/codes.ts","src/app/(dev)/design/touchpoints.ts","docs/design/rulings.md"],
"upload-gate-host":["src/components/ui/confirm-switch.tsx","src/lib/constants/tiers.ts","supabase/migrations/20260922003000_require_upload_to_view.sql","src/lib/db/types.ts","content/help/require-verified-emails-explained.mdx","docs/design/rulings.md"],
"reshape-guest-capture":["src/components/guest/","docs/design/rulings.md","src/app/(dev)/design/touchpoints.ts"],
})
BOARD.update({
"door-steps":"none            # production: the door as three steps and the upload gate's guest side; no board",
"upload-gate-host":"none            # production: the host's Require an upload to view switch and its sentences; no board",
"reshape-guest-capture":"guest-capture   # the board's tiles redrawn on the shipped door; no verdict, no ask moved; the board stays on the desk",
})
LANE_SECTION.update({"door-steps":r"Lane 67: `door-steps`","upload-gate-host":r"Lane 68: `upload-gate-host`","reshape-guest-capture":r"Lane 69: `reshape-guest-capture`"})

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

# The identity reshape (2026-09-21): one verdict and a note reshape the foundation; three waves, six lanes.
RESHAPE={"verified-email-migration","verified-email-server","verified-email-guest","verified-email-host-copy","verified-email-lab","guest-capture"}
_R="Will's `address=none` on `guest-verify` round two and his note (2026-09-21, build `5e210ef`), verbatim in `docs/design/rulings.md` under \"the identity reshape\", with his four answers at approval: anonymity leaves the product; the host's switch becomes Require verified emails (on by default); off, a guest types a display name at the door and uploads under it with a small unverified mark; the capture flow after a name-only guest's first upload is wired as the working version. "
RESHAPE_TEXT={
"verified-email-migration":"**Goal.** WAVE 0 of the identity reshape, alone: "+_R+"This lane writes the schema and nothing else (the migration, the rolled-back contract check, the tests that parse migration text); the Orchestrator applies it before any other lane is cut, so every function body is carried verbatim from its latest definition and changed only where the brief says. The brief below is the whole reading.",
"verified-email-server":"**Goal.** Wave 1 of the identity reshape: "+_R+"The schema is applied and the types regenerated on the tree you were cut from: the flag is `events.require_verified_email`, the name `guests.display_name`, the proof `guests.verified_at`. This lane is the route, the identity and the queries. The brief below is the whole reading.",
"verified-email-guest":"**Goal.** Wave 1 of the identity reshape: "+_R+"This lane is the guest's door, the credit and the capture flow, on the applied schema. The brief below is the whole reading.",
"verified-email-host-copy":"**Goal.** Wave 1 of the identity reshape: "+_R+"This lane is the host's switch, the host's surfaces and every sentence in the product, the marketing, the help and the legal pages that named the old concept. The brief below is the whole reading.",
"verified-email-lab":"**Goal.** Wave 1 of the identity reshape: "+_R+"This lane retires `guest-verify` (every ask ruled on his words) and runs the desk pass across the fourteen standing boards. The brief below is the whole reading.",
"guest-capture":"**Goal.** A NEW BOARD on Will's word at approval (2026-09-21, verbatim: \"You can wire it now as you recommended, but I'd like to get this in the lab for refinement.\"): the capture flow shipped by `verified-email-guest` (the offer after a name-only guest's first upload, the follow moment, the profile the guest lands on) refined as a lab catalog for his next sitting, drawn on the SHIPPED components; lab-only, no production byte. The brief below is the whole reading.",
}
# The overtaken audit (2026-09-21): Will's cleanup of the badged questions; four reshape lanes, one board folder each.
CLEANUP={"reshape-viewer-curation","reshape-studio-export","reshape-admin-help-emails","reshape-marketing-boards"}
CLEANUP_TEXT="**Goal.** A lane of the overtaken audit (Will, 2026-09-21, verbatim in `docs/design/rulings.md` under \"the overtaken audit: reshape or remove, and the stacking rule\"): \"For any open questions that have been 'overtaken', please evaluate whether they should be reshaped or removed\", with his criteria (reshape a question that could still offer a better solution than the earlier selection that overtook it, with updated context; remove only a question with zero potential value; \"I'd rather you lean into reshape if you aren't confident in removal\"; \"everything is unprotected and anything may be re-litigated\"). The Orchestrator read every badged question against the ruling its badge names and judged each: the verdicts for this lane's boards are the brief below, one line per question, and are the whole reading. This is lab work on the boards' own folders: no production byte."
OWNS.update({
"reshape-viewer-curation":["src/app/(dev)/design/sandbox/media-viewer/","src/app/(dev)/design/sandbox/host-curation/"],
"reshape-studio-export":["src/app/(dev)/design/sandbox/export-flow/"],
"reshape-admin-help-emails":["src/app/(dev)/design/sandbox/admin-triage/","src/app/(dev)/design/sandbox/help-center/","src/app/(dev)/design/sandbox/emails/"],
"reshape-marketing-boards":["src/app/(dev)/design/sandbox/site-chrome/","src/app/(dev)/design/sandbox/profile-page/","src/app/(dev)/design/sandbox/privacy-hero/","src/app/(dev)/design/sandbox/album-motion/","src/app/(dev)/design/sandbox/loose-ends/","src/app/(dev)/design/sandbox/contact-page/","src/app/(dev)/design/sandbox/press-page/"],
})
_LAB=["src/app/(dev)/design/sandbox/overtaken.ts","src/components/lab/exploration.ts","src/components/lab/board-spec.ts","src/app/(dev)/design/touchpoints.ts","docs/design/rulings.md","docs/STATUS.md"]
READS.update({
"reshape-viewer-curation":_LAB+["src/components/guest/live-gallery.tsx","src/components/shared/media-lightbox.tsx","src/components/app/event-feed/event-gallery.tsx"],
"reshape-studio-export":_LAB+["src/app/(app)/dashboard/[eventId]/reel/","src/components/app/export/","src/components/guest/live-gallery.tsx"],
"reshape-admin-help-emails":_LAB+["src/app/admin/reports/","content/help/"],
"reshape-marketing-boards":_LAB+["docs/reviews/site-chrome.json","docs/reviews/profile-page.json","docs/reviews/privacy-hero.json","src/components/marketing/chrome/","src/components/shared/arrival.css"],
})
BOARD.update({
"reshape-viewer-curation":"media-viewer    # and host-curation: both reshaped in place, unanswered, at their round; no retirement, no new board",
"reshape-studio-export":"reel-studio     # and export-flow: both reshaped in place, unanswered, at their round; no retirement, no new board",
"reshape-admin-help-emails":"admin-triage    # and help-center, emails: reshaped in place, unanswered, at their round; no retirement, no new board",
"reshape-marketing-boards":"site-chrome     # and profile-page, privacy-hero, album-motion, loose-ends, contact-page, press-page: reshaped in place inside their open rounds; no retirement, no new board",
})
LANE_SECTION.update({"reshape-viewer-curation":r"Lane 62: `reshape-viewer-curation`","reshape-studio-export":r"Lane 63: `reshape-studio-export`","reshape-admin-help-emails":r"Lane 64: `reshape-admin-help-emails`","reshape-marketing-boards":r"Lane 65: `reshape-marketing-boards`"})

def goal_text(track):
    if track in RESHAPE: return RESHAPE_TEXT[track]
    if track in CLEANUP: return CLEANUP_TEXT
    if track in EXPLORE: return EXPLORE_TEXT
    if track in FIXES: return FIX_TEXTS.get(track, FIX_TEXT)
    if track in DOOR: return DOOR_TEXT[track]
    tail=(" His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the\nsection "+('"the sixth batch"' if track in SIXTH else '"the fifth batch"')+"); the Orchestrator's reading of every verdict is below under \"The verdict map\", and this lane's\nbrief follows it. Read the brief end to end before the first edit; where it says \"his to overrule\", build the recommended\nanswer and list it in the Handoff.")
    if track in QUEUE: return QUEUE_TEXT+tail
    return "**Goal.** "+("Will's sixth batch (2026-09-20, build `806695d`) answered the next five boards on the desk and glass round two, and a second paste the same hour answered the demo and the pricing page; this lane is one of eight cut from them, on the seam the Orchestrator landed first." if track in SIXTH else "Will's fifth batch (2026-09-19, build `69a9a17`) answered the four boards at the head of the desk; this lane is one of ten cut from it.")+tail
def tree_of(track):
    if track in RESHAPE or track in FIXES or track in CLEANUP or track in DOOR: return "`"+CUT+"`"
    return "`806695d1`" if track in SIXTH else "`69a9a177`"
def map_text(track):
    if track in DOOR: return "(no verdict map: Will's three points, his addition and his three answers, verbatim in docs/design/rulings.md under \"the door as three steps\"; the brief above is the whole ruling as the approved plan carried it)"
    if track in CLEANUP: return "(no verdict map: the audit's verdicts for this lane's boards are the brief above, one line per question; the rulings they fold in are verbatim in docs/design/rulings.md)"
    if track in RESHAPE: return "(no verdict map: one verdict and a note, verbatim in docs/design/rulings.md under \"the identity reshape\", and his four answers at approval; the brief above is the Orchestrator's whole reading)"
    if track in EXPLORE: return "(no verdict map: an exploration asks; the rules of the exploration shape are in docs/PROGRAM.md and the board precedents in src/app/(dev)/design/sandbox/)"
    if track in QUEUE: return VERDICTS6.split(chr(10),1)[1].strip()
    return (VERDICTS6 if track in SIXTH else VERDICTS).split(chr(10),1)[1].strip()+(chr(10)+chr(10)+SEAM6+chr(10)+chr(10)+SMALL6 if track in SIXTH else "")
OWNS.update({
"verified-email-migration":["supabase/migrations/","src/lib/db/migration-guards.test.ts","src/lib/social/public-profile-visibility.test.ts","src/lib/constants/tiers.test.ts","docs/systems/database-security.md"],
"verified-email-server":["src/app/api/guests/","src/app/api/r2/","src/lib/db/queries/","src/lib/db/mutations/","src/lib/validation/","src/lib/security/","src/lib/forensics/","src/app/admin/forensics/","src/lib/social/cards.ts","src/lib/media/uploader-identity.ts","src/lib/media/uploader-identity.test.ts","src/lib/events/gallery-access.ts","src/lib/events/gallery-access.test.ts","src/lib/events/gallery-access.server.ts","src/lib/events/gallery-fingerprint.ts","src/lib/events/gallery-fingerprint.test.ts","src/lib/r2/grid-items.ts","src/lib/r2/grid-items.email-safety.test.ts","src/lib/event/gallery-items.ts","src/lib/reel/build-reel-props.test.ts","src/components/app/media-grid.tsx","scripts/seed-demo-event.mjs"],
"verified-email-guest":["src/components/guest/","src/lib/guest/","src/app/(guest)/","src/components/shared/media-lightbox.tsx","src/components/shared/media-lightbox.test.tsx","src/components/shared/anonymous-info.tsx","src/components/shared/unverified-mark.tsx","src/components/social/guest-list.tsx","src/components/social/guest-list.test.tsx","src/components/auth/account-door.tsx","src/components/auth/account-door.test.tsx","docs/systems/guest-flow.md","docs/systems/auth-accounts.md"],
"verified-email-host-copy":["src/components/app/event-settings/","src/components/app/event-settings-form.tsx","src/components/app/checkout-button.tsx","src/app/(app)/dashboard/[eventId]/guests/","src/lib/events/guest-experience-summary.ts","src/lib/events/guest-experience-summary.test.ts","src/lib/reel/quick-add.ts","src/lib/reel/quick-add.test.ts","src/lib/reel/engine/assets.ts","src/components/ui/confirm-switch.tsx","src/components/ui/confirm-switch.test.tsx","src/components/marketing/sections/","src/components/marketing/faq-data.ts","src/components/marketing/mock-parity.test.ts","src/app/(marketing)/(cinema)/features/guests/page.tsx","src/lib/constants/marketing-voice.ts","src/lib/constants/legal-terms.tsx","src/lib/constants/legal-privacy.tsx","src/lib/constants/legal.ts","src/lib/content/llms.ts","src/lib/content/help-redirects.ts","content/help/","content/blog/","docs/PRD.md","docs/PRICING.md","docs/systems/host-app.md","docs/systems/profiles-social.md"],
"verified-email-lab":["src/app/(dev)/design/sandbox/guest-verify/","src/app/(dev)/design/sandbox/overtaken.ts","src/app/(dev)/design/sandbox/overtaken.test.ts"],
"guest-capture":["src/app/(dev)/design/sandbox/guest-capture/"],
})
READS.update({
"verified-email-migration":["src/lib/validation/profile.ts","src/lib/db/mutations/guest.ts","src/lib/db/mutations/events.ts","src/app/api/guests/route.ts","src/lib/guest/claim-uploads.ts","src/lib/forensics/capture.ts","docs/systems/guest-flow.md","docs/design/rulings.md"],
"verified-email-server":["src/lib/guest/claim-uploads.ts","src/lib/guest/session-tokens.ts","src/components/guest/enter-event-prompt.tsx","src/components/auth/email-sign-in.tsx","src/components/app/event-settings/uploads-section.tsx","src/lib/constants/tiers.ts","supabase/migrations/","docs/systems/database-security.md","docs/systems/guest-flow.md","docs/design/rulings.md"],
"verified-email-guest":["src/lib/validation/profile.ts","src/lib/validation/upload.ts","src/lib/events/gallery-access.ts","src/lib/media/uploader-identity.ts","src/lib/db/queries/guest-events.ts","src/lib/db/queries/social.ts","src/components/app/media-grid.tsx","src/components/app/user-menu.tsx","src/components/shared/masonry.tsx","src/components/shared/set-name-step.tsx","src/components/social/follow-button.tsx","src/components/ui/","src/lib/constants/marketing-voice.ts","docs/design/rulings.md"],
"verified-email-host-copy":["src/lib/media/uploader-identity.ts","src/lib/validation/event.ts","src/lib/db/queries/social.ts","src/components/shared/media-lightbox.tsx","src/components/social/guest-list.tsx","src/lib/content/blog-redirects.ts","src/lib/content-policy.test.ts","src/lib/no-em-dash-policy.test.ts","next.config.ts","docs/design/rulings.md"],
"verified-email-lab":["docs/reviews/guest-verify.json","docs/ROADMAP.md","docs/design/rulings.md","src/components/lab/exploration.ts","src/components/lab/board-spec.ts","src/app/(dev)/design/sandbox/registry.ts","src/app/(dev)/design/touchpoints.ts","docs/tracks/orchestrator.md"],
"guest-capture":["src/components/guest/save-account-prompt.tsx","src/components/guest/follow-moment-card.tsx","src/components/guest/claim-handle-prompt.tsx","src/components/guest/guest-header.tsx","src/components/shared/unverified-mark.tsx","src/components/social/follow-button.tsx","src/components/social/guest-list.tsx","src/components/auth/account-door.tsx","src/app/(guest)/u/[slug]/","src/components/lab/","docs/design/rulings.md","docs/reviews/README.md"],
})
BOARD.update({
"verified-email-migration":"none            # the identity reshape, wave 0: the schema alone; no board",
"verified-email-server":"none            # the identity reshape, wave 1: the route, the identity, the queries; no board",
"verified-email-guest":"none            # the identity reshape, wave 1: the door, the credit, the capture flow; no board",
"verified-email-host-copy":"none            # the identity reshape, wave 1: the switch and every sentence; no board",
"verified-email-lab":"guest-verify    # retires at this lane's merge (its five asks ruled on his words); the desk pass rides in the same seat",
"guest-capture":"guest-capture   # a new board on his word: registers at the head of DESK_ORDER; the Orchestrator moves it after media-viewer at the merge",
})
LANE_SECTION.update({"verified-email-migration":r"Lane 56: `verified-email-migration`","verified-email-server":r"Lane 57: `verified-email-server`","verified-email-guest":r"Lane 58: `verified-email-guest`","verified-email-host-copy":r"Lane 59: `verified-email-host-copy`","verified-email-lab":r"Lane 60: `verified-email-lab`","guest-capture":r"Lane 61: `guest-capture`"})

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

{goal_text(track)}

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at {tree_of(track)})

{goal}

## The verdict map (every answer of the batch; this lane wires only its own board's)

{map_text(track)}

## The ownership rules every lane follows this round

{rules.split(chr(10),1)[1].strip()}

**Binds.** The bible (`/design/library`), the contracts of every component under a path you own, and the policies;
Will's notes in the ledger and rulings.md; the ownership rules above; CLAUDE.md's working loop (doc-check via Context7
first: Next 16, Tailwind v4, zod v4 and Supabase SSR drift). `DESIGN_PREVIEW_KEY` rides the environment, never a command
line. Never edit a record doc (`docs/CHANGELOG.md`, `STATUS.md`, `ROADMAP.md`, `ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/design/rulings.md`, `docs/reviews/`); a `docs/systems/` fact inside your lane is refined in place and listed below.
Stage explicitly; never `--no-verify` or force-push; the `Co-Authored-By` trailer on every commit.

**Verify on.** For a production lane: the gate on the synced tree (`pnpm design:rules`, the specimen collector
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (10 known warnings on 2026-09-21; the number moves, the exit code is the gate, a warning in a file you touched is yours), `pnpm test`,
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
