# 🎒 BethClass — Pass the Eraser!

**BethClass** is a fun browser-based classroom stealth game built with React + Vite. Help students secretly pass an eraser around the classroom — but watch out for **Beth**, the vigilant teacher who's always keeping an eye out!

## 🎮 Play Now

👉 **[Play BethClass online](https://gauthamkt.github.io/bethclass/)**

No installation needed — just open the link and play!

---

## 🕹️ How to Play

- Students who **need the eraser** are highlighted in the classroom.
- You control **who passes the eraser** by clicking on a highlighted student.
- **Beth** cycles through three states:
  - 🔴 **Watching** — She's looking at the class. Don't throw!
  - 🟢 **Not Watching** — She's turned away. Your window to pass!
  - 🟠 **Warning** — She's about to turn back. Be quick!
- Pass the eraser **only to students who need it** — wrong passes cost you a ❤️.
- Lose all 3 hearts and it's **CAUGHT!**
- Complete all levels to win the game! 🎉

---

## 📈 Levels

Each level increases the difficulty — Beth watches more frequently and for longer, so your reaction windows get shorter and shorter. How far can you go?

---

## 🛠️ Tech Stack

- **React 19** + **Vite 7**
- **HTML5 Canvas** for game rendering
- Vanilla CSS for styling
- Deployed via **GitHub Pages**

---

## 🚀 Run Locally

```bash
git clone https://github.com/gauthamkt/bethclass.git
cd bethclass
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Build & Deploy

```bash
npm run deploy
```

This builds the project and publishes it to the `gh-pages` branch automatically.

---

## 📄 License

MIT
