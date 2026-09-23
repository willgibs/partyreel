# The reel-video harness fixtures

Small, disposable media for `/design/lab/tools/reel-video`, transcoded from
`/Users/gibby/local/ai/partyreel-test-media/videos/landscape-sample-10s.mp4` on 2026-09-22 so the
harness can decode a REAL mov and a REAL webm without a 10 GB original or a network hop:

| file | what it proves | size |
| --- | --- | --- |
| `landscape-10s.mov` | QuickTime (QTFF) demux + h264 decode, the phone's usual container | 608 KB |
| `landscape-10s.webm` | Matroska/WebM demux + VP9 decode, the other original we accept | 677 KB |
| `portrait-10s.mp4` | a portrait source COVERING a portrait composition (the other framing path) | 534 KB |
| `landscape-poster.jpg`, `portrait-poster.jpg` | the poster still each video hands over from | ~54 KB |

They are served by `../fixture/[name]/route.ts`, which answers byte ranges with `206` and a
`Content-Range`, because that is the shape the reader meets in production and Next's own `public/`
handling is not this lane's to depend on.

Regenerate (ffmpeg):

    ffmpeg -i <src> -t 10 -vf scale=854:480 -c:v libx264 -profile:v main -pix_fmt yuv420p \
      -b:v 500k -g 30 -an -movflags +faststart -f mov landscape-10s.mov
    ffmpeg -i <src> -t 10 -vf scale=854:480 -c:v libvpx-vp9 -b:v 220k -g 30 -an -f webm landscape-10s.webm
