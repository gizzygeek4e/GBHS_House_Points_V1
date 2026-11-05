/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HousePointsProvider, useHousePoints } from './context/HousePointsContext';
import { AssemblyIndexView } from './components/AssemblyIndexView';
import { TeacherLoginPage } from './components/TeacherLoginPage';
import { TeacherPortalDashboard } from './components/TeacherPortalDashboard';

import { OfflineIndicator } from './components/OfflineIndicator';

function AppContent() {
  const { currentView, teacherUser } = useHousePoints();

  // If on teacher portal but not logged in, enforce the login gate
  if (currentView === 'teacher-portal' && !teacherUser) {
    return (
      <>
        <TeacherLoginPage />
        <OfflineIndicator />
      </>
    );
  }

  // Teacher Portal
  if (currentView === 'teacher-portal' && teacherUser) {
    return (
      <>
        <TeacherPortalDashboard />
        <OfflineIndicator />
      </>
    );
  }

  // Teacher Login Page
  if (currentView === 'teacher-login') {
    return (
      <>
        <TeacherLoginPage />
        <OfflineIndicator />
      </>
    );
  }

  // Default Index Page: The Simplistic Assembly Display Layout
  return (
    <>
      <AssemblyIndexView />
      <OfflineIndicator />
    </>
  );
}

export default function App() {
  return (
    <HousePointsProvider>
      <AppContent />
    </HousePointsProvider>
  );
}
