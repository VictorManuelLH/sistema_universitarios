import { useState, useEffect } from 'react';
import { Table, Button, Badge, Alert, Modal, Form, Row, Col, Spinner } from 'react-bootstrap';
import { BookPlus, Pencil, Trash2, Users, X } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const formVacio = { nombre: '', grupo: '', profesor: '', horario: '', alumnos: [] };

const GestionMaterias = () => {
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materiaAEliminar, setMateriaAEliminar] = useState(null);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);
  const [alumnoSearch, setAlumnoSearch] = useState('');
  const [modalError, setModalError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const [materiasSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'materias'), orderBy('nombre'))),
        getDocs(collection(db, 'users'))
      ]);
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMaterias(materiasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setProfesores(users.filter(u => u.role === 'profesor'));
      setAlumnosDisponibles(users.filter(u => u.role === 'alumno'));
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getNombreProfesor = (uid) => profesores.find(p => p.id === uid)?.name || '—';
  const getNombreAlumno = (uid) => alumnosDisponibles.find(a => a.id === uid)?.name || uid;

  const abrirCrear = () => {
    setEditando(null);
    setForm(formVacio);
    setAlumnoSearch('');
    setModalError('');
    setShowModal(true);
  };

  const abrirEditar = (materia) => {
    setEditando(materia);
    setModalError('');
    setForm({
      nombre: materia.nombre,
      grupo: materia.grupo,
      profesor: materia.profesor || '',
      horario: materia.horario,
      alumnos: materia.alumnos || []
    });
    setAlumnoSearch('');
    setShowModal(true);
  };

  const confirmarEliminar = (materia) => {
    setMateriaAEliminar(materia);
    setShowDeleteModal(true);
  };

  const handleEliminar = async () => {
    try {
      await deleteDoc(doc(db, 'materias', materiaAEliminar.id));
      setMaterias(prev => prev.filter(m => m.id !== materiaAEliminar.id));
      setMensaje({ tipo: 'success', texto: 'Materia eliminada correctamente.' });
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message });
    } finally {
      setShowDeleteModal(false);
      setMateriaAEliminar(null);
    }
  };

  const toggleAlumno = (alumnoId) => {
    setForm(prev => ({
      ...prev,
      alumnos: prev.alumnos.includes(alumnoId)
        ? prev.alumnos.filter(id => id !== alumnoId)
        : [...prev.alumnos, alumnoId]
    }));
  };

  const handleGuardar = async () => {
    setModalError('');
    if (!form.nombre.trim()) return setModalError('El nombre de la materia es obligatorio.');
    if (!form.grupo.trim()) return setModalError('El grupo es obligatorio.');
    if (!form.horario.trim()) return setModalError('El horario es obligatorio.');
    if (!form.profesor) return setModalError('Debes asignar un profesor.');

    setGuardando(true);
    try {
      const data = {
        nombre: form.nombre,
        grupo: form.grupo,
        horario: form.horario,
        profesor: form.profesor,
        alumnos: form.alumnos
      };

      if (editando) {
        await updateDoc(doc(db, 'materias', editando.id), data);
        setMaterias(prev => prev.map(m => m.id === editando.id ? { ...m, ...data } : m));
        setMensaje({ tipo: 'success', texto: 'Materia actualizada correctamente.' });
      } else {
        const ref = await addDoc(collection(db, 'materias'), { ...data, createdAt: serverTimestamp() });
        setMaterias(prev => [...prev, { id: ref.id, ...data }]);
        setMensaje({ tipo: 'success', texto: 'Materia creada correctamente.' });
      }
      setShowModal(false);
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  const alumnosFiltrados = alumnosDisponibles.filter(a =>
    a.name.toLowerCase().includes(alumnoSearch.toLowerCase()) ||
    (a.matricula || '').toLowerCase().includes(alumnoSearch.toLowerCase())
  );

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div>
      <h2 className="page-title">Gestión de Materias</h2>
      <p className="page-subtitle">Crea, edita y elimina materias, asigna profesores y alumnos.</p>

      {mensaje && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>
          {mensaje.texto}
        </Alert>
      )}

      <div className="d-flex justify-content-end mb-4">
        <Button variant="success" onClick={abrirCrear}>
          <BookPlus size={18} className="me-2" />
          Nueva Materia
        </Button>
      </div>

      <div className="tabla-asistencia">
        <Table responsive hover>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Grupo</th>
              <th>Profesor</th>
              <th>Horario</th>
              <th>Alumnos</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {materias.map(m => (
              <tr key={m.id}>
                <td className="fw-semibold">{m.nombre}</td>
                <td>{m.grupo}</td>
                <td>{getNombreProfesor(m.profesor)}</td>
                <td style={{ fontSize: '0.85rem' }}>{m.horario}</td>
                <td>
                  <Badge bg="secondary" className="badge-asistencia">
                    <Users size={12} className="me-1" />
                    {m.alumnos?.length || 0}
                  </Badge>
                </td>
                <td className="text-end">
                  <div className="d-flex gap-2 justify-content-end">
                    <button className="action-btn action-btn-warning" title="Editar" onClick={() => abrirEditar(m)}>
                      <Pencil size={16} />
                    </button>
                    <button className="action-btn action-btn-danger" title="Eliminar" onClick={() => confirmarEliminar(m)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {materias.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">No hay materias registradas.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Modal crear / editar */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editando ? 'Editar Materia' : 'Nueva Materia'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger" className="mb-3">{modalError}</Alert>}
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Nombre de la materia</Form.Label>
              <Form.Control
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej. Cálculo Diferencial"
              />
            </Col>
            <Col md={3}>
              <Form.Label>Grupo</Form.Label>
              <Form.Control
                value={form.grupo}
                onChange={e => setForm(p => ({ ...p, grupo: e.target.value }))}
                placeholder="Ej. A"
              />
            </Col>
            <Col md={3}>
              <Form.Label>Horario</Form.Label>
              <Form.Control
                value={form.horario}
                onChange={e => setForm(p => ({ ...p, horario: e.target.value }))}
                placeholder="Ej. Lun-Mie 08:00-10:00"
              />
            </Col>
            <Col md={12}>
              <Form.Label>Profesor</Form.Label>
              <Form.Select value={form.profesor} onChange={e => setForm(p => ({ ...p, profesor: e.target.value }))}>
                <option value="">Seleccionar profesor...</option>
                {profesores.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={12}>
              <Form.Label>Alumnos inscritos</Form.Label>
              {form.alumnos.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {form.alumnos.map(id => (
                    <span key={id} className="badge bg-light text-dark border d-flex align-items-center gap-1" style={{ padding: '6px 10px' }}>
                      {getNombreAlumno(id)}
                      <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#dc3545' }} onClick={() => toggleAlumno(id)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <Form.Control
                placeholder="Buscar alumno por nombre o matrícula..."
                value={alumnoSearch}
                onChange={e => setAlumnoSearch(e.target.value)}
                className="mb-2"
              />
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '6px' }}>
                {alumnosFiltrados.map(a => (
                  <div
                    key={a.id}
                    className={`d-flex justify-content-between align-items-center px-3 py-2 ${form.alumnos.includes(a.id) ? 'bg-light' : ''}`}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}
                    onClick={() => toggleAlumno(a.id)}
                  >
                    <span>{a.name} {a.matricula ? `(${a.matricula})` : ''}</span>
                    {form.alumnos.includes(a.id) && <Badge bg="success" style={{ fontSize: '0.7rem' }}>Inscrito</Badge>}
                  </div>
                ))}
                {alumnosFiltrados.length === 0 && (
                  <div className="text-center text-muted py-3" style={{ fontSize: '0.85rem' }}>No se encontraron alumnos.</div>
                )}
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="success" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear materia'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Eliminar materia</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas eliminar <strong>{materiaAEliminar?.nombre}</strong> - Grupo {materiaAEliminar?.grupo}? Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleEliminar}>Eliminar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GestionMaterias;
