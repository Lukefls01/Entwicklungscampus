# TT Entwicklungscampus

Lebendes 3D-Bild eines Bürocampus mit Garten und Brunnen (Three.js, eine einzige `index.html`).

- Sonnenstand, Dämmerung und Nacht folgen der aktuellen Uhrzeit in Göppingen
- Wetter wechselt alle 25 Minuten: meist sonnig, manchmal Regen oder Gewitter
- Büro-Belegung und Licht folgen Wochentag und Uhrzeit
- Abteilungen (Flügel × Etage) werden beim Überfahren mit der Maus hervorgehoben

## Hosting

GitHub Pages, Quelle: Branch `main`, Ordner `/ (root)`.

Die Seite lädt Three.js (0.170.0) von jsDelivr und die Schrift Manrope von Google Fonts, sonst gibt es keine Abhängigkeiten.

## Apps im Gebäude

Einige Abteilungen öffnen beim Anklicken eine App in einem Fenster über dem Campus:

| Bereich | App |
|---|---|
| Westflügel · Erdgeschoss | TT-Kasse (https://tt-kasse.web.app) |
| Westflügel · 1. OG | Techno-Playlists (https://lukefls01.github.io/techno-playlists/) |
| Westflügel · 3.–4. OG | Claude (claude.ai, öffnet als eigenes Fenster, weil claude.ai sich nicht einbetten lässt) |
