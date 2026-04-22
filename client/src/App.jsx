import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Inicio from './pages/Inicio';
import Asistencia from './pages/Asistencia';
import Reportes from './pages/Reportes';
import ReporteLectura from './pages/ReporteLectura';
import Lineamientos from './pages/Lineamientos';
import EvaluacionProfesores from './pages/EvaluacionProfesores';
import EvaluarProfesor from './pages/EvaluarProfesor';
import CambiarPassword from './pages/CambiarPassword';
import Horario from './pages/Horario';
import Perfil from './pages/Perfil';
import GestionAsistencias from './pages/profesor/GestionAsistencias';
import HistorialAsistencias from './pages/profesor/HistorialAsistencias';
import GestionReportes from './pages/profesor/GestionReportes';
import GestionCalificaciones from './pages/profesor/GestionCalificaciones';
import Calificaciones from './pages/Calificaciones';
import GestionUsuarios from './pages/admin/GestionUsuarios';
import GestionMaterias from './pages/admin/GestionMaterias';
import EvaluacionesAdmin from './pages/admin/EvaluacionesAdmin';
import NotFound from './pages/NotFound';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12 }}>
          <h4>Algo salió mal</h4>
          <p className="text-muted">Ocurrió un error inesperado.</p>
          <button className="btn btn-primary" onClick={() => this.setState({ hasError: false })}>
            Intentar de nuevo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ role, children }) => {
  const { userRole } = useAuth();
  return userRole === role ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Rutas compartidas */}
        <Route path="/" element={<Inicio />} />
        <Route path="/horario" element={<Horario />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/lineamientos" element={<Lineamientos />} />
        <Route path="/cambiar-clave" element={<CambiarPassword />} />

        {/* Rutas de alumno */}
        <Route path="/calificaciones" element={<RoleRoute role="alumno"><Calificaciones /></RoleRoute>} />
        <Route path="/asistencia" element={<RoleRoute role="alumno"><Asistencia /></RoleRoute>} />
        <Route path="/reportes" element={<RoleRoute role="alumno"><Reportes /></RoleRoute>} />
        <Route path="/reporte-lectura" element={<RoleRoute role="alumno"><ReporteLectura /></RoleRoute>} />
        <Route path="/evaluacion-profesores" element={<RoleRoute role="alumno"><EvaluacionProfesores /></RoleRoute>} />
        <Route path="/evaluacion-profesores/:id" element={<RoleRoute role="alumno"><EvaluarProfesor /></RoleRoute>} />

        {/* Rutas de profesor */}
        <Route path="/gestion-calificaciones" element={<RoleRoute role="profesor"><GestionCalificaciones /></RoleRoute>} />
        <Route path="/gestion-asistencias" element={<RoleRoute role="profesor"><GestionAsistencias /></RoleRoute>} />
        <Route path="/historial-asistencias" element={<RoleRoute role="profesor"><HistorialAsistencias /></RoleRoute>} />
        <Route path="/gestion-reportes" element={<RoleRoute role="profesor"><GestionReportes /></RoleRoute>} />

        {/* Rutas de admin */}
        <Route path="/admin/usuarios" element={<RoleRoute role="admin"><GestionUsuarios /></RoleRoute>} />
        <Route path="/admin/materias" element={<RoleRoute role="admin"><GestionMaterias /></RoleRoute>} />
        <Route path="/admin/evaluaciones" element={<RoleRoute role="admin"><EvaluacionesAdmin /></RoleRoute>} />
        <Route path="/admin/reportes" element={<RoleRoute role="admin"><GestionReportes /></RoleRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
