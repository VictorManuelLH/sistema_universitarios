import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  ClipboardCheck,
  FileText,
  BookOpen,
  Scale,
  Star,
  KeyRound,
  Users,
  LayoutDashboard,
  CalendarDays,
  UserCircle,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Mapa de iconos por nombre
const iconMap = {
  Home,
  ClipboardCheck,
  FileText,
  BookOpen,
  Scale,
  Star,
  KeyRound,
  Users,
  LayoutDashboard,
  CalendarDays,
  UserCircle,
  GraduationCap
};

const navItemsAlumno = [
  { path: '/', label: 'Inicio', icon: 'Home' },
  { path: '/horario', label: 'Horario', icon: 'CalendarDays' },
  { path: '/asistencia', label: 'Asistencia', icon: 'ClipboardCheck' },
  { path: '/calificaciones', label: 'Calificaciones', icon: 'GraduationCap' },
  { path: '/reportes', label: 'Reportes', icon: 'FileText' },
  { path: '/reporte-lectura', label: 'Reporte de Lectura', icon: 'BookOpen' },
  { path: '/lineamientos', label: 'Lineamientos', icon: 'Scale' },
  { path: '/evaluacion-profesores', label: 'Evaluación de Profesores', icon: 'Star' },
  { path: '/perfil', label: 'Mi Perfil', icon: 'UserCircle' },
  { path: '/cambiar-clave', label: 'Cambiar Clave', icon: 'KeyRound' }
];

const navItemsProfesor = [
  { path: '/', label: 'Inicio', icon: 'Home' },
  { path: '/horario', label: 'Horario', icon: 'CalendarDays' },
  { path: '/gestion-asistencias', label: 'Gestion de Asistencias', icon: 'ClipboardCheck' },
  { path: '/gestion-calificaciones', label: 'Calificaciones', icon: 'GraduationCap' },
  { path: '/historial-asistencias', label: 'Historial de Asistencias', icon: 'FileText' },
  { path: '/gestion-reportes', label: 'Gestion de Reportes', icon: 'BookOpen' },
  { path: '/lineamientos', label: 'Lineamientos', icon: 'Scale' },
  { path: '/perfil', label: 'Mi Perfil', icon: 'UserCircle' },
  { path: '/cambiar-clave', label: 'Cambiar Clave', icon: 'KeyRound' }
];

const navItemsAdmin = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/admin/usuarios', label: 'Gestión de Usuarios', icon: 'Users' },
  { path: '/admin/materias', label: 'Gestión de Materias', icon: 'BookOpen' },
  { path: '/admin/evaluaciones', label: 'Evaluaciones', icon: 'Star' },
  { path: '/admin/reportes', label: 'Gestión de Reportes', icon: 'FileText' },
  { path: '/perfil', label: 'Mi Perfil', icon: 'UserCircle' },
  { path: '/cambiar-clave', label: 'Cambiar Clave', icon: 'KeyRound' }
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { userRole } = useAuth();

  // Seleccionar navegación según rol
  const navItems = userRole === 'profesor'
    ? navItemsProfesor
    : userRole === 'admin'
      ? navItemsAdmin
      : navItemsAlumno;

  return (
    <>
      {/* Overlay para móvil */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const IconComponent = iconMap[item.icon];
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                {IconComponent && <IconComponent size={20} />}
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
