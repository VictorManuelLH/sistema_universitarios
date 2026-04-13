import { useState, useEffect } from 'react';
import { Table, Button, Badge, Alert, Modal, Form, Row, Col, Spinner, Pagination } from 'react-bootstrap';
import { UserPlus, Pencil, Trash2, Search } from 'lucide-react';
import api from '../../utils/api';

const rolLabels = { alumno: 'Alumno', profesor: 'Profesor', admin: 'Admin' };
const rolVariants = { alumno: 'primary', profesor: 'success', admin: 'danger' };
const POR_PAGINA = 10;

const formVacio = {
  name: '', email: '', password: '', role: 'alumno',
  matricula: '', carrera: '', semestre: '',
  numEmpleado: '', departamento: ''
};

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const data = await api.get('/users');
      setUsuarios(data);
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(formVacio);
    setModalError('');
    setShowModal(true);
  };

  const abrirEditar = (usuario) => {
    setEditando(usuario);
    setModalError('');
    setForm({
      name: usuario.name,
      email: usuario.email,
      password: '',
      role: usuario.role,
      matricula: usuario.matricula || '',
      carrera: usuario.carrera || '',
      semestre: usuario.semestre || '',
      numEmpleado: usuario.numEmpleado || '',
      departamento: usuario.departamento || ''
    });
    setShowModal(true);
  };

  const confirmarEliminar = (usuario) => {
    setUsuarioAEliminar(usuario);
    setShowDeleteModal(true);
  };

  const handleEliminar = async () => {
    try {
      await api.delete(`/users/${usuarioAEliminar._id}`);
      setUsuarios(prev => prev.filter(u => u._id !== usuarioAEliminar._id));
      setMensaje({ tipo: 'success', texto: 'Usuario eliminado correctamente.' });
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message });
    } finally {
      setShowDeleteModal(false);
      setUsuarioAEliminar(null);
    }
  };

  const handleGuardar = async () => {
    setModalError('');
    if (!form.name.trim()) {
      setModalError('El nombre es obligatorio.');
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setModalError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!editando && form.password.length < 6) {
      setModalError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (form.role === 'alumno' && !form.matricula.trim()) {
      setModalError('La matrícula es obligatoria para alumnos.');
      return;
    }
    if (form.role === 'profesor' && !form.numEmpleado.trim()) {
      setModalError('El número de empleado es obligatorio para profesores.');
      return;
    }
    setGuardando(true);
    try {
      if (editando) {
        const body = { name: form.name, email: form.email, role: form.role };
        if (form.role === 'alumno') {
          body.matricula = form.matricula;
          body.carrera = form.carrera;
          body.semestre = form.semestre;
        } else if (form.role === 'profesor') {
          body.numEmpleado = form.numEmpleado;
          body.departamento = form.departamento;
        }
        const actualizado = await api.put(`/users/${editando._id}`, body);
        setUsuarios(prev => prev.map(u => u._id === editando._id ? actualizado : u));
        setMensaje({ tipo: 'success', texto: 'Usuario actualizado correctamente.' });
      } else {
        const body = { ...form };
        if (form.role !== 'alumno') { delete body.matricula; delete body.carrera; delete body.semestre; }
        if (form.role !== 'profesor') { delete body.numEmpleado; delete body.departamento; }
        const nuevo = await api.post('/auth/register', body);
        setUsuarios(prev => [...prev, nuevo]);
        setMensaje({ tipo: 'success', texto: 'Usuario creado correctamente.' });
      }
      setShowModal(false);
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideTexto = u.name.toLowerCase().includes(filtro.toLowerCase()) ||
      u.email.toLowerCase().includes(filtro.toLowerCase());
    const coincideRol = rolFiltro ? u.role === rolFiltro : true;
    return coincideTexto && coincideRol;
  });

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  const totalPaginas = Math.ceil(usuariosFiltrados.length / POR_PAGINA);
  const usuariosPaginados = usuariosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div>
      <h2 className="page-title">Gestión de Usuarios</h2>
      <p className="page-subtitle">Crea, edita y elimina alumnos, profesores y administradores.</p>

      {mensaje && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>
          {mensaje.texto}
        </Alert>
      )}

      <div className="filtros-card mb-4">
        <Row className="align-items-end g-3">
          <Col md={5}>
            <Form.Label className="fw-semibold">Buscar</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                placeholder="Nombre o correo..."
                value={filtro}
                onChange={e => { setFiltro(e.target.value); setPagina(1); }}
              />
              <Button variant="outline-secondary">
                <Search size={18} />
              </Button>
            </div>
          </Col>
          <Col md={3}>
            <Form.Label className="fw-semibold">Rol</Form.Label>
            <Form.Select value={rolFiltro} onChange={e => { setRolFiltro(e.target.value); setPagina(1); }}>
              <option value="">Todos</option>
              <option value="alumno">Alumno</option>
              <option value="profesor">Profesor</option>
              <option value="admin">Admin</option>
            </Form.Select>
          </Col>
          <Col md={4} className="text-md-end">
            <Button variant="success" onClick={abrirCrear}>
              <UserPlus size={18} className="me-2" />
              Nuevo Usuario
            </Button>
          </Col>
        </Row>
      </div>

      <div className="tabla-asistencia">
        <Table responsive hover>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Info adicional</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPaginados.map(u => (
              <tr key={u._id}>
                <td className="fw-semibold">{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <Badge bg={rolVariants[u.role]} className="badge-asistencia">
                    {rolLabels[u.role]}
                  </Badge>
                </td>
                <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                  {u.role === 'alumno' && u.matricula && `Mat: ${u.matricula}`}
                  {u.role === 'profesor' && u.numEmpleado && `Emp: ${u.numEmpleado}`}
                </td>
                <td className="text-end">
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      className="action-btn action-btn-warning"
                      title="Editar"
                      onClick={() => abrirEditar(u)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="action-btn action-btn-danger"
                      title="Eliminar"
                      onClick={() => confirmarEliminar(u)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {usuariosPaginados.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {totalPaginas > 1 && (
        <div className="d-flex justify-content-center mt-3">
          <Pagination size="sm">
            <Pagination.Prev disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} />
            {Array.from({ length: totalPaginas }, (_, i) => (
              <Pagination.Item key={i + 1} active={pagina === i + 1} onClick={() => setPagina(i + 1)}>
                {i + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} />
          </Pagination>
        </div>
      )}

      {/* Modal crear / editar */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger" className="mb-3">{modalError}</Alert>}
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Nombre completo</Form.Label>
              <Form.Control
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nombre completo"
              />
            </Col>
            <Col md={6}>
              <Form.Label>Correo electrónico</Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
              />
            </Col>
            {!editando && (
              <Col md={6}>
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                />
              </Col>
            )}
            <Col md={6}>
              <Form.Label>Rol</Form.Label>
              <Form.Select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              >
                <option value="alumno">Alumno</option>
                <option value="profesor">Profesor</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Col>

            {form.role === 'alumno' && (
              <>
                <Col md={4}>
                  <Form.Label>Matrícula</Form.Label>
                  <Form.Control
                    value={form.matricula}
                    onChange={e => setForm(p => ({ ...p, matricula: e.target.value }))}
                    placeholder="Matrícula"
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Carrera</Form.Label>
                  <Form.Control
                    value={form.carrera}
                    onChange={e => setForm(p => ({ ...p, carrera: e.target.value }))}
                    placeholder="Carrera"
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Semestre</Form.Label>
                  <Form.Control
                    value={form.semestre}
                    onChange={e => setForm(p => ({ ...p, semestre: e.target.value }))}
                    placeholder="Semestre"
                  />
                </Col>
              </>
            )}

            {form.role === 'profesor' && (
              <>
                <Col md={6}>
                  <Form.Label>Número de empleado</Form.Label>
                  <Form.Control
                    value={form.numEmpleado}
                    onChange={e => setForm(p => ({ ...p, numEmpleado: e.target.value }))}
                    placeholder="Número de empleado"
                  />
                </Col>
                <Col md={6}>
                  <Form.Label>Departamento</Form.Label>
                  <Form.Control
                    value={form.departamento}
                    onChange={e => setForm(p => ({ ...p, departamento: e.target.value }))}
                    placeholder="Departamento"
                  />
                </Col>
              </>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Eliminar usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas eliminar a <strong>{usuarioAEliminar?.name}</strong>? Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleEliminar}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GestionUsuarios;
