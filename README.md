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
| Westflügel · 3.–4. OG | Claude-Chat (`chat.html`) |

## Claude-Chat einrichten

Der Chat (`chat.html`) spricht über einen kleinen Server mit der Claude API. Der Server
(`claude-server/worker.js`) bewahrt den API-Schlüssel auf, damit er nie im Browser oder auf
GitHub landet, und beantwortet nur Anfragen mit dem richtigen Zugangscode.

1. **API-Schlüssel holen:** Auf https://console.anthropic.com anmelden, unter *Billing* Guthaben
   aufladen und unter *Limits* ein monatliches Ausgabelimit setzen. Dann unter *API Keys* einen
   Schlüssel erstellen und kopieren. Den Schlüssel niemandem schicken und nirgends ins Repo schreiben.
2. **Server anlegen (Cloudflare, kostenlos):** Auf https://dash.cloudflare.com ein kostenloses Konto
   anlegen. Unter *Workers & Pages* einen neuen Worker erstellen (Vorlage „Hello World“),
   z. B. mit dem Namen `claude-chat`, und bereitstellen.
3. **Code einfügen:** Beim Worker *Code bearbeiten* öffnen, alles durch den Inhalt von
   `claude-server/worker.js` ersetzen und bereitstellen.
4. **Geheimnisse eintragen:** Beim Worker unter *Settings → Variables and Secrets* zwei Einträge
   vom Typ *Secret* anlegen:
   - `ANTHROPIC_API_KEY` = der API-Schlüssel aus Schritt 1
   - `CHAT_PASSWORD` = ein selbst ausgedachter Zugangscode
5. **Verbinden:** Die Adresse des Workers kopieren (`https://claude-chat.<name>.workers.dev`),
   im Campus auf Westflügel 3.–4. OG klicken und Adresse + Zugangscode eintragen.
   Die Daten bleiben in diesem Browser gespeichert. Alternativ die Adresse oben in `chat.html`
   bei `window.CHAT_SERVER` fest eintragen, dann wird nur noch der Zugangscode abgefragt.

Kosten entstehen nur pro Nachricht bei Anthropic (Haiku 5.5 sehr günstig, Sonnet 5.5 mittel,
Opus 5.5 am teuersten). Der Chat zeigt unter jeder Antwort eine Schätzung an.
Chats werden nur im eigenen Browser gespeichert (Verlauf-Knopf oben links).
