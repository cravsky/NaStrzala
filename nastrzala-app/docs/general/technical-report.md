# NaStrzala.com — Raport Techniczny (v1.0)

## 1. Cel projektu
NaStrzala.com to webowa aplikacja SaaS wspierająca małe i średnie firmy budowlane oraz transport lokalny w szybkim planowaniu załadunku busa.

Główny cel:
**Umożliwić użytkownikowi sprawdzenie, czy ładunek zmieści się do danego modelu busa oraz czy można wykonać transport jednym kursem.**

Projekt łączy prosty workflow, presetowe modele pojazdów, typowe ładunki branżowe oraz automatyczną wizualizację 3D w ujęciu pasywnym (fixed camera).

---

## 2. Problem, który rozwiązujemy
Małe i średnie firmy budowlane często:
- tracą czas i pieniądze na niepotrzebne dodatkowe kursy,
- nie znają wymiarów przestrzeni ładunkowej busów,
- transportują nietypowe i wymagające elementy (płyty, okna, rury, styropian),
- nie mają żadnego narzędzia do szybkiej oceny załadunku,
- pracują pod presją czasu, zwykle “na oko”.

Skutek:
- 1 kurs za dużo = 50–200 zł straty,
- opóźnienia w pracy,
- chaotyczne planowanie,
- niezadowoleni klienci.

NaStrzala.com dostarcza **szybkiej, wizualnej odpowiedzi**:
> “Wejdzie, czy nie wejdzie? Na jeden kurs czy dwa?”

---

## 3. Grupa docelowa
**Segment główny:**  
- małe firmy budowlane (2–20 osób),
- montażyści meblowi,
- stolarze mobilni,
- firmy przewozowe <3,5 t,
- firmy od okien, drzwi i mebli,
- dostawcy lokalni (AGD, płyty GK/OSB, materiały budowlane).

**Segment poboczny:**  
- osoby planujące przeprowadzkę,  
- firmy eventowe i instalacyjne (nietypowe ładunki).

Charakterystyka:
- działają szybko,
- lubią narzędzia proste i wizualne,
- nie mają czasu na interaktywne manipulowanie 3D,
- są gotowe płacić za oszczędność kursów i czasu.

---

## 4. Zakres MVP (Etap 1 — wersja desktopowa)
### 4.1 Funkcje kluczowe
- Wybór modelu busa (preset):
  - Sprinter L2H2  
  - Sprinter L3H2  
  - Master L2H2  
  - Master L3H2  
  - Ducato/Boxer L2H2  
  - Ducato/Boxer L3H2  
- Wybór typowego ładunku (preset):
  - Płyty GK (120×200 / 120×260)  
  - Płyty OSB  
  - Płyty meblowe  
  - Rury (3m / 4m / 6m)  
  - Listwy  
  - Drzwi / ościeżnice  
  - Okna typowe  
- Automatyczne sprawdzenie:
  - czy ładunek zmieści się do busa,
  - ile kursów będzie potrzebnych,
  - czy można ułożyć elementy w sposób sensowny.
- Wizualizacja 3D (pasywna kamera, fixed iso-view)
- Generowanie raportu tekstowego (czy wejdzie / dlaczego nie).
- Generowanie prostego PDF (karta dla kierowcy).

### 4.2 Technologia
- Frontend: **React + Three.js**
- Backend: **Node.js (Railway.app)**
- Storage: **Supabase / PostgreSQL**
- Hosting: Railway + Namecheap domain (NaStrzala.com)
- PWA w późniejszym etapie (mobile-lite)

### 4.3 Solver
- Prosty solver 3D oparty o heurystykę:
  - stacking layers,
  - dopasowanie bounding boxów,
  - rotacje ograniczone (0°/90° na osiach),
  - brak interakcji użytkownika z 3D.

Celem solvera MVP nie jest dokładność milimetrowa, ale:
**szybka, wiarygodna odpowiedź + wizualizacja.**

---

## 5. Etap 2 — wersja mobilna (PWA)
- uproszczony input,
- presety busów i ładunków,
- szybkie wprowadzanie danych,
- funkcja “Pokaż kierowcy”,
- zapis projektów w chmurze.

---

## 6. Etap 3 — funkcje premium
- Obliczanie przeciążenia osi (mandaty ITD)
- Generowanie pełnych kart ładunkowych PDF
- Eksport widoku 3D do PDF / PNG
- Integracja z Google Maps API:
  - czas trasy,
  - koszt paliwa,
  - koszt dodatkowego kursu,
  - automatyczny kosztorys dla klienta
- Tryb “firma”:
  - wielu kierowców,
  - historia załadunków,
  - raporty.

---

## 7. UX – Założenia
- 1 ekran = 1 odpowiedź (zero przeładowania)
- zero interakcji 3D w MVP,
- wprowadzanie danych trwa < 20 sekund,
- preset > własne wymiary,
- wizualizacja 3D jest pasywna i czytelna.

---

## 8. Ryzyka i jak je minimalizujemy
### 8.1 Ryzyko: brak świadomości potrzeby  
**Minimalizacja:** memiczna komunikacja, case study “koszt dodatkowego kursu”.

### 8.2 Ryzyko: zbyt techniczne narzędzie  
**Minimalizacja:** pasywne 3D zamiast edytora.

### 8.3 Ryzyko: użytkownik prywatny nie płaci  
**Minimalizacja:** target na mikro-B2B.

### 8.4 Ryzyko: solver niedokładny  
**Minimalizacja:** komunikaty “wstępna symulacja”, iteracyjne ulepszenia.

---

## 9. Harmonogram etapów
Do ustalenia w kolejnym kroku.

---

## 10. Podsumowanie
NaStrzala.com ma szansę stać się narzędziem pierwszego wyboru dla małych i średnich firm budowlanych planujących załadunek.  
Połączenie prostoty, presetów, wizualizacji 3D i narzędzi technicznych (trasy, przeciążenie osi) daje projekt o wysokiej wartości użytkowej i komercyjnej.
