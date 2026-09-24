import { describe, expect, it, vi } from "vitest";

import {
  PHOTO_PARAM,
  SHARE_FILE_MAX_BYTES,
  canShareFileNamed,
  copyText,
  detectPlatform,
  fetchMediaFile,
  filenameFor,
  mimeForName,
  photoLink,
  readPhotoParam,
  saveChoices,
  saveToPhotos,
  shareFile,
  shareLink,
  shareMedia,
  withPhotoParam,
  type NavigatorLike,
} from "./share-save";

/**
 * The share-and-save decision tree, over mocked navigators: every branch a real
 * phone or desk can take, with no browser. What is held is the ORDER Will asked
 * for (the picture itself, then the link, then a copy; Photos first on iOS) and
 * the two rules a device cannot show a test: the file is fetched on the tap and
 * never cached, and a lapsed tap comes back as a file in hand, never a failure.
 */

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const IPAD_AS_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
const PIXEL =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36";
const MAC_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

const SAVE_URL =
  "https://r2.test/events/e/m.jpg?X-Amz-Signature=abc&response-content-disposition=attachment%3B%20filename%3D%22maya-jay-ab12cd34.jpg%22";

function okResponse(body: string, type: string, length?: number) {
  const headers = new Headers({ "content-type": type });
  if (length !== undefined) headers.set("content-length", String(length));
  return new Response(body, { status: 200, headers });
}

function domError(name: string) {
  const e = new Error(name);
  e.name = name;
  return e;
}

/** A navigator whose sheet takes files, with an activation that is still live. */
function phoneNav(overrides: Partial<NavigatorLike> = {}): NavigatorLike {
  return {
    userAgent: IPHONE,
    maxTouchPoints: 5,
    share: vi.fn(async () => {}),
    canShare: vi.fn(() => true),
    clipboard: { writeText: vi.fn(async () => {}) },
    userActivation: { isActive: true },
    ...overrides,
  };
}

describe("the photograph's address", () => {
  it("reads a media id off the album's search, and nothing wider", () => {
    expect(readPhotoParam("?photo=3f1c2a9e-1b2c-4d5e-8f90-a1b2c3d4e5f6")).toBe(
      "3f1c2a9e-1b2c-4d5e-8f90-a1b2c3d4e5f6",
    );
    expect(readPhotoParam("?reel&photo=abc_123")).toBe("abc_123");
    expect(readPhotoParam("")).toBeNull();
    expect(readPhotoParam("?photo=")).toBeNull();
    expect(readPhotoParam("?photo=%3Cscript%3E")).toBeNull();
    expect(readPhotoParam(`?photo=${"a".repeat(65)}`)).toBeNull();
  });

  it("names and unnames the photograph with every other param, as written, and the hash kept", () => {
    const href = "https://partyreel.com/e/tok?reel&utm=qr#album";
    expect(withPhotoParam(href, "p2")).toBe(
      "/e/tok?reel&utm=qr&photo=p2#album",
    );
    expect(
      withPhotoParam("https://partyreel.com/e/tok?photo=p2&reel", null),
    ).toBe("/e/tok?reel");
    expect(withPhotoParam("https://partyreel.com/e/tok?photo=p2", null)).toBe(
      "/e/tok",
    );
    // Renaming replaces rather than appends a second one.
    expect(withPhotoParam("https://partyreel.com/e/tok?photo=p1", "p2")).toBe(
      "/e/tok?photo=p2",
    );
  });

  it("builds the PUBLIC album link that opens on the photograph", () => {
    expect(photoLink("https://partyreel.com/e/tok", "p2")).toBe(
      `https://partyreel.com/e/tok?${PHOTO_PARAM}=p2`,
    );
    expect(photoLink("https://partyreel.com/e/tok?src=qr", "p2")).toBe(
      "https://partyreel.com/e/tok?src=qr&photo=p2",
    );
    // A relative album link still gets the parameter, never a crash.
    expect(photoLink("/e/tok", "p2")).toBe("/e/tok?photo=p2");
  });
});

describe("which save story a device lives in", () => {
  it("tells iOS, an iPad asking for the desktop site, Android and a desk apart", () => {
    expect(detectPlatform({ userAgent: IPHONE })).toBe("ios");
    expect(detectPlatform({ userAgent: IPAD_AS_MAC, maxTouchPoints: 5 })).toBe(
      "ios",
    );
    expect(detectPlatform({ userAgent: IPAD_AS_MAC, maxTouchPoints: 0 })).toBe(
      "desktop",
    );
    expect(detectPlatform({ userAgent: PIXEL })).toBe("android");
    expect(detectPlatform({ userAgent: MAC_CHROME })).toBe("desktop");
    expect(detectPlatform({})).toBe("desktop");
  });

  it("offers Save to Photos first on iOS, and the download alone everywhere else", () => {
    expect(saveChoices("ios")).toEqual(["photos", "file"]);
    expect(saveChoices("android")).toEqual(["file"]);
    expect(saveChoices("desktop")).toEqual(["file"]);
  });
});

describe("the file", () => {
  it("travels under the server's signed save name, else a plain fallback", () => {
    expect(
      filenameFor({ id: "ab12cd34ef", type: "photo", downloadUrl: SAVE_URL }),
    ).toBe("maya-jay-ab12cd34.jpg");
    expect(filenameFor({ id: "ab12cd34ef", type: "video" })).toBe(
      "partyreel-ab12cd34.mp4",
    );
    expect(
      filenameFor({
        id: "ab12cd34ef",
        type: "photo",
        downloadUrl: "not a url",
      }),
    ).toBe("partyreel-ab12cd34.jpg");
  });

  it("knows the MIME every accepted extension promises", () => {
    expect(mimeForName("a.jpg")).toBe("image/jpeg");
    expect(mimeForName("a.JPEG")).toBe("image/jpeg");
    expect(mimeForName("a.heic")).toBe("image/heic");
    expect(mimeForName("a.mov")).toBe("video/quicktime");
    expect(mimeForName("a.mp4")).toBe("video/mp4");
    expect(mimeForName("a.txt")).toBe("");
  });

  it("fetches with CORS and never through the HTTP cache a tile may have poisoned", async () => {
    const fetchMock = vi.fn(async () =>
      okResponse("jpegbytes", "image/jpeg", 9),
    );
    const got = await fetchMediaFile(SAVE_URL, "maya-jay-ab12cd34.jpg", {
      fetch: fetchMock as unknown as typeof fetch,
    });
    expect(got.kind).toBe("file");
    expect(fetchMock).toHaveBeenCalledWith(
      SAVE_URL,
      expect.objectContaining({ mode: "cors", cache: "no-store" }),
    );
    if (got.kind === "file") {
      expect(got.file.name).toBe("maya-jay-ab12cd34.jpg");
      expect(got.file.type).toBe("image/jpeg");
      expect(got.file.size).toBe(9);
    }
  });

  it("stops at a declared length over the cap before holding the body", async () => {
    const blob = vi.fn();
    const res = okResponse("x", "video/mp4", SHARE_FILE_MAX_BYTES + 1);
    Object.defineProperty(res, "blob", { value: blob });
    const got = await fetchMediaFile("u", "clip.mp4", {
      fetch: (async () => res) as unknown as typeof fetch,
    });
    expect(got).toEqual({ kind: "too-large" });
    expect(blob).not.toHaveBeenCalled();
  });

  it("drops a body that turns out over the cap", async () => {
    const got = await fetchMediaFile("u", "clip.mp4", {
      fetch: (async () =>
        okResponse("123456", "video/mp4")) as unknown as typeof fetch,
      maxBytes: 4,
    });
    expect(got).toEqual({ kind: "too-large" });
  });

  it("answers failed on a refusal or a broken read, and aborted when the viewer moved on", async () => {
    expect(
      await fetchMediaFile("u", "a.jpg", {
        fetch: (async () =>
          new Response("", { status: 403 })) as unknown as typeof fetch,
      }),
    ).toEqual({ kind: "failed" });
    expect(
      await fetchMediaFile("u", "a.jpg", {
        fetch: (async () => {
          throw new TypeError("Failed to fetch");
        }) as unknown as typeof fetch,
      }),
    ).toEqual({ kind: "failed" });
    const ctl = new AbortController();
    ctl.abort();
    expect(
      await fetchMediaFile("u", "a.jpg", {
        fetch: vi.fn() as unknown as typeof fetch,
        signal: ctl.signal,
      }),
    ).toEqual({ kind: "aborted" });
  });
});

describe("the system sheet", () => {
  const file = new File(["x"], "a.jpg", { type: "image/jpeg" });

  it("asks whether it takes the type before any fetch, with an empty stand-in", () => {
    const nav = phoneNav();
    expect(canShareFileNamed("a.jpg", nav)).toBe(true);
    const asked = (nav.canShare as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(asked.files[0].size).toBe(0);
    expect(asked.files[0].type).toBe("image/jpeg");
    expect(canShareFileNamed("a.jpg", phoneNav({ canShare: undefined }))).toBe(
      false,
    );
    expect(canShareFileNamed("a.txt", phoneNav())).toBe(false);
  });

  it("sends the real file after asking with it", async () => {
    const nav = phoneNav();
    expect(await shareFile(file, nav)).toEqual({ kind: "shared" });
    expect(nav.canShare).toHaveBeenCalledWith({ files: [file] });
    expect(nav.share).toHaveBeenCalledWith({ files: [file] });
  });

  it("hands back the file for one more tap when the activation lapsed, before or during the call", async () => {
    const lapsed = phoneNav({ userActivation: { isActive: false } });
    expect(await shareFile(file, lapsed)).toEqual({ kind: "needs-tap", file });
    expect(lapsed.share).not.toHaveBeenCalled();

    const refused = phoneNav({
      share: vi.fn(async () => {
        throw domError("NotAllowedError");
      }),
    });
    expect(await shareFile(file, refused)).toEqual({ kind: "needs-tap", file });
  });

  it("treats a dismissed sheet as a choice, not a failure", async () => {
    const nav = phoneNav({
      share: vi.fn(async () => {
        throw domError("AbortError");
      }),
    });
    expect(await shareFile(file, nav)).toEqual({ kind: "cancelled" });
  });

  it("shares a link through the sheet, else copies it, else says so", async () => {
    const withSheet = phoneNav();
    expect(await shareLink("https://x/e/t?photo=p", withSheet)).toEqual({
      kind: "shared",
    });
    const noSheet = phoneNav({ share: undefined });
    expect(await shareLink("https://x/e/t?photo=p", noSheet)).toEqual({
      kind: "copied",
    });
    expect(noSheet.clipboard?.writeText).toHaveBeenCalledWith(
      "https://x/e/t?photo=p",
    );
    expect(
      await shareLink("u", {
        clipboard: {
          writeText: async () => {
            throw new Error("denied");
          },
        },
      }),
    ).toEqual({ kind: "failed" });
    expect(await copyText("u", {})).toBe(false);
  });
});

describe("Share, on its tap", () => {
  const fetchJpeg = vi.fn(async () => okResponse("jpegbytes", "image/jpeg", 9));

  it("sends the picture itself first", async () => {
    const nav = phoneNav();
    const out = await shareMedia(
      {
        fileUrl: SAVE_URL,
        name: "maya-jay-ab12cd34.jpg",
        link: "https://x/e/t?photo=p",
      },
      { nav, fetch: fetchJpeg as unknown as typeof fetch },
    );
    expect(out).toEqual({ kind: "shared-file" });
    const sent = (nav.share as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sent.files[0].name).toBe("maya-jay-ab12cd34.jpg");
    expect(sent.url).toBeUndefined();
  });

  it("falls back to the link when the sheet takes no file of this type, without fetching", async () => {
    const fetchSpy = vi.fn();
    const nav = phoneNav({ canShare: vi.fn(() => false) });
    const out = await shareMedia(
      { fileUrl: SAVE_URL, name: "a.heic", link: "https://x/e/t?photo=p" },
      { nav, fetch: fetchSpy as unknown as typeof fetch },
    );
    expect(out).toEqual({ kind: "shared-link" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(nav.share).toHaveBeenCalledWith({ url: "https://x/e/t?photo=p" });
  });

  it("falls back to the link for a clip over the cap", async () => {
    const nav = phoneNav();
    const out = await shareMedia(
      { fileUrl: "u", name: "clip.mp4", link: "https://x/e/t" },
      {
        nav,
        fetch: (async () =>
          okResponse(
            "x",
            "video/mp4",
            SHARE_FILE_MAX_BYTES + 1,
          )) as unknown as typeof fetch,
      },
    );
    expect(out).toEqual({ kind: "shared-link" });
  });

  it("copies the link where there is no sheet at all", async () => {
    const nav = phoneNav({ share: undefined, canShare: undefined });
    const out = await shareMedia(
      { fileUrl: SAVE_URL, name: "a.jpg", link: "https://x/e/t?photo=p" },
      { nav },
    );
    expect(out).toEqual({ kind: "copied" });
  });

  it("comes back ready, file in hand, when the fetch outlived the tap", async () => {
    const nav = phoneNav({ userActivation: { isActive: false } });
    const out = await shareMedia(
      { fileUrl: SAVE_URL, name: "a.jpg", link: "https://x/e/t" },
      { nav, fetch: fetchJpeg as unknown as typeof fetch },
    );
    expect(out.kind).toBe("needs-tap");
    expect(nav.share).not.toHaveBeenCalled();
  });

  it("fails honestly with no file path and no link", async () => {
    const nav = phoneNav({ canShare: vi.fn(() => false) });
    expect(await shareMedia({ fileUrl: "u", name: "a.jpg" }, { nav })).toEqual({
      kind: "failed",
    });
  });
});

describe("Save to Photos, on iOS", () => {
  it("opens the sheet with the file, whose Save Image reaches the library", async () => {
    const nav = phoneNav();
    const out = await saveToPhotos(
      { fileUrl: SAVE_URL, name: "a.jpg" },
      {
        nav,
        fetch: (async () =>
          okResponse("jpeg", "image/jpeg", 4)) as unknown as typeof fetch,
      },
    );
    expect(out).toEqual({ kind: "sheet" });
  });

  it("falls back to the plain download for a clip over the cap, a refused type or a broken read", async () => {
    const tooBig = await saveToPhotos(
      { fileUrl: "u", name: "clip.mov" },
      {
        nav: phoneNav(),
        fetch: (async () =>
          okResponse(
            "x",
            "video/quicktime",
            SHARE_FILE_MAX_BYTES + 1,
          )) as unknown as typeof fetch,
      },
    );
    expect(tooBig).toEqual({ kind: "download" });
    expect(
      await saveToPhotos(
        { fileUrl: "u", name: "a.jpg" },
        { nav: phoneNav({ canShare: vi.fn(() => false) }) },
      ),
    ).toEqual({ kind: "download" });
    expect(
      await saveToPhotos(
        { fileUrl: "u", name: "a.jpg" },
        {
          nav: phoneNav(),
          fetch: (async () =>
            new Response("", { status: 403 })) as unknown as typeof fetch,
        },
      ),
    ).toEqual({ kind: "download" });
  });

  it("comes back ready when the tap lapsed, and quiet when the sheet was dismissed", async () => {
    const fetchJpeg = (async () =>
      okResponse("jpeg", "image/jpeg", 4)) as unknown as typeof fetch;
    const lapsed = await saveToPhotos(
      { fileUrl: "u", name: "a.jpg" },
      {
        nav: phoneNav({ userActivation: { isActive: false } }),
        fetch: fetchJpeg,
      },
    );
    expect(lapsed.kind).toBe("needs-tap");
    const dismissed = await saveToPhotos(
      { fileUrl: "u", name: "a.jpg" },
      {
        nav: phoneNav({
          share: vi.fn(async () => {
            throw domError("AbortError");
          }),
        }),
        fetch: fetchJpeg,
      },
    );
    expect(dismissed).toEqual({ kind: "cancelled" });
  });
});
