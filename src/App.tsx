import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import DeliverableDetail from '@/pages/DeliverableDetail';
import GoalTimeline from '@/pages/GoalTimeline';
import CharityReportDetail from '@/pages/CharityReportDetail';
import CharityReportPPT from '@/pages/CharityReportPPT';
import OutputList from '@/pages/OutputList';
import GoalGenerator from '@/pages/GoalGenerator';
import Home from '@/pages/Home';
import DailyReminderPage from '@/daily-reminder/pages/DailyReminderPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DailyReminderPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/deliverables/:id" element={<DeliverableDetail />} />
        <Route path="/timeline" element={<GoalTimeline />} />
        <Route path="/reports/community-charity" element={<CharityReportPPT />} />
        <Route path="/reports/community-charity/:id" element={<CharityReportDetail />} />
        <Route path="/outputs" element={<OutputList />} />
        <Route path="/my2026" element={<GoalGenerator />} />
        <Route path="/reminder" element={<DailyReminderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
