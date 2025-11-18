# Harmonogram prac nad MVP NaStrzala.com (10h/tydzień)

## 🎯 Zakres MVP
1. Landing page  
2. Wybór z 3 predefiniowanych busów  
3. Wybór z 10 predefiniowanych ładunków  
4. Solver rozmieszczenia ładunku  
5. Wizualizacja rozmieszczenia w rzucie izometrycznym (pasywna kamera)

---

# 📅 Harmonogram — 8 tygodni (80 godzin)

## Tydzień 1 – Podstawy projektu (10h)
### Frontend
- Utworzenie projektu React + struktury komponentów  
- Routing (landing → app)  
- Przygotowanie layoutu aplikacji  

### UX / Specyfikacja
- Flow MVP: wybór busa → wybór ładunków → solver → widok 3D  
- Definiowanie danych 3 busów (preset JSON)

### Backend
- Projekt Node.js  
- Wstępna struktura endpointów (`/solve`, `/presets`)

---

## Tydzień 2 – Landing page + Presety busów (10h)
### Landing page (3–4h)
- sekcje: co to, dla kogo, demo, CTA

### Presety busów (6h)
- Sprinter L2H2  
- Master L2H2  
- Ducato L2H2  
- Struktura danych (bounding boxy)  
- UI wyboru busa

---

## Tydzień 3 – Presety ładunków (10h)
### 10 presetów ładunków
- płyty GK 120×200  
- płyty GK 120×260  
- płyty OSB  
- płyty meblowe  
- rury 3m  
- rury 4m  
- rury 6m  
- listwy  
- drzwi + ościeżnice  
- okna

### Zadania
- JSON każdego presetowego ładunku  
- Komponent wyboru ładunków  
- Walidacja ilości sztuk

---

## Tydzień 4 – Integracja presetów + logika frontu (10h)
- UI: podsumowanie wyboru  
- Normalizacja danych wejściowych do solvera  
- Konwersja ładunków na prostopadłościany  
- Przekazywanie danych do backendu

---

## Tydzień 5 – Solver (10h)
### Minimalna heurystyka
- układanie od największych elementów  
- rotacje 0°/90°  
- stacking warstwami  
- sprawdzanie kolizji bounding boxów  
- ocena „mieści / nie mieści”

### Backend
- endpoint `/solve`  
- zwracanie pozycji XYZ, rotacji oraz komunikatu tekstowego

---

## Tydzień 6 – Wizualizacja 3D (10h)
### Technicznie
- Three.js  
- Kamera izometryczna (fixed)  
- Prosty model busa (box)  
- Rysowanie ładunków jako kolorowane boxy

### Funkcje
- stały widok 35° × 45°  
- legenda kolorów  

---

## Tydzień 7 – Finalizacja (10h)
- pełna integracja solvera z wizualizacją  
- komunikaty: „wejdzie / nie wejdzie”  
- UI podsumowania  
- stabilizacja solvera  
- poprawki UX

---

## Tydzień 8 – Deploy + testy + dopracowanie landing page (10h)
### Testy
- presety busów  
- presety ładunków  
- przypadki krańcowe solvera  

### Deploy
- Backend: Railway  
- Frontend: Netlify / Vercel  
- Podpięcie domeny NaStrzala.com

### Marketing
- dodanie gifa prezentującego działanie  
- CTA „wypróbuj teraz”

---

# 🧱 Buffer (opcjonalne +10–20h)
- poprawki solvera  
- lepsza wizualizacja 3D  
- uzupełnienie mikrointerakcji

---

# Podsumowanie
**Łącznie: 80h (8 tygodni × 10h)**  
Plan zapewnia pełne MVP: landing, wybór busów i ładunków, solver oraz izometryczną wizualizację 3D.
