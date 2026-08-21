# Learning Adventure 🎒 • Lern-Abenteuer

**▶️ Play now: https://rohitranjan-codes.github.io/math-adventure/**

A simple, colorful learning game for young children (~7 years old), in **English 🇬🇧** and
**German 🇩🇪**. Switch the whole game between the two languages with one button.

Everything is in a single `index.html` file — no build step, no server, no dependencies.

## Activities

- **🧮 Math** — **addition** and **subtraction** with pictures to count.
- **🔤 Articles** — learn the article that goes with a word:
  - **German 🇩🇪:** pick **der / die / das** for each noun (with the English meaning as a hint —
    great for learning German gender + vocabulary).
  - **English 🇬🇧:** pick **a / an** (e.g. *an* apple, *a* dog), with the German meaning shown too.
- **📖 Reader** — turn any text into article practice:
  - Paste a story, **load a `.txt` file**, or **load a PDF** (a grown-up sets this up).
  - **PDF import** reads normal (digital) PDFs instantly with PDF.js. For **scanned/photo
    PDFs** it falls back to **OCR** (Tesseract.js) — all in the browser, no server, no login.
  - **Read aloud** 🔊 — the browser reads the passage in a German or English voice and
    highlights each word as it goes (great for early readers). No downloads.
  - **Play questions** — the game finds the article+noun pairs already in the text
    (e.g. "der Hund", "an apple"), hides the article, and quizzes them.
  - **💾 Save** a passage to **My Library** — each player keeps their own saved texts
    (stored locally in the browser) to replay any time.
  - Switch 🇬🇧/🇩🇪 to match the language of your text.

  > **Note:** PDF/OCR tools load from a public CDN, so the **first** PDF import (and the first
  > OCR scan, which downloads a ~2 MB language file) needs an internet connection. Typing,
  > pasting, `.txt` files, read-aloud, and everything else work fully offline.

## Players & saved progress

- On first open, the child enters a **name** (no password — it's just a nickname).
- Each player's **best streak** and **recent plays** are saved and shown under "Recent plays".
- Tap **👤 name** (top right) to **switch player** or add a new one.
- Saving is **local to the device/browser** (uses `localStorage`) — perfect for a no-server setup.
  It remembers on the same device, but not across different devices.

## How to play

- Pick an activity tab: **🧮 Math** or **🔤 Articles**.
- In Math, pick a mode: **➕ Add**, **➖ Subtract**, or **🎲 Both**.
- Each round is **5 questions** (see "Question 3 / 5" at the top). Finish a round to get a
  **celebration screen** 🎉 with confetti, a star rating, and a **Play again** button.
- Tap the correct answer. Right answers grow your **streak** and earn ⭐ stars.
- Tap the flag button (top right) any time to switch **English ↔ German**.
- Keyboard: press number keys to pick an answer, **Enter/Space** for the next question.

## Play locally

Just double-click `index.html`, or open it in any web browser. That's it.

## Hosting (already set up)

This repo is published with **GitHub Pages** from the `main` branch, so any push to `main`
redeploys the live site above in ~1 minute. To reproduce on a fresh repo: **Settings → Pages →
Deploy from a branch → `main` / `/ (root)`**.

## Customize it

Open `index.html` and look inside the `<script>`:

- **Number difficulty** — in `buildMath()` change the ranges
  (addition uses 1–10; subtraction uses 2–12).
- **German words** — edit the `NOUNS_DE` list (`w` = word, `a` = der/die/das, `tr` = English, `e` = emoji).
- **English words** — edit the `NOUNS_EN` list (`a` = a/an, `tr` = German meaning).
- **Text/labels** — edit the `T` object to change any English or German wording.
