# Instrukcja modyfikacji solvera pakowania ładunków (NaStrzala)

## Kontekst

Projekt: **NaStrzala.com**  
Plik główny solvera: `solver.ts` (TypeScript).  
Solver działa na zasadzie:
- 3D free-space splitting,
- sortowanie largest-first,
- stacking (piętrowanie warstwowe),
- generowanie pełnego layoutu ładunku (pozycje XYZ + orientacje).

**Problem:**  
Wizualizacja wyników wygląda nienaturalnie dla człowieka:
- ładunki tego samego typu są *rozsypane* po całej przestrzeni,
- ciężkie ładunki lądują „gdziekolwiek”, często wysoko lub na środku,
- pojawiają się dziwne, duże przerwy i nienaturalne grupowania.

**Cel zmian:**  
Poprawić heurystyki tak, aby **wynik wyglądał bardziej jak pakowanie przez człowieka**, przy zachowaniu:
- poprawności geometrycznej (bez kolizji),
- aktualnego API solvera (wejście/wyjście).

**UWAGA:**  
- **Nie stosuj snapowania do siatki** (żadnego zaokrąglania do gridu).  
- Współrzędne mogą pozostać ciągłe (float), ważna jest logika rozmieszczenia i grupowania.

---

## Ogólne zasady zmian

1. **Nie zmieniaj publicznego API solvera** (`SolverRequest`, `SolverResponse`, typy w `solver-types.ts` itd.).
2. Skup się na:
   - **kolejności** pakowania,
   - **lokalnych heurystykach wyboru pozycji**, 
   - **grupowaniu ładunków tego samego typu**, 
   - **preferowanych strefach** dla różnych klas ładunku.
3. Zachowaj deterministyczność — **nie używaj losowości**.  
   Ten sam input → ten sam layout.

---

## 1. Klasyfikacja ładunków na typy „zachowania”

Dodaj do solvera **poziom abstrakcji nad cargo**, niezależnie od surowych wymiarów:

1. W warstwie wewnętrznej (np. przy ekspandowaniu `cargo_items` na `ExpandedItem`) nadaj każdemu elementowi pole typu:
   - `behavior: "PLATE" | "LONG" | "BOX"`
   - Możesz określać to heurystycznie po proporcjach wymiarów:
     - `PLATE` → jeden wymiar wyraźnie większy (płyty, okna, drzwi),
     - `LONG` → jeden wymiar >> pozostałe (rury, listwy),
     - `BOX` → reszta, bardziej „sześcienne”.
2. (Opcjonalnie) Pozwól na nadpisanie `behavior` na podstawie `CargoDefinition`, jeśli w typach jest taka informacja.

**Cel:** mieć prostą informację, *jak dany ładunek zwykle się pakuje*.

---

## 2. Grupowanie ładunków tego samego typu

**Problem do rozwiązania:**  
Elementy tego samego typu są rozsiane po całym busie.

**Zmiana:**

1. Przed właściwym pakowaniem:
   - Pogrupuj `ExpandedItem` według:
     - `cargo_id`,
     - oraz `behavior`.
   - W ramach grupy zachowaj sortowanie od największych do najmniejszych (tak jak jest, lub podobnie).
2. Zmień główną pętlę pakowania tak, aby:
   - **pakować całymi grupami**, a nie przeplatać różne cargo na przemian,
   - w ramach jednej grupy pakować elementy **blisko siebie**, tworząc stos/klaster:
     - pierwsza sztuka → szukasz najlepszej pozycji w przestrzeni wolnej,
     - kolejne sztuki → **preferencyjnie** szukasz pozycji:
       - przylegającej do już położonego elementu tej samej grupy (np. jeden bok wspólny),
       - w tej samej „kolumnie” / „rzędzie” (np. to samo `x` lub `y` w miarę możliwości).

3. Jeśli nie da się upchnąć kolejnej sztuki w pobliżu grupy:
   - dopiero wtedy pozwól solverowi szukać miejsca w innej części przestrzeni.

**Efekt oczekiwany:**  
Płyty, rury, okna itd. będą tworzyć **czytelne stosy i klastry**, zamiast jednego wielkiego „rozrzutu”.

---

## 3. Strefy załadunkowe w busie

**Cel:**  
Zastąpić „jedno wielkie pudełko” busa kilkoma **strefami preferencji**, które lepiej odzwierciedlają ludzkie nawyki pakowania.

### 3.1. Definicja stref (w kodzie solvera)

Na poziomie solvera wyznacz logiczne strefy (jako struktury pomocnicze, np. `LoadZone`):

- **Floor Zone (podłoga)**:
  - spód: `z = 0`,
  - góra: np. `z <= vehicle_height * 0.4` (lub inny próg),
  - preferowana dla: `BOX`, ciężkie elementy.
- **Wall Zone (ściana boczna)**:
  - obszar przy jednej ze ścian (np. lewej):
    - `x` blisko 0 lub maksymalnego `x` (w zależności od przyjętego układu),
  - preferowana dla: `PLATE` (płyty, okna, drzwi).
- **Upper/Middle Zone (góra/środek)**:
  - warstwa powyżej `Floor Zone`,
  - preferowana dla: lżejsze `BOX`, ewentualnie `LONG` (jeśli scenariusz wymaga).

Nie chodzi o zmianę geometrii busa, tylko o wprowadzenie **priorytetów wyboru miejsca**.

### 3.2. Logika wyboru strefy

Dla każdego elementu, przy generowaniu możliwych pozycji:
- jeśli `behavior === "PLATE"`:
  - najpierw próbuj miejsca w `Wall Zone`,
- jeśli `behavior === "LONG"`:
  - najpierw wzdłuż osi długości busa (`y` lub `z` w zależności od przyjętego układu),
  - blisko jednej ze ścian lub pod sufitem (ale nie nadmiernie wysoko, jeśli to nienaturalne),
- jeśli `behavior === "BOX"`:
  - najpierw `Floor Zone`,
  - dopiero potem strefy wyższe.

**Zaimplementuj to jako scoring/priorytet**, nie jako sztywny zakaz:
- przy ocenie kandydatów na pozycje dawaj:
  - **bonus** za zgodność ze strefą preferowaną,
  - **karę** za strefę „dziwną” (np. ciężkie pudełko wysoko i daleko od ścian).

---

## 4. Heurystyka „ciężkie na dole, lekkie wyżej”

Jeśli w `CargoDefinition` jest informacja o masie — wykorzystaj ją. Jeśli nie, możesz:
- w MVP przyjąć, że większa objętość = „cięższy”.

**Zmiana:**

1. Dodaj prostą klasyfikację:
   - `weightClass: "HEAVY" | "MEDIUM" | "LIGHT"` (np. po objętości).
2. W kolejności pakowania:
   - pakuj `HEAVY` przed `LIGHT` (w ramach danego typu).
3. W scoringu pozycji:
   - **duża kara**, gdy `HEAVY` trafia na wysokie `z`,
   - **bonus**, gdy `HEAVY` jest na niskim `z` i blisko ściany (stabilność).

---

## 5. Wybór pozycji w free-space: scoring „jak człowiek”, nie tylko „czy pasuje”

Aktualna logika (typowa) to często:
- przejście po wolnych przestrzeniach → pierwsza pasująca pozycja → koniec.

**Zmień to na:**

1. Dla danego elementu wygeneruj **kilka potencjalnych kandydatów**:
   - różne wolne boxy,
   - różne kotwiczenia w obrębie boxa (np. przy ścianie, przy podłodze).
2. Dla każdego kandydata policz **score** wg zasad:

   Przykładowe składniki:
   - + punkty za bliskość innych elementów tego samego `cargo_id`,
   - + punkty za znalezienie się w preferowanej strefie (`Floor`, `Wall`, ...)
   - – punkty za wysokość (`z`) w przypadku ciężkich ładunków,
   - – punkty za „dziurę” / pustą przestrzeń pod spodem (jeśli logicznie możesz wykryć, że element „wisi”),
   - – punkty za rozbijanie grupy (duża odległość od grupy tego samego typu).

3. Wybierz **najlepiej punktowaną pozycję**, nie pierwszą pasującą.

Dzięki temu:
- solver wciąż pozostaje heurystyczny i szybki,
- ale wynik jest *bardziej kontrolowany* i „ludzki”.

---

## 6. Redukcja nienaturalnych przerw (bez snap do siatki)

**UWAGA:**  
Nie wprowadzaj snapowania do siatki. Zamiast tego:

1. Przy pakowaniu kolejnych elementów tej samej grupy:
   - ustawiaj je tak, aby:
     - albo stykały się bokiem (`x + width === x2`),
     - albo miały **stałą, niewielką przerwę** (np. mała stała `gap` używana w jednym miejscu w solverze).
   - nie zostawiaj przypadkowych, dużych szerokich „korytarzy” między elementami tego samego typu.
2. Jeśli istnieje możliwość „dosunięcia” elementu w obrębie tego samego wolnego boxa (bez kolizji z innymi):
   - przesuwaj go do najbliższej ściany boxa lub do sąsiada z tej samej grupy.

**Najważniejsze:** dąż do **kompaktowego układu w ramach grupy**, a nie globalnej siatki.

---

## 7. Stabilność layoutu przy podobnych wejściach

Zadbaj o to, aby mała zmiana w kolejności cargo nie powodowała ogromnej różnicy w layoutcie:

1. Sortuj input deterministycznie:
   - po `behavior`,
   - po `weightClass`,
   - po objętości,
   - po `cargo_id`,
   - po `sourceIndex`.
2. Unikaj miejsc, gdzie używasz `Object.values()` bez sortowania — posortuj listy przed iteracją.

---

## 8. Co **konkretnie** zrobić krok po kroku

1. **Przejrzyj `solver.ts`**:
   - znajdź miejsce, gdzie:
     - ekspandujesz `cargo_items` na wewnętrzne elementy,
     - sortujesz elementy do pakowania,
     - iterujesz po available free-spaces / nodes,
     - wybierasz pozycję dla danego elementu.
2. Dodaj:
   - pole `behavior` oraz `weightClass` w strukturze wewnętrznej pojedynczego ładunku,
   - grupowanie elementów według `cargo_id` + `behavior`.
3. Zrefaktoruj główną pętlę:
   - pakuj całymi grupami,
   - w ramach grup dodaj logikę klastrów (szukaj pozycji obok już zapakowanych elementów tej samej grupy).
4. Zaimplementuj strefy (`Floor`, `Wall`, `Upper`) jako **logikę scoringu kandydatów**, nie jako twarde ograniczenia.
5. Zmień wybór pozycji:
   - generuj wielu kandydatów,
   - licz score według zasad z sekcji „scoring”,
   - wybieraj najlepszego.
6. Przetestuj na kilku scenariuszach (ręcznie) z dużą liczbą identycznych ładunków:
   - płyty × 20,
   - rury × 20,
   - mix: płyty + okna + kilka pudeł.

Celem jest, aby:
- elementy tego samego typu tworzyły **spójne stosy/klastry**,
- ciężkie elementy lądowały raczej na dole,
- wizualizacja wyglądała **intuicyjnie**, nawet jeśli nie jest idealnie optymalna.

---
