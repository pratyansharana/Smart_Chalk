import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ROLE } from '../constants/roles';
import { LoginPage } from '../features/auth/LoginPage';
import { SignupPage } from '../features/auth/SignupPage';
import { UnauthorizedPage } from '../features/auth/UnauthorizedPage';
import { LandingPage } from '../features/landing/LandingPage';
import { StudentDashboardPage } from '../features/student-dashboard/StudentDashboardPage';
import { TeacherDashboardPage } from '../features/teacher-dashboard/TeacherDashboardPage';
import { BatchDetailsPage } from '../features/teacher-dashboard/BatchDetailsPage';
import { PublicLayout } from '../layouts/PublicLayout';
import { StudentLayout } from '../layouts/StudentLayout';
import { TeacherLayout } from '../layouts/TeacherLayout';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRouter() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        <Routes location={location}>
          <Route element={<PublicLayout />}>
            <Route path={ROUTES.HOME} element={<LandingPage />} />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          </Route>
          <Route
            path={`${ROUTES.STUDENT}/*`}
            element={
              <ProtectedRoute allowedRoles={[ROLE.STUDENT]}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboardPage />} />
          </Route>
          <Route
            path={`${ROUTES.TEACHER}/*`}
            element={
              <ProtectedRoute allowedRoles={[ROLE.TEACHER, ROLE.ADMIN]}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherDashboardPage />} />
            <Route path="batch/:batchId" element={<BatchDetailsPage />} />
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
