import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/components/auth/LoginPage';
import { UnifiedTimerPage } from '@/components/timer/UnifiedTimerPage';
import { StatsPage } from '@/components/stats/StatsPage';
import { AppShell } from '@/components/layout/AppShell';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<UnifiedTimerPage />} />
            <Route path="stats" element={<StatsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
