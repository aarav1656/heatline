# YouTube upload: Order to Correct demo

**Video URL:** https://youtu.be/5YEBhmyC0H4

- Title: `Order to Correct: tenant + advocate, each with an agent on one NYC building record (WebMCP)`
  (trimmed from the requested title to fit YouTube's 100-character title limit; the requested title
  was 107 characters, this is 91)
- Visibility: Public
- Audience: Not made for kids
- Uploaded file: `/Users/kamal/Desktop/devpost/projects/webmcp/order-to-correct/video/out/order-to-correct-demo.mp4` (137.9s, 1080p)
- Channel: Kamal Nayan Singh (studio.youtube.com, `deepsurge` browser profile)
- Published: Sep 4, 2026

## Description (as pasted)

```
Order to Correct is a shared case page for a tenant and their legal-aid advocate, each with a different WebMCP tool set on the same NYC building record. The tenant's agent logs conditions, matches them to the Housing Maintenance Code, and files the finished packet; the advocate's agent pulls the building's HPD enforcement history and assembles the HP Action packet, with a human confirming every write.

Live: https://order-to-correct.vercel.app
Code (MIT): https://github.com/kamalbuilds/order-to-correct

Built for The WebMCP Challenge.

Data: NYC HPD Housing Maintenance Code Violations, HPD Complaints, HPD Registrations (data.cityofnewyork.us).
```

## Verification evidence

1. YouTube Studio "Checks complete. No issues found." confirmation after Publish, dialog closed
   automatically and the video appeared in Channel content as Public / Published.
2. Opened `https://youtu.be/5YEBhmyC0H4` directly in `deepsurge`: page title rendered as
   `Order to Correct: tenant + advocate, each with an agent on one NYC building record (WebMCP) - YouTube`,
   player showed `0:00 / 2:18`, description text present under the video, channel `Kamal Nayan Singh`,
   no private/unavailable message.
3. oEmbed check (only succeeds for public videos):
   ```
   curl -s -o /dev/null -w "%{http_code}" "https://www.youtube.com/oembed?url=https://youtu.be/5YEBhmyC0H4"
   -> 200
   ```
   Full oEmbed response returned `title`, `author_name: Kamal Nayan Singh`, `provider_name: YouTube`,
   confirming public accessibility from outside the logged-in session.

## Notes

- File selection for the upload dialog was done via CDP `DOM.setFileInputFiles` against the
  `input[type=file]` node found by walking `DOM.getDocument(depth=-1)` for a `type=file` node
  (`bh-multi run deepsurge` with `cdp('DOM.getDocument', depth=-1)` / manual tree walk /
  `cdp('DOM.setFileInputFiles', files=[...], nodeId=...)`), since `bhn`/`js()` cannot set file inputs.
- Title/description fields in YouTube Studio are `contenteditable` divs (`#textbox`), not
  `<textarea>`; text was inserted via `document.execCommand('insertText', ...)` inside a
  `Runtime.evaluate` call with the payload base64-encoded and decoded in-page (`atob(...)`) to avoid
  the harness's JS string-escaping trap with newlines/quotes in the description.
- `switch_tab(targetId)` only persists within a single `bh-multi run` process invocation (it sets
  the daemon's session over a Unix socket that a fresh process doesn't inherit), so every subsequent
  Studio interaction had to be chained inside one script rather than issued as separate `run` calls,
  after an earlier separate call accidentally landed on an unrelated ChatGPT tab.
- Title trimmed from the task's suggested wording ("Order to Correct: a tenant and a legal-aid
  advocate, each with an agent on one NYC building record") to fit the 100-character cap.
