import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Inspector } from './components/Inspector';
import { BoardCanvas } from './components/BoardCanvas';
import { AuthModal } from './components/AuthModal';
import { ScenariosPanel } from './components/ScenariosPanel';
import { Tutorial } from './components/Tutorial';
import './App.css';

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [scenariosPanelOpen, setScenariosPanelOpen] = useState(false);
  // When the user clicks "Save to Account" while logged in we set this so the
  // panel opens directly in save mode.
  const [pendingSave, setPendingSave] = useState(false);

  /** Called when unauthenticated user wants to cloud-save. Open auth → on success open panel in save mode. */
  const requestCloudSave = () => {
    setAuthModalOpen(true);
  };

  /** Called when authenticated user clicks "Save to Account" in Inspector. */
  const openSave = () => {
    setPendingSave(true);
    setScenariosPanelOpen(true);
  };

  return (
    <AuthProvider>
      <div className="app-shell">
        <Toolbar
          onOpenScenarios={() => setScenariosPanelOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
          onCloudSave={openSave}
          onRequestAuth={requestCloudSave}
        />
        <div className="app-body">
          <Sidebar />
          <BoardCanvas />
          <Inspector />
        </div>
      </div>

      {/* Auth modal */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            setPendingSave(true);
            setScenariosPanelOpen(true);
          }}
        />
      )}

      {/* Scenarios drawer */}
      <ScenariosPanel
        open={scenariosPanelOpen}
        onClose={() => setScenariosPanelOpen(false)}
        pendingSave={pendingSave}
        onClearPendingSave={() => setPendingSave(false)}
      />
      {/* Step-by-step tutorial (first-visit only) */}
      <Tutorial />
    </AuthProvider>
  );
}

export default App;
