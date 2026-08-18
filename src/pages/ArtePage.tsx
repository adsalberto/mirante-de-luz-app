import React from 'react';
import SectorDashboard from '../components/SectorDashboard';

export const ArtePage: React.FC = () => {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <SectorDashboard sectorId="sec-arte" sectorName="Arte Espírita" />
    </div>
  );
};

export default ArtePage;
