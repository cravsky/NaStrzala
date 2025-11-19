import { useState } from 'react';
import styles from './DimensionsDialog.module.css';
import VanVisualization from '../VanVisualization/VanVisualization';

function DimensionsDialog({ vehicle, onClose }) {
  const [cargoLength, setCargoLength] = useState(vehicle.cargo_box.length / 2);
  const [cargoWidth, setCargoWidth] = useState(vehicle.cargo_box.width / 2);
  const [cargoHeight, setCargoHeight] = useState(vehicle.cargo_box.height / 2);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const doesFit =
    cargoLength <= vehicle.cargo_box.length &&
    cargoWidth <= vehicle.cargo_box.width &&
    cargoHeight <= vehicle.cargo_box.height;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {vehicle.brand} {vehicle.model} {vehicle.variant}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.visualizationContainer}>
            <VanVisualization
              vehicle={vehicle}
              cargoLength={cargoLength}
              cargoWidth={cargoWidth}
              cargoHeight={cargoHeight}
            />
          </div>

          <div className={styles.controls}>
            <h3 className={styles.subtitle}>Wymiary paczki</h3>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Długość: <span className={styles.value}>{cargoLength} mm</span>
              </label>
              <input
                type="range"
                min="100"
                max={vehicle.cargo_box.length}
                value={cargoLength}
                onChange={(e) => setCargoLength(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Szerokość: <span className={styles.value}>{cargoWidth} mm</span>
              </label>
              <input
                type="range"
                min="100"
                max={vehicle.cargo_box.width}
                value={cargoWidth}
                onChange={(e) => setCargoWidth(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Wysokość: <span className={styles.value}>{cargoHeight} mm</span>
              </label>
              <input
                type="range"
                min="100"
                max={vehicle.cargo_box.height}
                value={cargoHeight}
                onChange={(e) => setCargoHeight(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={`${styles.fitIndicator} ${doesFit ? styles.fits : styles.doesNotFit}`}>
              {doesFit ? '✓ Paczka zmieści się' : '✗ Paczka jest za duża'}
            </div>
          </div>

          <div className={styles.vanDimensions}>
            <h3 className={styles.subtitle}>Wymiary przestrzeni ładunkowej</h3>
            <div className={styles.dimensions}>
              <div className={styles.dimension}>
                <span className={styles.label}>Długość:</span>
                <span className={styles.value}>{vehicle.cargo_box.length} mm</span>
              </div>
              <div className={styles.dimension}>
                <span className={styles.label}>Szerokość:</span>
                <span className={styles.value}>{vehicle.cargo_box.width} mm</span>
              </div>
              <div className={styles.dimension}>
                <span className={styles.label}>Wysokość:</span>
                <span className={styles.value}>{vehicle.cargo_box.height} mm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DimensionsDialog;
