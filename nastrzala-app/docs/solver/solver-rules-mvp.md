# Solver Rules — NaStrzala (MVP)

Dokument opisuje praktyczne heurystyki pakowania busa, które ma odwzorowywać solver NaStrzala.
Celem jest wynik „wystarczająco dobry” i realistyczny, nie matematycznie idealny.

---

## 1. Założenia ogólne

- Pracujemy na prostopadłościanach (AABB) wyrównanych do osi busa.
- Dopuszczamy **rotacje tylko o 90°** (0°/90°) wokół osi — żadnych kątów skośnych.
- Użytkownik podaje: wymiary, masę i kilka prostych flag (ikonki).
- Część kategorii (np. „long”, „heavy/light”) wyliczamy automatycznie z geometrii i masy.

---

## 2. Podstawowe zasady rozmieszczenia

1. **Start od grodzi (przód busa)**  
   - Punkt odniesienia `(0, 0, 0)` = **przód-lewa-dół** przestrzeni ładunkowej.
   - Ładunek układamy jak najbliżej grodzi i na podłodze.

2. **Priorytet lewej strony**  
   - Najpierw zapełniamy lewą stronę, potem środek, na końcu prawą.
   - Płyty / elementy pionowe zwykle stoją przy lewej ścianie.

3. **Tolerancja na drzwi i ściany**  
   - Zostawiamy 2–3 cm luzu przy drzwiach tylnych (z tyłu) i minimalne szczeliny między ładunkami.

4. **Środek ciężkości z przodu**  
   - Większość masy ma być jak najbliżej grodzi, żeby nie przeciążać tylnej osi.
   - Solver powinien preferować pozycje „bliżej przodu” przy układaniu ciężkich elementów.

---

## 3. Zasady oparte na masie (heavy / light)

Część informacji o „ciężkości” wyliczamy automatycznie z masy i objętości.

- **Heavy** – ładunek o wysokiej gęstości (masa / objętość powyżej progu).
- **Light** – ładunek o niskiej gęstości.

Reguły:

- Ciężkie elementy zawsze idą **na dół** i możliwie **bliżej grodzi**.
- Lekkie elementy mogą iść wyżej lub na wierzch.
- Nigdy nie kładziemy ciężkich elementów na:
  - ładunkach oznaczonych `fragile`,
  - ładunkach, które nie są `stackable`.

---

## 4. Zasady piętrowania (stackable)

Użytkownik oznacza ikoną, czy dany typ ładunku jest **stackable**.

- Jeśli `stackable = false` → **nigdy** nie stawiamy nic na tym elemencie.
- Jeśli `stackable = true`, to możemy piętrować, o ile:
  - górny element ma mniejszy lub równy footprint (projekcja na płaszczyznę XY),
  - górny element nie jest „heavy” w stosunku do dolnego (prosty limit gęstości / masy),
  - dolny element nie jest `fragile`.

Dla uproszczenia MVP:
- Możemy przyjąć prosty limit „max 2 warstwy”,
- Możemy pominąć bardziej skomplikowane modele nośności.

---

## 5. Długie ładunki (long) — kanał podłogowy

„Long” wyliczamy automatycznie, gdy kształt jest ewidentnie wydłużony w planie podłogi:
- stosunek dwóch największych wymiarów jest ≥ 4× (najmniejszy wymiar ignorujemy),
- przykłady: listwy, karnisze, rury, profile 3–6 m.

Uwaga: elementy „stojące” (np. lodówki/płyty oznaczone jako `vertical`) nie są traktowane jako LONG — mają własne zasady rozmieszczenia.

Reguły:

1. Długie ładunki układamy jako pierwsze, tworząc **kanał podłogowy** wzdłuż busa.
2. Kanał ma określoną szerokość (np. 10–40 cm) i biegnie wzdłuż osi X (długości busa).
3. Długie elementy zawsze leżą **na podłodze**.
4. Nie kładziemy na nich ciężkich elementów; może pojawić się drobny, lekki ładunek, ale MVP może to po prostu blokować.
5. **Brak kątów skośnych** w solverze: jeśli element jest dłuższy niż przestrzeń, solver raportuje „nie wchodzi (osiowo)”.

W raporcie tekstowym można dodać uwagę, że w praktyce lekkie listwy da się czasem włożyć lekko skośnie, ale solver tego nie uwzględnia.

---

## 6. Ładunki pionowe (vertical)

Użytkownik może oznaczyć ładunek jako **vertical** (np. płyty GK, płyty meblowe, okna).

Reguły:

- `vertical = true` oznacza, że:
  - ładunek **stoi pionowo** (wysoki wymiar idzie w oś Z),
  - nie kładziemy go na płasko,
  - dopuszczamy jedynie obrót wokół osi pionowej (zmiana „lewa/prawa ściana”).

- Tego typu ładunki zwykle:
  - ustawiamy przy lewej ścianie,
  - mogą być lekko pochylone w realu, ale solver traktuje je jako element pionowy, osiowy.

---

## 7. Ładunki delikatne (fragile)

Użytkownik ikoną oznacza, że ładunek jest **fragile** (szkło, lustra, AGD, delikatne fronty).

Reguły:

- Na `fragile = true` **nie kładziemy nic** (tak jakby były `stackable = false`). 
- Nie ustawiamy ich w miejscach, gdzie musiałyby „trzymać” cięższe elementy.
- Solver może preferować miejsca:
  - wyżej (na lekkich i stabilnych elementach),
  - bliżej środka/ścian niż na kanałach długich profili.

---

## 8. Nadkola (wheel arches)

W modelu geometrycznym busa nadkola traktujemy jako **sztywne przeszkody** (prostopadłościany).

Na potrzeby MVP:

- Nie kładziemy na nadkolu ciężkich ładunków.
- Najprostszy wariant: nadkole to „no-go zone” dla ładunków (nic na nim nie stoi).
- W kolejnych iteracjach można dopuścić lekkie kartony lub symboliczne obciążenie na nadkolu.

---

## 9. Rotacje (allow rotations)

Użytkownik ikoną `allow rotations` określa, czy dany ładunek wolno obracać.

**Założenia MVP:**

- Rozważamy **wyłącznie rotacje o 90°**:
  - zmiana długości z szerokością,
  - położenie na „boku” zamiast „na stopie”,
  - zawsze pozostajemy w układzie osiowym.

- `allow_rotations = false`:
  - bryła zachowuje swoje wejściowe przypisanie wymiarów do osi (L/W/H → X/Y/Z),
  - nie kładziemy jej na bok ani nie zmieniamy orientacji poziomej.

- `vertical = true` ma priorytet nad `allow_rotations`:
  - wymusza orientację pionową (wysoki wymiar w osi Z),
  - dopuszcza jedynie obrót wokół osi pionowej.

- **Nigdy nie rozważamy kątów skośnych** (np. 37°) – zbyt duża komplikacja dla MVP.

---

## 10. Priorytet pakowania (kolejność układania)

Przy sortowaniu elementów do pakowania rekomendowana kolejność:

1. **Długie (`long = true`) ładunki** — rezerwują kanał podłogowy.
2. **Pionowe (`vertical = true`)** – płyty, okna przy ścianie.
3. **Ciężkie (`heavy = true`) pudełka / sprzęt** – baza dolnych warstw.
4. **Pozostałe standardowe boxy**.
5. **Lekkie (`light`) oraz `fragile`** – na końcu, do wypełniania przestrzeni i górnych warstw.
6. **Małe „dopychacze”** – wypełnianie luk, o ile solver będzie to wspierał.

---

## 11. Flagi użytkownika i kategorie wyliczane

### Flagi (ikonki) ustawiane przez użytkownika

Przy ręcznym dodawaniu ładunku (poza presetami) użytkownik ustawia tylko:

- `stackable` – czy można stawiać coś na górze?
- `allow_rotations` – czy wolno obracać o 90° i kłaść na bok?
- `fragile` – czy to ładunek delikatny?
- `vertical` – czy w realu powinien stać pionowo (płyty, okna)?

Te flagi są obowiązkową częścią konfiguracji ładunku i mają pierwszeństwo nad automatycznymi heurystykami.

### Kategorie wyliczane automatycznie

Na podstawie wymiarów i masy solver wylicza:

- `long` – jeśli stosunek największego wymiaru do najmniejszego ≥ zadany próg (np. 3×).
- `heavy` / `light` – na podstawie gęstości (`masa / objętość`) i skonfigurowanego progu.

Te kategorie służą do:

- ustalania priorytetu pakowania,
- decydowania, czy ładunek może być podstawą stosu,
- sprawdzania, czy jakieś ułożenie nie jest „nielogiczne” (np. lekki pod ciężkim bez stackable).

---

## 12. Ograniczenia MVP

- Brak obsługi kątów skośnych (ukośne ułożenie listew, „wciśnięcie” elementu pod sufitem).
- Brak pełnego modelu nośności (nadkola, maksymalny nacisk na elementy).
- Proste piętrowanie (np. max 2 poziomy) i uproszczone kryteria stabilności.

Te ograniczenia są świadomym kompromisem na rzecz szybkości solvera i prostoty implementacji.
