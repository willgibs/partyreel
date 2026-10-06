"use client";

/**
 * THE CAMERA, LIVE (disposable-mode r3, Will's picks: `camera=timeline`, `video=hold`, `cost=one`): the picture
 * contained as the phone's own camera keeps it ("the native and expected experience on iPhones"), the reel as a
 * timeline under it, and one shutter, with her count beside it.
 *
 * What lives here is the part that only exists while the camera shows: the phone's picture (`use-camera-stream.ts`),
 * the press (`use-shutter-press.ts`), a video while it rolls and the one line the camera says. Her shots and her roll
 * outlive it, in `album-camera.tsx`, which hands each new shot to the page's one queue.
 *
 * ★ IMMEDIATE, AND SAYS SO (Will's standard: "Everything should feel as immediate/responsive/snappy, and anything
 * taking longer should provide clear state feedback and potential interruptibility"). The frame is caught inside the
 * press itself and the reel moves on in that same frame; only the JPEG's encoding and the upload wait, and both say
 * where they are (the reel's sending dot, the caption's count, a refusal in the server's own words).
 */
import { RefreshCw, SwitchCamera, X, Zap } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";

import {
  AccessPanel,
  RollDonePanel,
} from "@/components/guest/camera/camera-panels";
import { Button } from "@/components/ui/button";
import { CameraReel } from "@/components/guest/camera/camera-reel";
import { CameraShutter } from "@/components/guest/camera/camera-shutter";
import {
  useCameraStream,
  usePageVisible,
} from "@/components/guest/camera/use-camera-stream";
import { useShutterPress } from "@/components/guest/camera/use-shutter-press";
import { accessFromError } from "@/lib/guest/camera/access";
import {
  canvasJpeg,
  drawFrame,
  drawThumb,
  frameSize,
  pipelineStill,
} from "@/lib/guest/camera/capture";
import { filmingProgress, filmingRead } from "@/lib/guest/camera/clock";
import { shotName, stillPath } from "@/lib/guest/camera/frame-math";
import {
  canFilm,
  startFilming,
  type Filming,
} from "@/lib/guest/camera/recorder";
import { reelCells } from "@/lib/guest/camera/reel";
import {
  cameraCount,
  hasTorch,
  microphoneState,
  openMicrophone,
  setTorch,
  stillCaptureFor,
  stillLimits,
  type Facing,
  type StillCapture,
} from "@/lib/guest/camera/stream";
import {
  afterShotHint,
  BACK_TO_ALBUM,
  CAMERA_CONTROLS,
  CAMERA_HINT,
  cameraSubLine,
  unsentLine,
  type CameraReveal,
} from "@/lib/guest/camera/words";
import type { FileExtra } from "@/lib/guest/use-upload-queue";
import { CAMERA_VIDEO_SECONDS } from "@/lib/media/limits";
import { UPLOAD_WORDS } from "@/lib/upload/uploader";
import { cn } from "@/lib/utils";

/** How long a said line stands before the camera's standing line comes back. */
const SAID_MS = 2400;

/** A hold shorter than this, once filming began, is taken as the photo she meant. */
export const MIN_VIDEO_MS = 1000;

/** How long a hold waits on the microphone's answer before it films without sound. */
const MIC_WAIT_MS = 1500;

/** How long the light waits for the picture to expose to it (a torch, or the screen for the front camera). */
const FLASH_SETTLE_MS = 260;

/** Frames still being encoded at once: a guard against a held-down key, never felt by a hand. */
const MAX_ENCODING = 2;

/** A new shot, as the camera hands it up: registered the instant the shutter fires. */
export type NewShot = {
  key: string;
  kind: "photo" | "video";
  takenAt: number;
  seconds?: number;
  /** The frozen frame, drawn inside the press. */
  frozen: HTMLCanvasElement | null;
  /** A picture of it for her list, where the frozen frame cannot be (a video's poster, a phone camera's file). */
  thumb?: Blob;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

type Film = {
  key: string;
  handle: Filming | null;
  audio: MediaStreamTrack | null;
  startedAt: number | null;
  torch: boolean;
  /** What a release before the video began asks for. */
  stop: "photo" | "drop" | null;
};

export function CameraScreen({
  eventName,
  reveal,
  developsAt,
  host,
  left,
  frame,
  caption,
  cap,
  used,
  recent,
  frozen,
  just,
  albumTakesVideo,
  unsent,
  latestRefusal,
  blocked,
  done,
  doneLine,
  freeAFrame,
  reelLabel,
  hidden,
  shutterRef,
  onShot,
  onShotFile,
  onShotLost,
  onRetryUnsent,
  onOpenShots,
  onClose,
}: {
  eventName: string;
  /** Which album the camera shoots for, and its develop time (the line under the name, `cameraSubLine`). */
  reveal: CameraReveal;
  developsAt: string | null;
  /** The host's own camera: no roll binds her shots. */
  host: boolean;
  /** Her frames left (a guest), or her shots this visit (the host). */
  left: number;
  /** The frame the next shot takes. */
  frame: number;
  /** The caption under the reel. */
  caption: string;
  /** Frames on the reel, and how many are spent (`reel.ts`). */
  cap: number;
  used: number;
  /** This visit's counted shots, oldest first: the reel's newest frames. */
  recent: Parameters<typeof reelCells>[0]["recent"];
  frozen: ReadonlyMap<string, HTMLCanvasElement>;
  /** The shots whose frames are sealing just now. */
  just: ReadonlySet<string>;
  /** The album takes a video (a paid plan and the host's Videos on). */
  albumTakesVideo: boolean;
  /**
   * Her shots that did not send: how many, whether a Retry could pass, and whether the connection is why (red-team 53's
   * NIT: the camera never said a dropped one). The line then says the uploader's own sentence, never a count that
   * would read as a broken app.
   */
  unsent: { count: number; retryable: boolean; dropped?: boolean };
  /** The newest refusal of a shot's own file, in the server's words: said once, as it arrives. */
  latestRefusal: { key: string; sentence: string } | null;
  /** A refusal of the album itself, in the server's words: the shutter stops. */
  blocked: string | null;
  /** The roll is spent (the server's sentence is `doneLine`). */
  done: boolean;
  doneLine: string;
  freeAFrame: boolean;
  reelLabel: string;
  /** Her shots are open over the camera: the screen is inert behind them. */
  hidden: boolean;
  shutterRef?: Ref<HTMLButtonElement>;
  onShot: (shot: NewShot) => void;
  onShotFile: (key: string, file: File, extra: FileExtra) => void;
  onShotLost: (key: string) => void;
  onRetryUnsent: () => void;
  onOpenShots: () => void;
  onClose: () => void;
}) {
  const hintId = useId();
  const visible = usePageVisible();
  const [facing, setFacing] = useState<Facing>("environment");
  const [attempt, setAttempt] = useState(0);
  const picture = useCameraStream(visible, facing, attempt);
  const stream = picture.stream;
  const live = picture.access === "live" && stream !== null && stream.active;
  const mirror = picture.facing === "user";
  const track = stream?.getVideoTracks()[0] ?? null;

  /* ── the picture ─────────────────────────────────────────────────────────────────────────── */
  const videoRef = useRef<HTMLVideoElement>(null);
  const pictureRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    if (stream) void video.play().catch(() => {});
  }, [stream]);

  /** The picture's own shape at this moment: what a shot keeps (`cropRect`). */
  const aspectNow = useCallback(() => {
    const el = pictureRef.current;
    return el && el.clientHeight > 0 ? el.clientWidth / el.clientHeight : 3 / 4;
  }, []);

  /* ── what this camera can do: a torch, a second camera, a still pipeline, a video ────────────── */
  const torch = useMemo(() => hasTorch(track), [track]);
  const [cameras, setCameras] = useState(1);
  useEffect(() => {
    if (!stream) return;
    let alive = true;
    void cameraCount().then((n) => {
      if (alive) setCameras(n);
    });
    return () => {
      alive = false;
    };
  }, [stream]);
  const [still, setStill] = useState<{
    track: MediaStreamTrack;
    capture: StillCapture;
    limits: { width: number; height: number; flash: boolean };
  } | null>(null);
  useEffect(() => {
    const capture = stillCaptureFor(track);
    if (!track || !capture) return;
    let alive = true;
    void stillLimits(capture).then((limits) => {
      if (alive && limits) setStill({ track, capture, limits });
    });
    return () => {
      alive = false;
    };
  }, [track]);
  const filmable = useMemo(
    () => albumTakesVideo && canFilm(),
    [albumTakesVideo],
  );
  const [mic, setMic] = useState<"granted" | "denied" | "prompt" | "unknown">(
    "unknown",
  );
  useEffect(() => {
    if (!filmable) return;
    let alive = true;
    void microphoneState().then((state) => {
      if (alive) setMic(state);
    });
    return () => {
      alive = false;
    };
  }, [filmable]);

  // The flash: the torch on a camera that has one, the screen itself for the front camera.
  const canFlash = mirror || torch;
  const [flashOn, setFlashOn] = useState(false);
  const [screenLit, setScreenLit] = useState(false);

  /* ── the line the camera says ─────────────────────────────────────────────────────────────── */
  const [said, setSaid] = useState<{ text: string; key: string } | null>(null);
  const say = useCallback((text: string) => {
    setSaid({ text, key: crypto.randomUUID() });
  }, []);
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(
      () => setSaid((s) => (s?.key === said.key ? null : s)),
      SAID_MS,
    );
    return () => window.clearTimeout(timer);
  }, [said]);
  // A refusal of a shot's own file is said once, in the server's words, the render it arrives (the sanctioned
  // adjust-state-during-render pattern).
  // What was already refused when the camera opened is the failure sheet's, never said again here.
  const [heardRefusal, setHeardRefusal] = useState<string | null>(
    () => latestRefusal?.key ?? null,
  );
  if ((latestRefusal?.key ?? null) !== heardRefusal) {
    setHeardRefusal(latestRefusal?.key ?? null);
    if (latestRefusal?.sentence) {
      setSaid({ text: latestRefusal.sentence, key: latestRefusal.key });
    }
  }

  // The flash over the picture, once a shot (motion only: `camera.css`).
  const [flashes, setFlashes] = useState(0);

  /* ── a photograph ────────────────────────────────────────────────────────────────────────── */
  const canShoot = live && !done && !blocked && !hidden;
  const latest = useRef({
    canShoot,
    flashOn,
    torch,
    mirror,
    track,
    still,
    frame,
  });
  useEffect(() => {
    latest.current = {
      canShoot,
      flashOn,
      torch,
      mirror,
      track,
      still,
      frame,
    };
  });
  const lighting = useRef(false);
  const encoding = useRef(0);
  const stillCanvas = useRef<HTMLCanvasElement | null>(null);
  // A 12 MP canvas holds about 48 MB: given back the moment the camera goes.
  const releaseCanvas = useCallback(() => {
    const canvas = stillCanvas.current;
    if (!canvas) return;
    canvas.width = 0;
    canvas.height = 0;
  }, []);
  useEffect(() => releaseCanvas, [releaseCanvas]);

  const shoot = useCallback(async () => {
    const now = latest.current;
    const video = videoRef.current;
    if (!video || !now.canShoot || lighting.current) return;
    if (encoding.current >= MAX_ENCODING) return;
    const lightTorch = now.flashOn && now.torch && !now.mirror;
    const lightScreen = now.flashOn && now.mirror;
    if (lightTorch || lightScreen) {
      lighting.current = true;
      if (lightScreen) setScreenLit(true);
      if (lightTorch) await setTorch(now.track, true);
      await wait(FLASH_SETTLE_MS);
      lighting.current = false;
    }
    const takenAt = Date.now();
    const key = crypto.randomUUID();
    const aspect = aspectNow();
    const frozenFrame = drawThumb(video, aspect, now.mirror);
    const canvas = (stillCanvas.current ??= document.createElement("canvas"));
    const drawn = drawFrame(video, canvas, aspect, now.mirror);
    if (lightScreen) setScreenLit(false);
    if (lightTorch) void setTorch(now.track, false);
    if (!drawn) {
      say(CAMERA_HINT.shotFailed);
      return;
    }
    // ★ THE MOMENT: registered, flashed and said in the press's own frame; only the JPEG waits.
    onShot({ key, kind: "photo", takenAt, frozen: frozenFrame });
    setFlashes((n) => n + 1);
    say(afterShotHint(now.frame));
    encoding.current += 1;
    try {
      const fromFrame = canvasJpeg(canvas);
      const size = frameSize(video);
      let blob: Blob | null = null;
      if (
        now.still &&
        now.still.track === now.track &&
        size &&
        stillPath({ frame: size, photoMax: now.still.limits }) === "takePhoto"
      ) {
        blob = await pipelineStill({
          capture: now.still.capture,
          limits: now.still.limits,
          flash: now.flashOn && !now.mirror,
          frame: size,
          aspect,
          mirror: now.mirror,
        });
      }
      blob ??= await fromFrame;
      onShotFile(
        key,
        new File([blob], shotName(takenAt, "photo", "image/jpeg"), {
          type: "image/jpeg",
          lastModified: takenAt,
        }),
        // A canvas JPEG keeps no Exif: the moment the shutter fired is its capture time (crumbs-85).
        { takenAt },
      );
    } catch {
      onShotLost(key);
      say(CAMERA_HINT.shotFailed);
    } finally {
      encoding.current -= 1;
    }
  }, [aspectNow, onShot, onShotFile, onShotLost, say]);

  /* ── a video ─────────────────────────────────────────────────────────────────────────────── */
  const [filming, setFilming] = useState<{
    startedAt: number | null;
    /** The video has the microphone (known once it starts). */
    sound?: boolean;
  } | null>(null);
  const film = useRef<Film | null>(null);
  const releasePress = useRef<() => void>(() => {});

  const finishFilm = useCallback(
    (
      ticket: Film,
      result: Parameters<Parameters<typeof startFilming>[0]["onEnd"]>[0],
    ) => {
      ticket.audio?.stop();
      if (ticket.torch) void setTorch(latest.current.track, false);
      if (film.current === ticket) {
        film.current = null;
        setFilming(null);
      }
      // A finger still down when the video ended itself lifts as nothing.
      releasePress.current();
      if (ticket.stop === "photo") {
        void shoot();
        return;
      }
      if (!result) {
        if (ticket.stop !== "drop") say(CAMERA_HINT.videoFailed);
        return;
      }
      const video = videoRef.current;
      const takenAt = ticket.startedAt ?? Date.now();
      onShot({
        key: ticket.key,
        kind: "video",
        takenAt,
        seconds: result.seconds,
        frozen: video
          ? drawThumb(video, aspectNow(), latest.current.mirror)
          : null,
        thumb: result.poster ?? undefined,
      });
      setFlashes((n) => n + 1);
      say(CAMERA_HINT.afterVideo);
      onShotFile(
        ticket.key,
        new File([result.blob], shotName(takenAt, "video", result.type), {
          type: result.type,
          lastModified: takenAt,
        }),
        result.poster ? { poster: result.poster, takenAt } : { takenAt },
      );
    },
    [aspectNow, onShot, onShotFile, say, shoot],
  );

  const filmStart = useCallback(async () => {
    const video = videoRef.current;
    const now = latest.current;
    if (!video || !stream || !now.canShoot) return;
    const ticket: Film = {
      key: crypto.randomUUID(),
      handle: null,
      audio: null,
      startedAt: null,
      torch: false,
      stop: null,
    };
    film.current = ticket;
    setFilming({ startedAt: null });
    /* ★ THE MICROPHONE, ASKED ONLY NOW, AND NEVER WAITED ON FOR LONG. Its first ask is the phone's own prompt; an ask
       that has not answered inside `MIC_WAIT_MS` (a prompt still up, a browser that never answers) films this video
       without sound rather than holding the shutter red with nothing recording, and a late grant is let go of here
       and used by the next video. */
    let audio: MediaStreamTrack | null = null;
    if (mic !== "denied") {
      const asked = openMicrophone().then(
        (track) => ({ track }),
        (error: unknown) => ({ error }),
      );
      const answer = await Promise.race([
        asked,
        wait(MIC_WAIT_MS).then(() => "late" as const),
      ]);
      if (answer === "late") {
        void asked.then((late) => {
          if ("track" in late) {
            late.track?.stop();
            setMic("granted");
          } else if (accessFromError(late.error) === "denied") setMic("denied");
        });
      } else if ("track" in answer) {
        audio = answer.track;
        setMic("granted");
      } else if (accessFromError(answer.error) === "denied") {
        setMic("denied");
      }
    }
    if (film.current !== ticket) {
      // Let go (or taken away) while the microphone was asked: `filmStop` already took the photo, or nothing.
      audio?.stop();
      return;
    }
    ticket.audio = audio;
    if (now.flashOn && now.torch && !now.mirror) {
      ticket.torch = await setTorch(now.track, true);
      if (film.current !== ticket) {
        audio?.stop();
        if (ticket.torch) void setTorch(now.track, false);
        return;
      }
    }
    const handle = startFilming({
      video,
      stream,
      aspect: aspectNow(),
      mirror: now.mirror,
      audio,
      maxMs: CAMERA_VIDEO_SECONDS * 1000,
      onStart: (at) => {
        ticket.startedAt = at;
        if (film.current === ticket) {
          setFilming({ startedAt: at, sound: audio !== null });
        }
      },
      onEnd: (result) => finishFilm(ticket, result),
    });
    if (!handle) {
      audio?.stop();
      if (ticket.torch) void setTorch(now.track, false);
      film.current = null;
      setFilming(null);
      say(CAMERA_HINT.videoFailed);
      return;
    }
    ticket.handle = handle;
  }, [aspectNow, finishFilm, mic, say, stream]);

  const filmStop = useCallback(
    (cancelled: boolean) => {
      const ticket = film.current;
      if (!ticket) return;
      if (!ticket.handle) {
        // Let go before the video began (the microphone still answering): the photo she meant, now, or nothing.
        film.current = null;
        setFilming(null);
        if (!cancelled) void shoot();
        return;
      }
      const began = ticket.startedAt;
      if (!cancelled && (began === null || Date.now() - began < MIN_VIDEO_MS)) {
        // A hold just past the threshold was a photo she meant: the scrap of video goes.
        ticket.stop = "photo";
        ticket.handle.cancel();
        return;
      }
      ticket.handle.stop();
    },
    [shoot],
  );

  // The camera going (closed, the page hidden) keeps the video it was filming.
  const keepFilming = useCallback(() => film.current?.handle?.stop(), []);
  useEffect(() => {
    if (visible && !hidden) return;
    keepFilming();
  }, [visible, hidden, keepFilming]);
  useEffect(() => keepFilming, [keepFilming]);

  const press = useShutterPress({
    canFilm: filmable && live,
    disabled: !canShoot && !filming,
    onPhoto: () => void shoot(),
    onFilmStart: () => void filmStart(),
    onFilmStop: filmStop,
  });
  useEffect(() => {
    releasePress.current = press.release;
  });

  // The clock while a video rolls.
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!filming?.startedAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 200);
    return () => window.clearInterval(timer);
  }, [filming?.startedAt]);
  const elapsed =
    filming?.startedAt && now ? Math.max(0, now - filming.startedAt) : 0;
  const progress = filming?.startedAt
    ? filmingProgress(elapsed)
    : filming
      ? 0
      : null;

  /* ── the phone's own camera, where this one cannot open ──────────────────────────────────── */
  const phoneCamera = useRef<HTMLInputElement>(null);
  const tookWithPhone = (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const key = crypto.randomUUID();
    const takenAt = Date.now();
    onShot({ key, kind: "photo", takenAt, frozen: null, thumb: file });
    // The phone's own camera writes its Exif, which wins; this is the fallback where it wrote none.
    onShotFile(key, file, { takenAt });
    say(afterShotHint(frame));
  };

  /* ── what the camera says ────────────────────────────────────────────────────────────────── */
  const hint = filming
    ? filming.startedAt === null
      ? mic === "granted" || mic === "denied"
        ? CAMERA_HINT.letGo
        : CAMERA_HINT.askMic
      : filming.sound
        ? CAMERA_HINT.letGo
        : CAMERA_HINT.letGoSilent
    : (said?.text ??
      (blocked || done || !live
        ? ""
        : unsent.count > 0
          ? unsent.dropped
            ? UPLOAD_WORDS.dropped
            : unsentLine(unsent.count)
          : filmable
            ? CAMERA_HINT.tapOrHold
            : CAMERA_HINT.tap));
  const showRetry = !filming && !said && unsent.count > 0 && unsent.retryable;
  const shutterLabel = filmable
    ? CAMERA_CONTROLS.shutterOrFilm
    : CAMERA_CONTROLS.shutter;

  return (
    <div
      className="cam-screen"
      data-cam-screen=""
      data-filming={filming ? "" : undefined}
      inert={hidden}
    >
      {/* ── the bar: close, whose camera, the flash ─────────────────────────────────────────── */}
      <div className="cam-bar">
        <Button
          type="button"
          variant="glass"
          size="icon-cta"
          onClick={onClose}
          aria-label={BACK_TO_ALBUM}
        >
          <X aria-hidden />
        </Button>
        <div className="min-w-0 px-3 text-center">
          <p className="truncate font-heading text-card-title text-white">
            {eventName}
          </p>
          <p className="truncate text-micro text-white/60" data-cam-sub="">
            {cameraSubLine({
              reveal,
              developsAt,
              recording: filming !== null,
              done,
            })}
          </p>
        </div>
        {canFlash ? (
          <Button
            type="button"
            variant="glass"
            size="icon-cta"
            onClick={() => setFlashOn((on) => !on)}
            aria-pressed={flashOn}
            aria-label={CAMERA_CONTROLS.flash}
            className={cn(flashOn && "cam-flash-on")}
          >
            <Zap className={cn(flashOn && "fill-current")} aria-hidden />
          </Button>
        ) : (
          <span aria-hidden className="size-11" />
        )}
      </div>

      {/* ── the picture, contained ─────────────────────────────────────────────────────────── */}
      <div ref={pictureRef} className="cam-picture" data-cam-picture="">
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          disablePictureInPicture
          aria-hidden
          className={cn(
            "size-full object-cover",
            mirror && "-scale-x-100",
            picture.facing !== facing && "cam-picture-turning",
          )}
        />
        {flashes > 0 && (
          <span key={flashes} aria-hidden className="cam-flash" />
        )}
        {filming && (
          <span className="cam-rec" data-cam-rec="">
            <span className="cam-rec-dot" aria-hidden />
            {filmingRead(elapsed)}
          </span>
        )}
        {!live && picture.access !== "live" && (
          <AccessPanel
            access={picture.access}
            onRetry={() => setAttempt((n) => n + 1)}
            onPhoneCamera={() => phoneCamera.current?.click()}
          />
        )}
        {live && done && (
          <RollDonePanel
            line={doneLine}
            freeAFrame={freeAFrame}
            onShots={onOpenShots}
            onBack={onClose}
          />
        )}
        {blocked && !done && (
          <p className="cam-banner" role="status">
            {blocked}
          </p>
        )}
      </div>

      {/* ── the reel and its caption ────────────────────────────────────────────────────────── */}
      <div className="cam-roll">
        <CameraReel
          cells={reelCells({ cap, used, recording: filming !== null, recent })}
          stream={stream}
          mirror={mirror}
          frozen={frozen}
          just={just}
          progress={filming ? progress : null}
          label={reelLabel}
          onOpen={onOpenShots}
        />
        <p className="cam-caption" data-cam-caption="">
          {caption}
        </p>
      </div>

      {/* ── the count, the shutter, the turn ───────────────────────────────────────────────── */}
      <div className="cam-controls" data-off={done || blocked ? "" : undefined}>
        <div className="cam-count" data-cam-count="">
          <p className="font-heading text-page leading-none text-white tabular-nums">
            {left}
          </p>
          <p className="mt-1 text-caption text-white/60">
            {host ? CAMERA_CONTROLS.taken : CAMERA_CONTROLS.left}
          </p>
        </div>
        <CameraShutter
          ref={shutterRef}
          handlers={press.handlers}
          pressed={press.pressed}
          filming={filming !== null}
          progress={progress}
          disabled={!canShoot && !filming}
          label={shutterLabel}
          describedBy={hintId}
        />
        {cameras > 1 ? (
          <Button
            type="button"
            variant="glass"
            size="icon-cta"
            onClick={() =>
              setFacing((f) => (f === "environment" ? "user" : "environment"))
            }
            disabled={filming !== null}
            aria-label={CAMERA_CONTROLS.turn}
            className="cam-turn"
          >
            <SwitchCamera aria-hidden />
          </Button>
        ) : (
          <span aria-hidden className="cam-turn size-11" />
        )}
        <div className="cam-hint">
          <p id={hintId} aria-live="polite" data-cam-hint="">
            {hint}
          </p>
          {showRetry && (
            <button
              type="button"
              onClick={onRetryUnsent}
              className="cam-hint-action press-shrink focus-halo"
            >
              <RefreshCw className="size-3.5" aria-hidden />
              {CAMERA_HINT.retry}
            </button>
          )}
        </div>
      </div>

      {/* The phone's own camera, one shot at a time, where this one cannot open (clicked inside the tap). */}
      <input
        ref={phoneCamera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => tookWithPhone(e.currentTarget)}
      />
      {screenLit && <span aria-hidden className="cam-screen-flash" />}
    </div>
  );
}
