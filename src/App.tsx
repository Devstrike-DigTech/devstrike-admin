import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ConfirmProvider, ToastProvider } from './components/feedback';
import { getToken } from './lib/api';
import AccountPage from './pages/Account';
import ApplicationsPage from './pages/Applications';
import DashboardPage from './pages/Dashboard';
import Login from './pages/Login';
import MessagesPage from './pages/Messages';
import PostsPage from './pages/Posts';
import ProjectsPage from './pages/Projects';
import TeamPage from './pages/Team';
import VacanciesPage from './pages/Vacancies';

function Protected({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to='/login' replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route
            path='/'
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path='projects' element={<ProjectsPage />} />
            <Route path='vacancies' element={<VacanciesPage />} />
            <Route path='team' element={<TeamPage />} />
            <Route path='posts' element={<PostsPage />} />
            <Route path='applications' element={<ApplicationsPage />} />
            <Route path='messages' element={<MessagesPage />} />
            <Route path='account' element={<AccountPage />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Route>
        </Routes>
      </ConfirmProvider>
    </ToastProvider>
  );
}
