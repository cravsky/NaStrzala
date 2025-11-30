import { useState } from 'react';
import styles from './CargoSelector.module.css';
import { cargoTypes } from '../../data/cargo';

function CargoSelector({ onCargoSelected, selectedCargo, onRemoveCargo }) {
  const [selectedCargoType, setSelectedCargoType] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAddCargo = () => {
    if (!selectedCargoType) return;
    const cargoType = cargoTypes.find(c => c.cargo_id === selectedCargoType);
    if (cargoType) {
      onCargoSelected({
        ...cargoType,
        quantity: quantity
      });
      // Do not reset selectedCargoType – allow rapid repeated adds of same type
      setQuantity(1); // reset quantity only
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
              <option key={cargo.cargo_id} value={cargo.cargo_id}>
                {cargo.label} ({cargo.dimensions.length}×{cargo.dimensions.width}×{cargo.dimensions.height} mm)
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
          title={selectedCargoType ? 'Dodaj kolejny ładunek tego typu' : 'Wybierz typ ładunku'}
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
                <span className={styles.itemName}>{item.label}</span>
                <span className={styles.itemQuantity}>× {item.quantity}</span>
                <span className={styles.itemDimensions}>
                  ({item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height} mm)
                </span>
                <button
                  onClick={() => onRemoveCargo(index)}
                  className={styles.removeButton}
                  title="Usuń"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 4V2h10v2h5v2h-2v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6H2V4h5zM6 6v14h12V6H6zm3 3h2v8H9V9zm4 0h2v8h-2V9z"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CargoSelector;
