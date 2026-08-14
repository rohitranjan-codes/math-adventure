# Math Adventure 🧮 • Mathe-Abenteuer

**▶️ Play now: https://rohitranjan-codes.github.io/math-adventure/**

A simple, colorful math game for young children (~7 years old). Practice **addition** and
**subtraction** with pictures to count, friendly sounds, stars, and a streak counter.
The whole game switches between **English 🇬🇧** and **German 🇩🇪** with one button.

Everything is in a single `index.html` file — no build step, no server, no dependencies.

## Play locally

Just double-click `index.html`, or open it in any web browser. That's it.

## How to play

- Pick a mode: **➕ Add**, **➖ Subtract**, or **🎲 Both**.
- Count the pictures if you need help, then tap the correct answer.
- Get it right to grow your **streak** and earn ⭐ stars. Your **best** streak is saved.
- Tap the flag button (top right) any time to switch **English ↔ German**.
- Keyboard: press **1–4** to answer, **Enter/Space** for the next question.

## Put it online for free with GitHub Pages

You don't need to run your own server — GitHub can host this page for free.

1. Create a new repository on GitHub (e.g. `math-adventure`).
2. Push this folder to it:
   ```bash
   git add .
   git commit -m "Math Adventure game"
   git branch -M main
   git remote add origin https://github.com/<your-username>/math-adventure.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Pick branch **main** and folder **/ (root)**, then **Save**.
6. Wait ~1 minute. Your game will be live at:
   `https://<your-username>.github.io/math-adventure/`

Share that link — it works on phones, tablets, and computers.

## Customize it

Open `index.html` and look near the top of the `<script>`:

- **Number difficulty** — in `makeQuestion()` change the ranges
  (addition uses numbers 1–10; subtraction uses 2–12).
- **Pictures** — edit the `EMOJIS` list to use different objects.
- **Words** — edit the `T` object to change any English or German text.
