ToDo
===

### Prio 1

- [ ] S: Profil umbennen und überarbeiten (Kellerinfo)
- [ ] S: In Kellerseite immer Anzahl Flaschen anzeigen klein unterhalb des Kellernamens
- [ ] E: Suche nach Bewertung ("top3" =findet alle Flaschen mit Rating = 3 etc.)
- [ ] E: Rating auf bottle anstatt Product
- [ ] E: Änderungen zu Produkt machen (im Keller, auf Flasche neues Icon "ändern", wenn icon Stift gedrückt, dann alle Felder auf Input und 2 neue Icons, accept und cancel)
- [ ] S: Filter nach Weinfarbe und Weinart überdenken 
- [ ] E: Filter nach muss ausgetrunken werden --> via Suche "bis2026" (bisYYYY)
- [ ] S&E: Preis lookup review
- [ ] E: API Key für REST API
- [ ] S: dezimalstellen (number) bei Fotoeingabe statt Integer
- [ ] E: Menge muss auf ttl Menge gemappt werden 
- [ ] E: Quelle muss angezeigt werden

### Prio 2

- [ ] Verwendung von WebMCP
- [ ] Dezimalstellen des Preises werden nicht angezeigt (Soukai Bug?)
- [ ] neue Seite Statistik:
  - Anzahl Rotweine, Weissweine, Roseweine, Sprudel (weiss, rot, rose), Gesamt und pro Keller
  - Weine trinkreif von - bis
  - Weinpreise pro Keller und Gesamt und von - bis
  - Weinbewertungen Top (3), (2), (1) 
- [ ] Client ID Metadata Document als JSON-LD (https://github.com/mfhepp/test_mime_types)
- [ ] Refresh Button
- [ ] Monate im Einkauf zu/aufklappbar machen
- [ ] E: Filter nach muss ausgetrunken werden --> lange (1sec) auf filter toggle drücken

### Prio 3

- [ ] Preis mit Komma oder Punkt als Dezimalzeichen aktzeptieren
- [ ] Funktion für Keller umbennen
- [ ] check for updates in Kellerinfo bei der Version
- [ ] Mobile Safari fehlt x in Search Input ([siehe Blog](https://www.w3tutorials.net/blog/input-type-search-no-longer-shows-cancel-button-x-under-ios/))

### Prio 4

- [ ] E2E Tests
- [ ] Code Quality
- [ ] Automated Testing
- [ ] Finder Extension/WebDAV to Solid Pod Bridge
- [ ] Solid Bootstrapping via WebID -> oidcIssuer(s) / storage(s) -> Type Indices

Done
---

- [-] Icons für Suchen differenzieren
- [x] Upload Foto
- [x] Layout: Einkäufe ist Text zu nahe am Rand und Bullet Points wegnehmen
- [x] Filter für Text auf Einkäufe Seite
- [x] Profil Seite ist Text zu nahe am Rand
- [x] background color = #f2f2b6
- [x] Namen optimieren
- [x] Inventar optimieren
- [x] Foto-to-Order
- [x] Inrupt Setup
- [x] Icons einbauen
- [x] Login/Logout in Profil Seite
- [x] Einkäufe auch im Offline Zustand anzeigen
- [x] kein Sync bei Page Refresh
- [x] Local-first mit IndexedDB
- [x] Bei Login mit anderer WebID müssen die lokale gespeicherten Daten gelöscht werden
- [x] Migration auf Soukai-Bis
- [x] Inbox löscht bei Übernahme die ttl Files nicht
- [x] Filter für Weinart auf Keller Seite (✔) und Kellerarbeit (✔) Seite
- [x] Optimierung: Porto, Geschenkpackung, Rabatt, etc. aus Bestellung entfernen
- [x] Server von Python auf Quarkus migrieren
- [x] Upload von order.ttl(s) im UI
- [-] Startseite Styling und Einführung
- [-] Flasche(n) löschen
- [-] WebID löschen im Profil
- [x] App Styling (Layout, Farben, ...)
- [x] Refresh nach neuen Keller erstellen
- [x] Keller löschen im Profil
- [x] Eingang aus Foto via Email → Kellerknecht

- Solid Login via WebID
- Eingang aus Bestell-Email via Email (kellermeister@gmail.com)
- Kellerarbeit
