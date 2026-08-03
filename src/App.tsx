import { Routes, Route } from 'react-router-dom'
import ScreenplayEditor from '@/components/open-draft/ScreenplayEditor'
import TreatmentEditor from '@/components/open-draft/TreatmentEditor'
import ProjectList from '@/components/open-draft/ProjectList'
import ProjectView from '@/components/open-draft/ProjectView'
import SettingsPage from '@/components/open-draft/SettingsPage'
import Toast from '@/components/open-draft/Toast'
import AuthGate from '@/components/open-draft/AuthGate'
import AuthBootstrap from '@/components/open-draft/AuthBootstrap'
import StorageFallbackDialog from '@/components/open-draft/StorageFallbackDialog'
import SaveErrorDialog from '@/components/open-draft/SaveErrorDialog'
import OneDriveWarningDialog from '@/components/open-draft/OneDriveWarningDialog'
import VerifyEmailRoute from '@/components/open-draft/VerifyEmailRoute'
import ResetPasswordRoute from '@/components/open-draft/ResetPasswordRoute'
import { pluginRegistry } from './plugins/registry'
import AppShell from './components/app-shell'
import { EditorProvider } from './providers/editor-provider'
import EditorInitialiser from './components/editor-initialiser'

function App() {
  const pluginRoutes = pluginRegistry.getRoutes()

  return (
    <>
      <EditorProvider>
        <EditorInitialiser />
        <AppShell />
        {/* <DemoBanner /> */}

        <Routes>
          <Route path="/" element={<ScreenplayEditor />} />
          <Route path="/verify" element={<VerifyEmailRoute />} />
          <Route path="/reset-password" element={<ResetPasswordRoute />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/project/:projectId" element={<ProjectView />} />
          <Route
            path="/project/:projectId/edit/:scriptId"
            element={<ScreenplayEditor />}
          />
          <Route
            path="/project/:projectId/treatment/:scriptId"
            element={<TreatmentEditor />}
          />
          <Route
            path="/project/:projectId/history/:scriptId/:commitHash"
            element={<ScreenplayEditor />}
          />
          <Route path="/collab/:collabToken" element={<ScreenplayEditor />} />
          <Route path="/settings" element={<SettingsPage />} />
          {pluginRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={<r.component />} />
          ))}
        </Routes>
        <Toast />
        <AuthGate />
        <AuthBootstrap />
        <StorageFallbackDialog />
        <SaveErrorDialog />
        <OneDriveWarningDialog />
      </EditorProvider>
    </>
  )
}

export default App
