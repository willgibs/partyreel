"use client";

import { ImageUp, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Glow, type GlowDrive, type GlowShape } from "@/components/shared/glow";
import { Kbd } from "@/components/shared/kbd";
import { Logo } from "@/components/shared/logo";
import { PlayBadge } from "@/components/shared/play-badge";
import { Caption } from "@/components/marketing/system/caption";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import {
  PageHero,
  type HeroEntrance,
  type HeroScale,
} from "@/components/marketing/system/page-hero";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { ConfigPanel, type PlaygroundDef } from "./knobs";

/**
 * THE PLAYGROUNDS: one declaration per configurable component, resolved by id.
 *
 * An entry names a playground with `play: "<id>"` and the family page mounts
 * it; the panel itself is knobs.tsx. A def is DATA, so adding one is about ten
 * lines and no new component. The string id is what lets a SERVER page mount a
 * CLIENT panel without handing a function across the boundary.
 *
 * The variant lists here are the same ones the entry declares, and
 * gallery.test.ts checks both against the component's source: a variant added
 * to a cva block and not to the gallery fails the gate.
 */

const PLAYGROUNDS: Record<string, PlaygroundDef> = {
  button: {
    name: "Button",
    defaults: { variant: "default", size: "default", disabled: false },
    knobs: [
      {
        kind: "select",
        prop: "variant",
        options: [
          "default",
          "outline",
          "secondary",
          "ghost",
          "destructive",
          "link",
        ],
        value: "default",
      },
      {
        kind: "select",
        prop: "size",
        options: [
          "xs",
          "sm",
          "default",
          "lg",
          "icon",
          "icon-xs",
          "icon-sm",
          "icon-lg",
        ],
        value: "default",
      },
      { kind: "toggle", prop: "disabled", value: false },
      { kind: "toggle", prop: "icon", label: "Leading icon", value: false },
      { kind: "text", prop: "children", label: "Label", value: "Add photos" },
    ],
    code: (v) => {
      const props = [
        v.variant === "default" ? "" : `variant="${v.variant}"`,
        v.size === "default" ? "" : `size="${v.size}"`,
        v.disabled ? "disabled" : "",
      ].filter(Boolean);
      const inner = `${v.icon ? "<ImageUp /> " : ""}${v.children}`;
      return `<Button${props.length ? " " + props.join(" ") : ""}>${inner}</Button>`;
    },
    render: (v) => {
      const iconOnly = String(v.size).startsWith("icon");
      return (
        <Button
          variant={v.variant as "default"}
          size={v.size as "default"}
          disabled={Boolean(v.disabled)}
          aria-label={iconOnly ? String(v.children) : undefined}
        >
          {iconOnly ? <Plus /> : null}
          {!iconOnly && v.icon ? <ImageUp /> : null}
          {!iconOnly && String(v.children)}
        </Button>
      );
    },
  },

  badge: {
    name: "Badge",
    defaults: { variant: "default" },
    knobs: [
      {
        kind: "select",
        prop: "variant",
        options: [
          "default",
          "secondary",
          "destructive",
          "outline",
          "ghost",
          "link",
        ],
        value: "default",
      },
      { kind: "text", prop: "children", label: "Label", value: "Needs review" },
    ],
    render: (v) => (
      <Badge variant={v.variant as "default"}>{String(v.children)}</Badge>
    ),
  },

  avatar: {
    name: "Avatar",
    defaults: { size: "default" },
    knobs: [
      {
        kind: "select",
        prop: "size",
        options: ["sm", "default", "lg"],
        value: "default",
      },
      { kind: "text", prop: "children", label: "Initials", value: "MJ" },
    ],
    code: (v) =>
      `<Avatar${v.size === "default" ? "" : ` size="${v.size}"`}>\n  <AvatarFallback>${v.children}</AvatarFallback>\n</Avatar>`,
    render: (v) => (
      <Avatar size={v.size as "default"}>
        <AvatarFallback>{String(v.children)}</AvatarFallback>
      </Avatar>
    ),
  },

  progress: {
    name: "Progress",
    knobs: [
      {
        kind: "range",
        prop: "value",
        value: 62,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
      },
    ],
    render: (v) => (
      <div className="w-full max-w-xs">
        <Progress value={Number(v.value)} />
      </div>
    ),
  },

  "empty-state": {
    name: "EmptyState",
    defaults: { variant: "icon", action: false },
    knobs: [
      {
        kind: "select",
        prop: "variant",
        options: ["quiet", "icon"],
        value: "quiet",
      },
      { kind: "text", prop: "title", value: "No photos yet" },
      {
        kind: "text",
        prop: "description",
        value: "Share your QR code and they will land here.",
      },
      { kind: "toggle", prop: "action", label: "With action", value: false },
    ],
    code: (v) =>
      [
        "<EmptyState",
        v.variant === "icon" ? "" : `  variant="${v.variant}"`,
        v.variant === "icon" ? "  icon={ImageUp}" : "",
        `  title="${v.title}"`,
        `  description="${v.description}"`,
        v.action ? '  action={<Button size="sm">Add photos</Button>}' : "",
        "/>",
      ]
        .filter(Boolean)
        .join("\n"),
    render: (v) => (
      <EmptyState
        variant={v.variant as "quiet"}
        icon={v.variant === "icon" ? ImageUp : undefined}
        title={String(v.title)}
        description={String(v.description)}
        action={v.action ? <Button size="sm">Add photos</Button> : undefined}
      />
    ),
  },

  "play-badge": {
    name: "PlayBadge",
    defaults: { size: "md" },
    knobs: [
      { kind: "select", prop: "size", options: ["md", "lg"], value: "md" },
    ],
    wellClassName: "bg-gallery",
    render: (v) => (
      <div className="relative size-40 overflow-hidden rounded-tile bg-gallery-muted">
        <PlayBadge size={v.size as "md"} />
      </div>
    ),
  },

  logo: {
    name: "Logo",
    defaults: { markOnly: false },
    knobs: [{ kind: "toggle", prop: "markOnly", value: false }],
    render: (v) => <Logo markOnly={Boolean(v.markOnly)} />,
  },

  kbd: {
    name: "Kbd",
    knobs: [{ kind: "text", prop: "children", label: "Key", value: "Esc" }],
    render: (v) => <Kbd>{String(v.children)}</Kbd>,
  },

  glow: {
    name: "Glow",
    defaults: { drive: "mask", edge: false },
    knobs: [
      {
        kind: "select",
        prop: "shape",
        options: ["seam", "throw", "sweep", "bloom", "halo"],
        value: "seam",
      },
      {
        kind: "select",
        prop: "drive",
        options: ["mask", "transform", "scalar"],
        value: "mask",
      },
      { kind: "toggle", prop: "edge", label: "Edge beam", value: false },
      {
        kind: "range",
        prop: "strength",
        label: "Strength (--glw-strength)",
        value: 0.62,
        min: 0,
        max: 1,
        step: 0.01,
      },
    ],
    code: (v) =>
      `<Glow shape="${v.shape}"${v.drive === "mask" ? "" : ` drive="${v.drive}"`}${
        v.edge ? " edge" : ""
      } vars={{ "--glw-strength": "${v.strength}" }} />`,
    wellClassName: "bg-gallery p-0",
    render: (v) => (
      <div className="relative isolate flex min-h-56 w-full items-end justify-center overflow-hidden bg-gallery p-8 text-gallery-foreground">
        <Glow
          shape={v.shape as GlowShape}
          drive={v.drive as GlowDrive}
          edge={Boolean(v.edge)}
          vars={{
            "--glw-base": String(v.strength),
            "--glw-strength": String(v.strength),
          }}
        />
        <p className="relative font-heading text-xl">Every guest, one album.</p>
      </div>
    ),
  },

  "page-hero": {
    name: "PageHero",
    defaults: { scale: "lg", align: "center", entrance: "rise" },
    skin: "marketing",
    knobs: [
      {
        kind: "select",
        prop: "scale",
        options: ["display", "xl", "lg"],
        value: "lg",
      },
      {
        kind: "select",
        prop: "align",
        options: ["center", "left"],
        value: "center",
      },
      {
        kind: "select",
        prop: "entrance",
        options: ["rise", "cut", "blur"],
        value: "rise",
      },
      { kind: "text", prop: "heading", value: "Press" },
      { kind: "toggle", prop: "eyebrow", label: "With eyebrow", value: true },
    ],
    code: (v) =>
      [
        "<PageHero",
        v.scale === "lg" ? "" : `  scale="${v.scale}"`,
        v.align === "center" ? "" : `  align="${v.align}"`,
        v.entrance === "rise" ? "" : `  entrance="${v.entrance}"`,
        v.eyebrow ? '  eyebrow="Media assets"' : "",
        `  heading="${v.heading}"`,
        '  subhead="Everything a writer needs, in one place."',
        "/>",
      ]
        .filter(Boolean)
        .join("\n"),
    wellClassName: "block p-0",
    render: (v) => (
      <PageHero
        scale={v.scale as HeroScale}
        align={v.align as "center"}
        entrance={v.entrance as HeroEntrance}
        eyebrow={v.eyebrow ? "Media assets" : undefined}
        heading={String(v.heading)}
        subhead="Everything a writer needs, in one place."
      />
    ),
  },

  "section-shell": {
    name: "SectionShell",
    defaults: {
      align: "center",
      width: "default",
      reveal: "standard",
      scale: "default",
    },
    skin: "marketing",
    knobs: [
      {
        kind: "select",
        prop: "align",
        options: ["center", "left"],
        value: "center",
      },
      {
        kind: "select",
        prop: "width",
        options: ["default", "narrow", "wide"],
        value: "default",
      },
      {
        kind: "select",
        prop: "reveal",
        options: ["cinema", "standard", "none"],
        value: "standard",
      },
      {
        kind: "select",
        prop: "scale",
        options: ["default", "lg"],
        value: "default",
      },
    ],
    wellClassName: "block p-0",
    render: (v) => (
      <SectionShell
        align={v.align as "center"}
        width={v.width as "default"}
        reveal={v.reveal as "standard"}
        scale={v.scale as "default"}
        eyebrow="The shell"
        heading="Every guest, one album."
        subhead="One section wrapper: the eyebrow, the heading, the subhead and the reveal that carries them in."
      />
    ),
  },

  eyebrow: {
    name: "Eyebrow",
    knobs: [
      { kind: "text", prop: "children", label: "Text", value: "How it works" },
    ],
    skin: "marketing",
    render: (v) => <Eyebrow>{String(v.children)}</Eyebrow>,
  },

  caption: {
    name: "Caption",
    knobs: [
      {
        kind: "text",
        prop: "children",
        label: "Text",
        value: "Every label, hint and descriptor on the site.",
      },
    ],
    skin: "marketing",
    render: (v) => <Caption>{String(v.children)}</Caption>,
  },
};

/** The server pages mount this by id; the def never crosses the boundary. */
export function Playground({ id }: { id: string }) {
  const def = PLAYGROUNDS[id];
  if (!def) return null;
  return <ConfigPanel def={def} />;
}
