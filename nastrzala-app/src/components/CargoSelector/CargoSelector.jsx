import { useState } from 'react';
import styles from './CargoSelector.module.css';
import { cargoTypes } from '../../data/cargo';

function CargoSelector({ onCargoSelected, selectedCargo }) {
  const [selectedCargoType, setSelectedCargoType] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAddCargo = () => {
    if (!selectedCargoType) return;

    const cargoType = cargoTypes.find(c => c.id === selectedCargoType);
    if (cargoType) {
      onCargoSelected({
        ...cargoType,
        quantity: quantity
      });
      setSelectedCargoType('');
      setQuantity(1);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Wybierz ładunek</h3>
      
      <div className={styles.selectorGroup}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Typ ładunku:</label>
          <select
            value={selectedCargoType}
            onChange={(e) => setSelectedCargoType(e.target.value)}
            className={styles.select}
          >
            <option value="">-- Wybierz typ --</option>
            {cargoTypes.map((cargo) => (
              <option key={cargo.id} value={cargo.id}>
                {cargo.name} ({cargo.dimensions.length}×{cargo.dimensions.width}×{cargo.dimensions.height} mm)
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Ilość:</label>
          <input
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className={styles.numberInput}
          />
        </div>

        <button
          onClick={handleAddCargo}
          disabled={!selectedCargoType}
          className={styles.addButton}
        >
          Dodaj ładunek
        </button>
      </div>

      {selectedCargo && selectedCargo.length > 0 && (
        <div className={styles.selectedList}>
          <h4 className={styles.listTitle}>Wybrane ładunki:</h4>
          <ul className={styles.list}>
            {selectedCargo.map((item, index) => (
              <li key={index} className={styles.listItem}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemQuantity}>× {item.quantity}</span>
                <span className={styles.itemDimensions}>
                  ({item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height} mm)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CargoSelector;
