# My Calendar

A phone-friendly calendar app by **[AKIBUZZAMAN AKIB](https://github.com/AKIBUZZAMAN-AKIB)** (@AKIBUZZAMAN-AKIB). Five views, Subjects you can rename and merge, a floating time picker that sets any exact minute, and events saved on your device. It also ships as **one offline HTML file**.

<p align="center">
  <img src="docs/recordings/gif/create-event.gif" alt="Creating an event on a phone" width="260">
  &nbsp;&nbsp;
  <img src="docs/screenshots/iphone/01-month.png" alt="Month view" width="260">
  &nbsp;&nbsp;
  <img src="docs/screenshots/iphone/05-day-busy.png" alt="Day view with overlapping events" width="260">
</p>

<p align="center">
  <a href="docs/video/promo-1920x1080.mp4"><b>Watch the promo video</b></a> (1920×1080) ·
  <a href="docs/video/promo-vertical-1080x1920.mp4">vertical version</a> (1080×1920) ·
  <a href="docs/GUIDE.md"><b>User guide</b></a> ·
  <a href="release/calendar.html"><b>Download the single HTML file</b></a>
</p>

[![Promo video](docs/video/promo-poster.jpg)](docs/video/promo-1920x1080.mp4)

## Features

- **Five views:** Day, Week, Month, Year and Agenda. The tab switches the moment you tap it.
- **Subjects:** every event has a Subject (Study, Work, Personal, Health, or your own). Filter by Subject, and **rename, delete or merge** Subjects; their events follow along. Deleting asks where the events go: another Subject or "No subject".
- **Floating time picker:** a small panel next to the field, shared by Create and Edit. Tap an hour, a 5-minute step, then any single minute; −/+ change one minute at a time. 12-hour mode has AM/PM. Changing the start keeps the event's length. The date picker fits a 360px screen.
- **Week and Day scroll sideways on phones:** each day is at least 84px wide; Day view widens when many events overlap. Day names and the hour column stay pinned.
- **Complete event boxes:** overlapping events share columns like Google Calendar, and no box spills out of its column or the screen.
- **More text in Month view:** two-line chips in five-row months, and multi-day bars that show their full title.
- **Tap an empty slot** in Week or Day view to create an event at that time.
- **Drag and drop:** with the mouse on desktop, or press and hold on a phone. Resize by dragging a box edge (mouse only).
- **Saved on your device:** events, Subjects and settings live in `localStorage` and survive a reload. No account and no server.
- **Settings:** dark mode, chip or dot event style, 12/24-hour time, the hour the day starts at, Agenda grouping, and removing the sample events.
- **Single HTML build:** `npm run build:single` makes one ~870 KB file with the code, styles and Geist font inside. It works offline with no network requests.

## Screenshots

Real screenshots from Chromium. Every screen is available for Android (360×740), iPhone (390×844) and desktop (1440×900) in [`docs/screenshots`](docs/screenshots).

| Week | Time picker | Manage Subjects | Dark mode |
| --- | --- | --- | --- |
| ![Week view](docs/screenshots/iphone/02-week.png) | ![Floating time picker](docs/screenshots/iphone/11-time-picker.png) | ![Manage Subjects](docs/screenshots/iphone/17-subjects-manage.png) | ![Month in dark mode](docs/screenshots/iphone/23-month-dark.png) |

![Desktop](docs/screenshots/desktop/02-week.png)

## Screen recordings

Short MP4 recordings of real interactions, in [`docs/recordings`](docs/recordings):

| Recording | What it shows |
| --- | --- |
| [create-event.mp4](docs/recordings/create-event.mp4) | Creating "Chemistry practical exam" with a Subject, colour and the time picker |
| [edit-time.mp4](docs/recordings/edit-time.mp4) | Editing an event's time to 8:33 PM with the picker and the + button |
| [switch-views.mp4](docs/recordings/switch-views.mp4) | Month → Week → Day → Year → Agenda → Month |
| [week-day-scroll.mp4](docs/recordings/week-day-scroll.mp4) | Swiping Week and a busy Day sideways |
| [manage-subjects.mp4](docs/recordings/manage-subjects.mp4) | Renaming, merging and deleting Subjects |
| [persist-reload.mp4](docs/recordings/persist-reload.mp4) | Tapping an empty slot, saving, reloading: the event is still there |
| [desktop-tour.mp4](docs/recordings/desktop-tour.mp4) | Drag and drop, Day view, dark mode and Agenda on desktop |

<p>
  <img src="docs/recordings/gif/week-day-scroll.gif" alt="Swiping Week and Day" width="230">
  <img src="docs/recordings/gif/manage-subjects.gif" alt="Managing Subjects" width="230">
  <img src="docs/recordings/gif/edit-time.gif" alt="Editing the time" width="230">
</p>

## Quick start

### Use it offline

Download [`release/calendar.html`](release/calendar.html) and open it in any modern browser. Events are saved in that browser. On a phone, if a file viewer does not keep your events, host the file on a static site such as GitHub Pages.

### Run from source

```bash
git clone https://github.com/AKIBUZZAMAN-AKIB/my-calendar.git
cd my-calendar
pnpm install
pnpm dev
```

Open `http://localhost:3000/calendar`.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `npm run build:single` | Builds `dist/single.html`, the one-file offline calendar |

The step-by-step [user guide](docs/GUIDE.md) covers every feature and explains how the single-file build works.

## Tech stack

Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, date-fns, React Hook Form with Zod. The single-file build uses esbuild, the Tailwind CLI and html-minifier-terser ([`scripts/build-single.mjs`](scripts/build-single.mjs)).

## Project layout

```
src/features/calendar/   calendar views, dialogs, Subjects, drag and drop, settings
src/components/ui/       shared UI, including the floating date-time picker
single/                  entry point and HTML template for the single-file build
scripts/build-single.mjs single-file build script
release/calendar.html    ready-made single-file build
docs/                    guide, screenshots, recordings and promo video
```

## Author

**AKIBUZZAMAN AKIB** · [@AKIBUZZAMAN-AKIB](https://github.com/AKIBUZZAMAN-AKIB)

## Credits and license

This project is built on [Full Calendar](https://github.com/yassir-jeraidi/full-calendar) by Jeraidi Yassir, released under the MIT License. The original copyright notice is kept in [LICENSE](LICENSE). The documentation pages under `content/docs` describe the original component.
