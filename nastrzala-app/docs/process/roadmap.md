# Harmonogram prac nad MVP NaStrzala.com — wersja skorygowana (realistyczna)

## Tydzień 1 — Fundamenty projektu (10h)
### Setup techniczny
- Inicjalizacja repo (GitHub)
- Struktura projektu: frontend/, backend/
- Konfiguracja dwóch dev-serverów + podstawowy routing

### UI wstępne
- Landing page (prosty szkic)
- Preselekcja busa (dropdown + mock dane)
- Preselekcja ładunków (lista + ilość sztuk)

### Backend szkic
- Mock endpoint `/solve` zwracający statyczne dane

**Cel tygodnia:** działająca lokalnie ścieżka: wybór busa/ładunku → request do solvera (mock).

---

## Tydzień 2 — Przepływ danych + pierwsza wizualizacja 3D (10h)
### Integracja danych
- Format solver input (JSON)
- Transformacja danych z UI do formatu solvera
- Obsługa błędów / fallbacków

### Wizualizacja 3D (iteracja 1 — techniczna)
- Three.js setup
- Pasywna kamera izometryczna
- Renderowanie busa i ładunków jako boxów (mock XYZ)

### UX
- Prezentacja danych solvera (tekst + tabela + 3D)

**Cel tygodnia:** pełna ścieżka lokalna: user → solver (mock) → widok 3D.

---

## Tydzień 3 — Solver: fundamenty algorytmiczne (10h)
### Solver — iteracja 1
- Przygotowanie struktury danych AABB (boxy)
- Rotacje 0°/90°
- Sortowanie od największych
- Pierwsza heurystyka „layer packing”
- Kolizje AABB z podstawową detekcją
- Zwracanie listy pozycji XYZ

### Presety busów — iteracja 1
- Wymiary 3 busów (bez nadkoli)
- Walidacja wymiarów pod solver

**Cel tygodnia:** backend liczy proste przypadki i zwraca realne dane XYZ.

---

## Tydzień 4 — Solver: heurystyki, edge-case’y, kursy (10h)
### Solver — iteracja 2
- Druga heurystyka (osiowe upakowanie)
- Obsługa braku miejsca → liczba kursów
- Poprawiona detekcja kolizji
- Raportowanie „dlaczego nie weszło”

### Wizualizacja — iteracja 2
- Realne dane XYZ z solvera
- Lepsze kolory / rozróżnienie elementów
- Usprawnienie kamery

### Presety ładunków — iteracja 1
- 10 typowych ładunków z wymiarami
- Wstępna walidacja kompatybilności z solverem

**Cel tygodnia:** solver obsługuje większość realnych przypadków.

---

## Tydzień 5 — Iteracja jakościowa: solver + presety + wizualizacja (10h)
### Solver — iteracja 3
- Korekty umiejscowienia boxów (dokładniejsze XY)
- Stabilizacja heurystyk
- Uspójnienie raportów tekstowych

### Wizualizacja — iteracja 3
- Modele bardziej czytelne
- Wyświetlanie wymiarów
- Czytelniejszy grid

### Presety — iteracja 2
- Dodanie nadkoli do busów (proste boxy)
- Poprawa presetów ładunków

**Cel tygodnia:** Aplikacja działa lokalnie w 100%, z sensownymi wynikami.

---

## Tydzień 6 — Deploy: hosting, Railway, domena (10h)
### Backend → Railway
- Deploy API solvera
- Konfiguracja środowisk (DEV/PROD)
- Logi i monitoring

### Frontend → Vercel / Netlify
- Build produkcyjny
- Zmiana endpointów na produkcyjne

### Domena
- Podpięcie NaStrzala.com
- Certyfikaty HTTPS

### Testy po-deploy
- CORS
- Czas odpowiedzi solvera
- Podstawowe sanity testy

**Cel tygodnia:** produkcja stoi i działa.

---

## Tydzień 7 — Optymalizacja, UX, presety (10h)
### UX / UI polish
- poprawa landing page
- tooltipy, instrukcje, error states

### Solver — iteracja 4
- Poprawa wydajności
- Lepsza obsługa paczek długich (rury 4–6m)
- Edge-case'y małych busów

### Wizualizacja — iteracja 4
- Uspójnienie kolorystyki
- Skalowanie sceny
- Poprawa izometrii

### Presety — iteracja 3
- korekta wymiarów busów i ładunków

---

## Tydzień 8 — Stabilizacja, testy końcowe, mikro-poprawki (10h)
### Testy regresji
- ~20 scenariuszy załadunkowych
- płyty × 20, rury × 6m, drzwi, okna, mix

### Stabilizacja solvera
- redukcja „fluktuacji pozycji”
- uproszczenie heurystyk tam gdzie możliwe

### Poprawki techniczne
- błędy graniczne API
- fallback gdy solver zwraca pusty wynik
- poprawa czasu obliczeń

### Final polish
- optymalizacja bundla
- czyszczenie repo + README z instrukcją lokalną

**Cel tygodnia:** stabilne MVP gotowe do użytku publicznego.
