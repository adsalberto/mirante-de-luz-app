import React from 'react';
import { DoutrinarioDashboard } from '../components/doutrinario/DoutrinarioDashboard';

export const DoutrinarioPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <DoutrinarioDashboard />
    </div>
  );
};

export default DoutrinarioPage;
