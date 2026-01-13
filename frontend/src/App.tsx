import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Learning from './pages/Learning';
import Workspace from './pages/Workspace';
import Community from './pages/Community';
import Leisure from './pages/Leisure';
import Chat from './pages/Chat';

function App() {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={token ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/learning" />} />
          <Route path="learning" element={<Learning />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="community" element={<Community />} />
          <Route path="leisure" element={<Leisure />} />
          <Route path="chat" element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
