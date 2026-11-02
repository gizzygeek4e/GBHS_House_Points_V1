/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HousePointsProvider, useHousePoints } from './context/HousePointsContext';
import { AssemblyIndexView } from './components/AssemblyIndexView';
import { TeacherLoginPage } from './components/TeacherLoginPage';
import { TeacherPortalDashboard } from './components/TeacherPortalDashboard';

function AppContent() {
  const { currentView, teacherUser } = useHousePoints();

  // If on teacher portal but not logged in, enforce the login gate
  if (currentView === 'teacher-portal' && !teacherUser) {
    return <TeacherLoginPage />;
  }

  // Teacher Portal
  if (currentView === 'teacher-portal' && teacherUser) {
    return <TeacherPortalDashboard />;
  }

  // Teacher Login Page
  if (currentView === 'teacher-login') {
    return <TeacherLoginPage />;
  }

  // Default Index Page: The Simplistic Assembly Display Layout
  return <AssemblyIndexView />;
}

export default function App() {
  return (
    <HousePointsProvider>
      <AppContent />
    </HousePointsProvider>
  );
}
