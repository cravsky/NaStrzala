import styles from './DimensionsDialog.module.css';
import VanVisualization from '../VanVisualization/VanVisualization';

function DimensionsDialog({ vehicle, selectedCargo, onClose }) {
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {vehicle.brand} {vehicle.model} {vehicle.variant}
          </h2>
          <button className={styles.closeButton} onClick={onClose} title="Powrót">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.visualizationContainer}>
            <VanVisualization vehicle={vehicle} selectedCargo={selectedCargo} />
          </div>

          <div className={styles.infoPanel}>
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

            {selectedCargo && selectedCargo.length > 0 && (
              <div className={styles.cargoList}>
                <h3 className={styles.subtitle}>Wybrane ładunki</h3>
                <ul className={styles.list}>
                  {selectedCargo.map((cargo, index) => (
                    <li key={index} className={styles.cargoItem}>
                      <div className={styles.cargoInfo}>
                        <span className={styles.cargoName}>{cargo.name}</span>
                        <span className={styles.cargoQuantity}>× {cargo.quantity}</span>
                      </div>
                      <div className={styles.cargoDimensions}>
                        {cargo.dimensions.length}×{cargo.dimensions.width}×{cargo.dimensions.height} mm
                        {cargo.weight_kg && <span className={styles.weight}> • {cargo.weight_kg} kg</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DimensionsDialog;
