Test Cases
===

Normal Test Case
---

- #1 ✔
    - offline: neuen Keller estellen
    - offline: sync zu Solid Pod
    - online: Seite Kellerarbeit mit Inbox 63 Flaschen aufrufen
    - offline: 100 Flaschen umbuchen & sync
- #2
    - ev. logout
    - offline: Flasche austrinken mit Bewertung
    - offline: Flaschen umbuchen von Keller1 nach Keller2
    - offline: sync
    - check mit 2. Device
- #3


Edge Test Case
---

- #1
  - online: Seite Kellerarbeit mit Inbox 774 Flaschen
  - online: sync (= 3 Minuten)

Testdaten
---

- Bestellung Hütte: 63
    - 11: 20260517_190916745_wein.ttl
        - invoice/7
            - 2: manincor-mason-2018
        - invoice/2
            - 2: soutiran-collection-privee-grand-cru-2022-1-5l
        - invoice/5
            - 2: kellerei-terlan-merlot-riserva-2020
        - invoice/3
            - 1: tiefenbrunner-lenticlarius-cuvee-riserva-2020
        - invoice/6
            - 1: manincor-rubatsch-2019
        - invoice/1
            - 1: bereche-fils-brut-reserve-2023-1-5l
        - invoice/4
            - 2: aagne-pinot-noir-spatlese-2021
    - : 20260517_191536310_wein.ttl
    - : 20260517_190557284_weine.ttl
    - :
- Bestellung Luzern: 774
- Bestellung Brixen: 183
