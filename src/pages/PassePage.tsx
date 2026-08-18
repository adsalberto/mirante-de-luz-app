import React from 'react';
import SectorDashboard from '../components/SectorDashboard';

export const PassePage: React.FC = () => {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <SectorDashboard sectorId="sec-passe" sectorName="Passe / Fluidoterapia" />
    </div>
  );
};

export default PassePage;
