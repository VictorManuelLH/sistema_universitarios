import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut, Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';

const Header = ({ onToggleSidebar }) => {
  const { logout, user, userRole } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificaciones, setNotificaciones] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Notificaciones en tiempo real con Firestore listener
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'notificaciones'),
      where('usuario', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotificaciones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user?.uid]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const marcarLeida = async (n) => {
    if (!n.leida) {
      await updateDoc(doc(db, 'notificaciones', n.id), { leida: true });
    }
    if (n.link) {
      setShowNotif(false);
      navigate(n.link);
    }
  };

  const marcarTodasLeidas = async () => {
    const batch = writeBatch(db);
    notificaciones.filter(n => !n.leida).forEach(n => {
      batch.update(doc(db, 'notificaciones', n.id), { leida: true });
    });
    await batch.commit();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  };

  const formatDate = (date) => {
    const formatted = date.toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    return formatted.replace(/(^|\s)\w/g, (l) => l.toUpperCase());
  };

  const tipoColor = { success: '#16a34a', danger: '#dc2626', warning: '#ca8a04', info: '#0891b2' };

  const displayRole = userRole === 'profesor' ? 'Profesor' : userRole === 'admin' ? 'Admin' : 'Alumno';

  return (
    <header className="app-header">
      {/* Botón menú móvil + Marca */}
      <div className="header-brand">
        <button className="mobile-menu-btn" onClick={onToggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="header-brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="header-brand-text">
          <h5>Sistema Universitario</h5>
          <small>Control de Asistencias y Calificaciones</small>
        </div>
      </div>

      {/* Lado derecho */}
      <div className="header-right">
        <div className="header-datetime">
          <div className="time">
            <Clock size={15} />
            {formatTime(currentTime)}
          </div>
          <div className="date">{formatDate(currentTime)}</div>
        </div>

        {/* Campana de notificaciones */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotif(v => !v)}
            aria-label="Notificaciones"
            aria-expanded={showNotif}
            style={{
              background: '#2d6a4f',
              border: 'none',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
              color: 'white',
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Bell size={18} />
            {noLeidas > 0 && (
              <span style={{
                position: 'absolute',
                top: 2, right: 2,
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: 16, height: 16,
                fontSize: '0.65rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, lineHeight: 1
              }}>
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </button>

          {showNotif && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 320,
              background: 'white',
              borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>
                  Notificaciones {noLeidas > 0 && <span style={{ color: '#6366f1', fontSize: '0.85rem' }}>({noLeidas} nuevas)</span>}
                </span>
                {noLeidas > 0 && (
                  <button
                    onClick={marcarTodasLeidas}
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                  >
                    Marcar todas leídas
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notificaciones.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <Bell size={28} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    Sin notificaciones
                  </div>
                ) : (
                  notificaciones.map(n => (
                    <div
                      key={n.id}
                      onClick={() => marcarLeida(n)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f8f8f8',
                        cursor: n.link ? 'pointer' : 'default',
                        background: n.leida ? 'white' : '#f5f3ff',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                        transition: 'background 0.15s'
                      }}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: tipoColor[n.tipo] || '#6366f1',
                        marginTop: 5, flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.83rem', color: '#1e293b', lineHeight: 1.4 }}>{n.mensaje}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                          {(n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt || Date.now())).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.leida && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 5 }} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-user">
          <div className="header-user-name">{user?.name}</div>
          <span className={`header-user-role ${userRole === 'profesor' ? 'role-profesor' : userRole === 'admin' ? 'role-admin' : ''}`}>
            {displayRole}
          </span>
        </div>

        <button className="btn-logout" onClick={() => { logout(); navigate('/login'); }}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </header>
  );
};

export default Header;
