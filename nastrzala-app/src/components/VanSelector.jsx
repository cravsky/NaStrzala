import { useState } from 'react';
import styles from './VanSelector.module.css';
import { vehicles } from '../data/vehicles';

function VanSelector({ onSelect }) {
  const [selectedValue, setSelectedValue] = useState('');

  const handleChange = (event) => {
    const index = event.target.value;
    setSelectedValue(index);

    if (index !== '') {
      const vehicle = vehicles[parseInt(index)];
      onSelect(vehicle);
    }
  };

  return (
    <div className={styles.container}>
      <label htmlFor="van-select" className={styles.label}>
        Wybierz bus
      </label>
      <select
        id="van-select"
        className={styles.select}
        value={selectedValue}
        onChange={handleChange}
      >
        <option value="">Wybierz model busa...</option>
        {vehicles.map((vehicle, index) => (
          <option key={index} value={index}>
            {vehicle.brand} {vehicle.model} {vehicle.variant}
          </option>
        ))}
      </select>
    </div>
  );
}

export default VanSelector;
