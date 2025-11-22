# Postępy realizacji MVP NaStrzala.com

## ✅ Tydzień 1 (UKOŃCZONY - 100%)

### Zrealizowane:
- [x] Inicjalizacja repo (GitHub)
- [x] Struktura projektu: frontend/, backend/
- [x] Konfiguracja dev-serverów
- [x] Landing page
- [x] Preselekcja busa (dropdown + dane)
- [x] Preselekcja ładunków (lista + ilość sztuk)
- [x] Backend Express z health check
- [x] **BONUS**: Wizualizacja 3D (Three.js)
- [x] **BONUS**: Dialog z wymiarami
- [x] **BONUS**: 3 presety busów + 7 presetów ładunków
- [x] **BONUS**: Style guidelines i dokumentacja
- [x] **BONUS**: TypeScript types dla cargo, vehicle, solver

**Notatki**: Znacznie przekroczyliśmy plan tygodnia 1, zrealizowano również elementy z tygodnia 2 i 3.

---

## 🔄 Tydzień 2 (W TRAKCIE - 20% czasu minęło)

### Status: Częściowo zrealizowany (45%)

#### ✅ Ukończone (z wyprzedzeniem):
- [x] Three.js setup
- [x] Kamera orbitalna (lepsza niż zakładana pasywna izometryczna)
- [x] Renderowanie busa i ładunków jako boxów
- [x] Format solver input (JSON) - typy TypeScript
- [x] Transformacja danych z UI do formatu solvera
- [x] Prezentacja danych solvera (wizualizacja 3D + lista)

#### 🚧 W realizacji:
- [~] **Solver - iteracja podstawowa** (10% ukończone)
  - [x] Struktura pliku solver.ts
  - [x] Typy TypeScript (SolverRequest, SolverResponse, placements)
  - [x] Integracja solver → frontend (wywołanie, przekazanie danych)
  - [x] Wizualizacja wyników solvera w 3D
  - [ ] Algorytm 3D bin-packing (skeleton tylko)
  - [ ] AABB collision detection
  - [ ] Heurystyka layer packing
  - [ ] Obsługa rotacji 0°/90°
  - [ ] Zwracanie poprawnych pozycji XYZ

#### ⏸️ Nie rozpoczęte:
- [ ] Obsługa błędów / fallbacków w UI
- [ ] Tabela z wynikami solvera (tylko wizualizacja 3D działa)

### Zrealizowane dodatkowo (poza harmonogramem):
- [x] Dostosowanie struktur danych JSON do TypeScript types
- [x] Wheel arches w AABB format
- [x] Constraints dla cargo (stackable, rotation_allowed, allowed_orientations)
- [x] Rozdzielenie cargo_id/vehicle_id vs UI labels
- [x] Kolorowanie ładunków według typu
- [x] Krawędzie pudełek + półprzezroczystość
- [x] Optymalizacja wizualizacji (gap między pudłami, polygon offset)

### Następne kroki (priorytet):
1. **Dokończenie algorytmu solvera** - 3D free-space splitting działa częściowo, wymaga debugowania
2. **Walidacja pozycji** - sprawdzenie czy pudła nie zachodzą na siebie
3. **Obsługa edge cases** - co gdy nic nie wchodzi, komunikaty błędów
4. **Testy** - weryfikacja na różnych kombinacjach ładunków

**Notatki**: Solver jest zintegrowany z UI i wizualizuje wyniki, ale algorytm packowania wymaga dopracowania. Infrastruktura gotowa, brakuje działającej logiki bin-packing.

---

## 📋 Tydzień 3 (ZAPLANOWANY - częściowo rozpoczęty)

### Już zrealizowane z tygodnia 3:
- [x] Przygotowanie struktury danych AABB
- [~] Pierwsza heurystyka „layer packing" (w kodzie, nie działa w 100%)
- [x] Presety 3 busów (z nadkolami w AABB)
- [x] Walidacja wymiarów pod solver

### Do zrealizowania:
- [ ] Rotacje 0°/90° (kod przygotowany, nie przetestowane)
- [ ] Sortowanie od największych (zaimplementowane)
- [ ] Kolizje AABB z kompletną detekcją
- [ ] Zwracanie poprawnych pozycji XYZ (częściowo działa)

**Status tygodnia 3**: ~30% zrealizowane przedwcześnie

---

## 📋 Tydzień 4-8 (ZAPLANOWANE)
Zobacz [harmonogram.md](harmonogram.md) dla pełnej listy zadań.

### Kluczowe kamienie milowe:
- **Tydzień 4**: Solver - heurystyki, edge-case'y, kursy
- **Tydzień 5**: Iteracja jakościowa: solver + presety + wizualizacja
- **Tydzień 6**: Deploy: hosting, Railway, domena
- **Tydzień 7**: Optymalizacja, UX, presety
- **Tydzień 8**: Stabilizacja, testy końcowe

---

## 📊 Podsumowanie ogólne

**Postęp relative do harmonogramu**: ~35% całkowitego MVP  
**Tydzień aktualny**: 2/8 (20% czasu tygodnia 2)  
**Elementy wyprzedzające plan**: UI, wizualizacja 3D, typy TypeScript, struktura danych  
**Główny bottleneck**: Algorytm solvera (3D bin-packing logic)  

**Ocena**: Projekt jest wyprzedzony pod względem infrastruktury i UI, ale wymaga intensywnej pracy nad algorytmem solvera aby nadrobić deficit w tyg. 2-3.
