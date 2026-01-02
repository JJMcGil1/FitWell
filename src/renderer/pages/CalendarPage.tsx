/**
 * CalendarPage
 *
 * Full-page calendar view. The calendar IS the page.
 */

import React from 'react';
import { Calendar } from '../components';

export const CalendarPage: React.FC = () => {
  return (
    <div className="h-full p-6 pb-8">
      <Calendar />
    </div>
  );
};
