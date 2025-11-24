import { useState } from 'react';
import styles from './LandingPage.module.css';
import VanSelector from '../VanSelector/VanSelector';
import CargoSelector from '../CargoSelector/CargoSelector';
import DimensionsDialog from '../DimensionsDialog/DimensionsDialog';
import { solve } from '../../solvers/solver';
import { cargoTypes } from '../../data/cargo';
import { vehicles } from '../../data/vehicles';

function LandingPage() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedCargo, setSelectedCargo] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [solverResult, setSolverResult] = useState(null);

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleCargoSelected = (cargo) => {
    setSelectedCargo([...selectedCargo, cargo]);
  };

  const handleRemoveCargo = (index) => {
    setSelectedCargo(selectedCargo.filter((_, i) => i !== index));
  };

  const handleOpenDialog = () => {
    if (selectedVehicle && selectedCargo.length > 0) {
      // Prepare solver request with new format
      const items = selectedCargo.map(cargo => ({
        definition: cargo, // Full CargoDefinition
        quantity: cargo.quantity
      }));
      
      const request = {
        unit: 'mm',
        vehicle: selectedVehicle, // Full VehicleDefinition
        items: items,
        max_trips: 1
      };
      
      // Run solver
      const result = solve(request);
      setSolverResult(result);
      
      setIsDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>NaStrzala.com</h1>
        <p className={styles.tagline}>
          Aplikacja, która w 20 sekund odpowiada na pytanie:
        </p>
        <div className={styles.questions}>
          <p className={styles.question}>Czy to wejdzie do busa?</p>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.description}>
          <p>
            Dla firm budowlanych, montażystów i lokalnych firm przewozowych.
            Bo drugi kurs to strata 50–200 zł i rozwalony dzień pracy.
          </p>
        </section>

        <section className={styles.selectorSection}>
          <VanSelector onSelect={handleVehicleSelect} />
        </section>

        {selectedVehicle && (
          <section className={styles.selectorSection}>
            <CargoSelector 
              onCargoSelected={handleCargoSelected}
              selectedCargo={selectedCargo}
              onRemoveCargo={handleRemoveCargo}
            />
          </section>
        )}

        {selectedVehicle && selectedCargo.length > 0 && (
          <section className={styles.buttonSection}>
            <button onClick={handleOpenDialog} className={styles.checkButton}>
              Sprawdź czy się zmieści
            </button>
          </section>
        )}
      </main>

      {isDialogOpen && selectedVehicle && (
        <DimensionsDialog
          vehicle={selectedVehicle}
          selectedCargo={selectedCargo}
          solverResult={solverResult}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
}

export default LandingPage;
