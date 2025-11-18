import { useState } from 'react';
import styles from './LandingPage.module.css';
import VanSelector from '../VanSelector/VanSelector';
import DimensionsDialog from '../DimensionsDialog/DimensionsDialog';

function LandingPage() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>NaStrzala.com</h1>
        <p className={styles.tagline}>
          Prosta aplikacja webowa, która w 20 sekund odpowiada na pytanie:
        </p>
        <div className={styles.questions}>
          <p className={styles.question}>„Czy to wejdzie do busa?"</p>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.description}>
          <p>
            Dla firm budowlanych, montażystów, stolarzy, okniarzy i lokalnych firm przewozowych.
            Bo drugi kurs to strata 50–200 zł i rozwalony dzień pracy.
          </p>
        </section>

        <section className={styles.selectorSection}>
          <VanSelector onSelect={handleVehicleSelect} />
        </section>
      </main>

      {isDialogOpen && selectedVehicle && (
        <DimensionsDialog
          vehicle={selectedVehicle}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
}

export default LandingPage;
