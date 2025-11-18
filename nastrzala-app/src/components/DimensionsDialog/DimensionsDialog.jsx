import styles from './DimensionsDialog.module.css';

function DimensionsDialog({ vehicle, onClose }) {
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
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
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
  );
}

export default DimensionsDialog;
