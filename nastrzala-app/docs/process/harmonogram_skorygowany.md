# Harmonogram MVP NaStrzala — wersja skorygowana (80h)

## Status początkowy
- Tydzień 1–3 ukończone: **25h**
- Solver: ~50%
- Wizualizacja: ukończona
- Presety busów i ładunków: ukończone
- Panel wyników: 75%

Pozostałe **5 tygodni × 10h = 50h**, co razem daje **~80h** pracy nad MVP.

---

## Tydzień 4 — Automatyzacja testów solvera (10h)
**Cel:** Stabilny fundament testowy umożliwiający rozwój i refaktory solvera bez regresji.

### Zadania
- Integracja frameworka testowego (Vitest / Jest)
- Testy kolizji AABB
- Testy rotacji 0°/90°
- Testy stacking (stackable / fragile / heavy-light)
- Testy kanału podłogowego dla `long`
- Testy poprawności orientacji (vertical / allow_rotations)
- Testy deterministyczności solvera
- Testy regresji pozycji XYZ
- Generator scenariuszy testowych (płyty, rury, okna, mix)

### Rezultat
System testów pozwala natychmiast wykrywać błędy i weryfikować heurystyki solvera.

---

## Tydzień 5 — Poprawki solvera + presety (10h)
**Cel:** Doprowadzenie solvera do jakości używalnej (80–90%) + domknięcie presetów.

### Zadania
- Poprawa heurystyki free-space splitting
- Uspójnienie scoringu (preferencje: floor, wall, grouping, heavy-first)
- Stabilizacja rozmieszczania XY i redukcja dziwnych luzów
- Dopracowanie clusteringu grup (`cargo_id` + behavior)
- Lepsza logika `long` (kanał podłogowy + priorytet osiowy)
- Obsługa edge-case'ów: niskie busy, nadkola, krótkie ładunki
- Poprawki presetów ładunków i weryfikacja wymiarów
- Kalibracja scoringu na podstawie testów z Tygodnia 4

### Rezultat
Solver zachowuje się "jak człowiek": grupuje, nie rozrzuca, logicznie układa ciężkie i długie.

---

## Tydzień 6 — Panel wyników + UX (10h)
**Cel:** Finalizacja frontendu i nadanie spójnego workflow użytkownika.

### Zadania
- Dokończenie panelu wyników (ostatnie 25%)
- Logika: „dlaczego nie weszło”
- Wyświetlanie liczby kursów i rozbicie na tripy
- Fallback UI, gdy solver zwróci pusty wynik
- Poprawa wyświetlania listy elementów + miniatur
- Ujednolicenie kolorystyki typów ładunków
- Zakończenie mikrointerakcji (tooltipy, legendy, komunikaty błędów)
- Uspójnienie layoutu i czytelności

### Rezultat
Użytkownik dostaje kompletny, czytelny i gotowy do użycia ekran wynikowy.

---

## Tydzień 7 — Deploy i infrastruktura (10h)
**Cel:** Ustawienie działającej wersji produkcyjnej.

### Backend (Railway)
- Deploy solvera
- Ustawienie środowisk DEV / PROD
- Logowanie, monitoring, ograniczenia czasu obliczeń

### Frontend (Vercel / Netlify)
- Build produkcyjny
- Zmiana endpointów na PROD

### Domena
- Podpięcie NaStrzala.com
- Certyfikaty HTTPS

### Testy po-deploy
- CORS
- Czasy odpowiedzi solvera
- Testy stabilności pod obciążeniem

### Rezultat
Działająca aplikacja produkcyjna dostępna publicznie.

---

## Tydzień 8 — Testy i poprawki (10h)
**Cel:** Dopieszczenie całego MVP na podstawie testów końcowych.

### Zadania
- Testy regresji: płyty × 20, rury 3–6m, drzwi, okna, mix
- Eliminacja fluktuacji pozycji XYZ
- Uproszczenie heurystyk w miejscach zbyt skomplikowanych
- Fallback na błędy solvera
- Optymalizacja czasu obliczeń
- Poprawki UX na podstawie testów ręcznych
- Czyszczenie repo, finalne README, instrukcja dev-local

### Rezultat
Stabilne, dopracowane MVP gotowe na pierwszych użytkowników.

---

## Podsumowanie czasu

| Tydzień | Zakres | Godziny |
|--------|--------|----------|
| 4 | Automatyzacja testów solvera | 10h |
| 5 | Poprawki solvera + presety | 10h |
| 6 | Panel wyników + UX | 10h |
| 7 | Deploy i infrastruktura | 10h |
| 8 | Testy i poprawki | 10h |

**Razem: 50h (dopełnienie planu 80h)**

