import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProviders } from './lib/app'
import Shell from './layout/Shell'
import Dashboard from './pages/Dashboard'
import Analysis from './pages/Analysis'
import Assistant from './pages/Assistant'
import Customers from './pages/Customers'
import CustomerProfile from './pages/CustomerProfile'
import Conversations from './pages/Conversations'
import ConversationView from './pages/ConversationView'
import Escalations from './pages/Escalations'
import Verifications from './pages/Verifications'
import Knowledge from './pages/Knowledge'
import ArticleEditor from './pages/ArticleEditor'
import Seminars from './pages/Seminars'
import SeminarDetail from './pages/SeminarDetail'
import Marketing from './pages/Marketing'
import AiMonitoring from './pages/AiMonitoring'
import Analytics from './pages/Analytics'
import Staff from './pages/Staff'
import AuditLog from './pages/AuditLog'
import SettingsPage from './pages/Settings'
import Translations from './pages/Translations'

export default function App() {
  return (
    <AppProviders>
      <HashRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerProfile />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/conversations/:id" element={<ConversationView />} />
            <Route path="/escalations" element={<Escalations />} />
            <Route path="/verifications" element={<Verifications />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/knowledge/:id" element={<ArticleEditor />} />
            <Route path="/seminars" element={<Seminars />} />
            <Route path="/seminars/:id" element={<SeminarDetail />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/ai-monitoring" element={<AiMonitoring />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/translations" element={<Translations />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProviders>
  )
}
