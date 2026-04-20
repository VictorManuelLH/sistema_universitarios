import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar } from 'lucide-react';

const COLORS = [
  '#4f46e5', '#0891b2', '#16a34a', '#ca8a04', '#dc2626',
  '#9333ea', '#c2410c', '#0f766e', '#1d4ed8', '#be185d'
];

const DAYS = [
  { num: 1, label: 'Lunes' },
  { num: 2, label: 'Martes' },
  { num: 3, label: 'Miércoles' },
  { num: 4, label: 'Jueves' },
  { num: 5, label: 'Viernes' },
];

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 64; // px por hora

const parseHorario = (horario) => {
  const diasMap = { 'Lun': 1, 'Mar': 2, 'Mie': 3, 'Jue': 4, 'Vie': 5, 'Sab': 6 };
  try {
    const parts = horario.trim().split(' ');
    const daysPart = parts[0];
    const timePart = parts[1];

    let dias = [];
    if (daysPart.includes('-')) {
      const [d1, d2] = daysPart.split('-');
      const start = diasMap[d1];
      const end = diasMap[d2];
      // Diferencia de 2 = días alternos (Lun-Mie, Mar-Jue)
      if (end - start === 2) {
        dias = [start, end];
      } else {
        for (let i = start; i <= end; i++) dias.push(i);
      }
    } else {
      dias = [diasMap[daysPart] ?? 1];
    }

    const [horaInicio, horaFin] = timePart.split('-');
    const [hi, mi] = horaInicio.split(':').map(Number);
    const [hf, mf] = horaFin.split(':').map(Number);

    return {
      dias,
      inicioMin: hi * 60 + (mi || 0),
      finMin: hf * 60 + (mf || 0)
    };
  } catch {
    return { dias: [], inicioMin: 0, finMin: 0 };
  }
};

const formatTime = (horario) => {
  const parts = horario.trim().split(' ');
  return parts[1] || horario;
};

const Horario = () => {
  const { userRole, user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    const cargar = async () => {
      try {
        const campo = userRole === 'alumno' ? 'alumnos' : 'profesor';
        const op = userRole === 'alumno' ? 'array-contains' : '==';
        const q = query(collection(db, 'materias'), where(campo, op, user.uid));
        const snap = await getDocs(q);
        setMaterias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        setError(err.message || 'No se pudo cargar el horario.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.uid, userRole]);

  const hours = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hours.push(h);
  }

  const todayNum = new Date().getDay(); // 0=Dom, 1=Lun, ...

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center gap-2 mb-4">
        <Calendar size={24} className="text-primary" />
        <h4 className="mb-0 fw-bold">Mi Horario</h4>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <div className="card shadow-sm">
          <div className="card-body p-0" style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 620 }}>

              {/* Cabecera con días */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '56px repeat(5, 1fr)',
                borderBottom: '2px solid #dee2e6',
                background: '#f8f9fa'
              }}>
                <div />
                {DAYS.map(d => (
                  <div
                    key={d.num}
                    className="text-center py-2 fw-semibold"
                    style={{
                      borderLeft: '1px solid #dee2e6',
                      fontSize: '0.85rem',
                      color: d.num === todayNum ? '#4f46e5' : '#495057',
                      background: d.num === todayNum ? '#eef2ff' : 'transparent'
                    }}
                  >
                    {d.label}
                    {d.num === todayNum && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#4f46e5',
                          marginLeft: 4,
                          verticalAlign: 'middle'
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Cuerpo del calendario */}
              <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(5, 1fr)' }}>

                {/* Columna de horas */}
                <div>
                  {hours.map(h => (
                    <div
                      key={h}
                      style={{
                        height: HOUR_HEIGHT,
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-end',
                        paddingRight: 8,
                        paddingTop: 3,
                        fontSize: '0.7rem',
                        color: '#adb5bd',
                        userSelect: 'none'
                      }}
                    >
                      {h}:00
                    </div>
                  ))}
                </div>

                {/* Columnas de días */}
                {DAYS.map(day => (
                  <div
                    key={day.num}
                    style={{
                      position: 'relative',
                      borderLeft: '1px solid #dee2e6',
                      background: day.num === todayNum ? '#fafafe' : 'transparent'
                    }}
                  >
                    {/* Líneas de hora */}
                    {hours.map(h => (
                      <div
                        key={h}
                        style={{
                          height: HOUR_HEIGHT,
                          borderBottom: '1px solid #f0f0f0'
                        }}
                      />
                    ))}

                    {/* Bloques de materias */}
                    {materias.map((materia, idx) => {
                      const { dias, inicioMin, finMin } = parseHorario(materia.horario);
                      if (!dias.includes(day.num)) return null;

                      const pxPerMin = HOUR_HEIGHT / 60;
                      const top = (inicioMin - START_HOUR * 60) * pxPerMin;
                      const height = (finMin - inicioMin) * pxPerMin;
                      const color = COLORS[idx % COLORS.length];

                      return (
                        <div
                          key={materia.id}
                          style={{
                            position: 'absolute',
                            top: top + 2,
                            left: 3,
                            right: 3,
                            height: height - 4,
                            backgroundColor: color,
                            color: 'white',
                            borderRadius: 6,
                            padding: '4px 7px',
                            fontSize: '0.72rem',
                            overflow: 'hidden',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                            cursor: 'default'
                          }}
                          title={`${materia.nombre} — Grupo ${materia.grupo}\n${materia.horario}`}
                        >
                          <div className="fw-semibold" style={{ lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {materia.nombre}
                          </div>
                          {height > 44 && (
                            <div style={{ opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Grupo {materia.grupo}
                            </div>
                          )}
                          {height > 68 && (
                            <div style={{ opacity: 0.75 }}>
                              {formatTime(materia.horario)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leyenda */}
          {materias.length > 0 && (
            <div className="card-footer bg-light">
              <div className="d-flex flex-wrap gap-3 align-items-center">
                <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Materias:</span>
                {materias.map((materia, idx) => (
                  <div key={materia.id} className="d-flex align-items-center gap-1">
                    <div style={{
                      width: 11,
                      height: 11,
                      borderRadius: 3,
                      backgroundColor: COLORS[idx % COLORS.length],
                      flexShrink: 0
                    }} />
                    <span style={{ fontSize: '0.78rem' }}>
                      {materia.nombre} <span className="text-muted">({materia.grupo})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {materias.length === 0 && (
            <div className="text-center py-5 text-muted">
              <Calendar size={40} className="mb-2 opacity-25" />
              <p className="mb-0">No tienes materias asignadas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Horario;
