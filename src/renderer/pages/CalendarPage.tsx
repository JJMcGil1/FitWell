/**
 * CalendarPage
 *
 * Full-page calendar view.
 */

import React from 'react';
import { Calendar } from '../components';

export const CalendarPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-6 pb-8 overflow-hidden">
      <Calendar />
    </div>
  );
};
