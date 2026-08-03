import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import ProjectsPage from './pages/Projects';
import VacanciesPage from './pages/Vacancies';
import TeamPage from './pages/Team';
import PostsPage from './pages/Posts';
import ApplicationsPage from './pages/Applications';
import MessagesPage from './pages/Messages';
import { getToken } from './lib/api';

function Protected({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="vacancies" element={<VacanciesPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="messages" element={<MessagesPage />} />
      </Route>
    </Routes>
  );
}
