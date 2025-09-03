import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import RecordDetail from './pages/RecordDetail';
import Playgrounds from './pages/Playgrounds';
import PlaygroundDetail from './pages/PlaygroundDetail';
import DebugSessionDetail from './pages/DebugSessionDetail';
import ApiTest from './pages/ApiTest';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/records/:id" element={<RecordDetail />} />
          <Route path="/playgrounds" element={<Playgrounds />} />
          <Route path="/playground/:id" element={<PlaygroundDetail />} />
          <Route path="/playground/:id/sessions/:sessionId" element={<DebugSessionDetail />} />
          <Route path="/api-test" element={<ApiTest />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
