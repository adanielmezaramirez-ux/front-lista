import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Badge, Alert, ProgressBar, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { adminService } from '../../services/adminService';
import { User } from '../../interfaces';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  Search, 
  Filter,
  Check2,
  X,
  ArrowRepeat,
  Shield,
  People,
  Gear,
  ExclamationTriangle,
  Check2Square
} from 'react-bootstrap-icons';

interface SelectedUser {
  id: number;
  username: string;
  currentRole: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [currentUser, setCurrentUser] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'todos') {
      if (filterRole === 'sin-rol') {
        filtered = filtered.filter(u => !u.role_name);
      } else {
        filtered = filtered.filter(u => u.role_name === filterRole);
      }
    }

    setFilteredUsers(filtered);
    setSelectAll(selectedIds.size === filtered.length && filtered.length > 0);
  }, [users, searchTerm, filterRole, selectedIds.size, filteredUsers.length]);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const toggleUser = (userId: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      clearSelection();
    } else {
      const allIds = new Set(filteredUsers.map(u => u.id));
      setSelectedIds(allIds);
    }
  };

  const prepareSingleRoleChange = (user: User) => {
    setSelectedUsers([{
      id: user.id,
      username: user.username,
      currentRole: user.role_name || 'sin-rol'
    }]);
    setSelectedRole(user.role_name || '');
    setShowModal(true);
  };

  const prepareBulkRoleChange = (role: string) => {
    const selected = Array.from(selectedIds).map(id => {
      const user = users.find(u => u.id === id);
      return {
        id,
        username: user?.username || '',
        currentRole: user?.role_name || 'sin-rol'
      };
    });

    setSelectedUsers(selected);
    setSelectedRole(role);
    setShowModal(true);
  };

  const handleAssignRole = async () => {
    if (!selectedUsers.length || !selectedRole) return;

    setUpdating(true);
    setShowModal(false);
    setShowConfirmModal(true);
    setProcessedCount(0);
    setTotalToProcess(selectedUsers.length);

    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];
      setCurrentUser(`${user.username} (${i + 1}/${selectedUsers.length})`);
      
      try {
        await adminService.assignRole(user.id, selectedRole);
        setProcessedCount(i + 1);
      } catch (err) {
        console.error(`Error al cambiar rol de ${user.username}:`, err);
        setError(`Error con usuario ${user.username}`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await fetchUsers();
    
    setUpdating(false);
    setShowConfirmModal(false);
    setSelectedIds(new Set());
    setSelectedUsers([]);
    setSelectedRole('');
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return <Badge bg="secondary" className="px-2 py-1">Sin rol</Badge>;
    
    const variants: { [key: string]: { bg: string, icon: any, label: string } } = {
      admin: { bg: 'danger', icon: <Shield className="me-1" size={12} />, label: 'Admin' },
      maestro: { bg: 'warning', icon: <People className="me-1" size={12} />, label: 'Maestro' },
      alumno: { bg: 'success', icon: <People className="me-1" size={12} />, label: 'Alumno' },
    };
    
    const config = variants[role] || { bg: 'secondary', icon: null, label: role };
    
    return (
      <Badge bg={config.bg} className="px-2 py-1 d-inline-flex align-items-center">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (user: User) => {
    if (user.deleted) return <Badge bg="dark" className="px-2 py-1">Eliminado</Badge>;
    if (user.suspended) return <Badge bg="danger" className="px-2 py-1">Suspendido</Badge>;
    if (!user.confirmed) return <Badge bg="warning" className="px-2 py-1">No confirmado</Badge>;
    return <Badge bg="success" className="px-2 py-1">Activo</Badge>;
  };

  const getRoleCounts = () => {
    const counts = {
      total: users.length,
      admin: users.filter(u => u.role_name === 'admin').length,
      maestro: users.filter(u => u.role_name === 'maestro').length,
      alumno: users.filter(u => u.role_name === 'alumno').length,
      sinRol: users.filter(u => !u.role_name).length
    };
    return counts;
  };

  if (loading) return <LoadingSpinner />;

  const counts = getRoleCounts();

  return (
    <div className="container-fluid px-0 py-3 vh-100 d-flex flex-column">
      {/* Header compacto */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-1">Gestión de Usuarios</h4>
          <small className="text-muted">
            <People className="me-1" size={14} />
            Total: <strong>{counts.total}</strong> usuarios
          </small>
        </div>
        <Button variant="outline-primary" size="sm" onClick={fetchUsers}>
          <ArrowRepeat className="me-2" /> Actualizar
        </Button>
      </div>

      {error && <Alert variant="danger" size="sm" onClose={() => setError('')} dismissible>{error}</Alert>}

      {/* Stats Cards compactas */}
      <Row className="mb-3 g-2">
        <Col xs={6} sm={3} md={2}>
          <Card className="text-center border-primary">
            <Card.Body className="p-2">
              <Shield className="text-danger mb-1" size={18} />
              <h6 className="mb-0">{counts.admin}</h6>
              <small className="text-muted">Admins</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={3} md={2}>
          <Card className="text-center border-warning">
            <Card.Body className="p-2">
              <People className="text-warning mb-1" size={18} />
              <h6 className="mb-0">{counts.maestro}</h6>
              <small className="text-muted">Maestros</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={3} md={2}>
          <Card className="text-center border-success">
            <Card.Body className="p-2">
              <People className="text-success mb-1" size={18} />
              <h6 className="mb-0">{counts.alumno}</h6>
              <small className="text-muted">Alumnos</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={3} md={2}>
          <Card className="text-center border-secondary">
            <Card.Body className="p-2">
              <ExclamationTriangle className="text-secondary mb-1" size={18} />
              <h6 className="mb-0">{counts.sinRol}</h6>
              <small className="text-muted">Sin rol</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={4}>
          <Card className="h-100 bg-light">
            <Card.Body className="p-2 d-flex align-items-center">
              <Gear className="text-primary me-2" size={20} />
              <div>
                <small className="text-muted d-block">Visibles</small>
                <strong>{filteredUsers.length}/{counts.total}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Barra de selección masiva compacta */}
      {selectedIds.size > 0 && (
        <Card className="mb-3 border-primary bg-light">
          <Card.Body className="py-2">
            <Row className="align-items-center g-2">
              <Col xs="auto">
                <Badge bg="primary" className="px-2 py-1 d-inline-flex align-items-center">
                  <Check2Square className="me-1" size={12} />
                  {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
                </Badge>
              </Col>
              <Col>
                <div className="d-flex gap-2 justify-content-end">
                  <Button variant="outline-secondary" size="sm" onClick={clearSelection}>
                    <X className="me-1" size={14} /> Limpiar
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => prepareBulkRoleChange('admin')}>
                    <Shield className="me-1" size={14} /> Admin
                  </Button>
                  <Button variant="outline-warning" size="sm" onClick={() => prepareBulkRoleChange('maestro')}>
                    <People className="me-1" size={14} /> Maestro
                  </Button>
                  <Button variant="outline-success" size="sm" onClick={() => prepareBulkRoleChange('alumno')}>
                    <People className="me-1" size={14} /> Alumno
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Filtros compactos */}
      <Card className="mb-3">
        <Card.Body className="p-2">
          <Row className="g-2">
            <Col md={6}>
              <InputGroup size="sm">
                <InputGroup.Text>
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar usuario, nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="outline-secondary" size="sm" onClick={() => setSearchTerm('')}>
                    <X size={14} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col md={4}>
              <InputGroup size="sm">
                <InputGroup.Text>
                  <Filter size={14} />
                </InputGroup.Text>
                <Form.Select 
                  value={filterRole} 
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="todos">Todos ({counts.total})</option>
                  <option value="admin">Admins ({counts.admin})</option>
                  <option value="maestro">Maestros ({counts.maestro})</option>
                  <option value="alumno">Alumnos ({counts.alumno})</option>
                  <option value="sin-rol">Sin rol ({counts.sinRol})</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={2}>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={handleSelectAll}
                className="w-100"
              >
                <Check2Square className="me-1" size={14} />
                {selectAll ? 'Deseleccionar' : 'Seleccionar'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla con scroll optimizado */}
      <Card className="flex-grow-1 d-flex flex-column">
        <Card.Header className="bg-light py-2">
          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold">Lista de Usuarios</span>
            {selectedIds.size > 0 && (
              <Badge bg="primary" className="px-2 py-1">
                <Check2Square className="me-1" size={12} />
                {selectedIds.size} seleccionados
              </Badge>
            )}
          </div>
        </Card.Header>
        <Card.Body className="p-0 overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          <Table size="sm" striped hover className="mb-0">
            <thead className="bg-light sticky-top" style={{ top: 0 }}>
              <tr>
                <th width="40" className="text-center">
                  <Form.Check type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                </th>
                <th>ID</th>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th width="90">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={selectedIds.has(user.id) ? 'table-primary' : ''}>
                  <td className="text-center">
                    <Form.Check
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleUser(user.id)}
                    />
                  </td>
                  <td>
                    <Badge bg="light" text="dark" className="px-1 py-0">#{user.id}</Badge>
                  </td>
                  <td><small>{user.username}</small></td>
                  <td><small>{user.firstname} {user.lastname}</small></td>
                  <td><small className="text-muted">{user.email}</small></td>
                  <td>{getRoleBadge(user.role_name)}</td>
                  <td>{getStatusBadge(user)}</td>
                  <td>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => prepareSingleRoleChange(user)}
                      className="w-100 py-0"
                    >
                      <Gear size={12} />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <People size={32} className="text-muted mb-2" />
                    <p className="text-muted small mb-0">No se encontraron usuarios</p>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
        <Card.Footer className="bg-white py-1">
          <small className="text-muted">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </small>
        </Card.Footer>
      </Card>

      {/* Modales simplificados */}
      <Modal show={showModal} onHide={() => !updating && setShowModal(false)} centered size="sm">
        <Modal.Header closeButton={!updating} className="bg-light py-2">
          <Modal.Title className="fs-6">
            <Gear className="me-1 text-primary" size={16} />
            {selectedUsers.length > 1 ? 'Cambio masivo' : 'Cambiar rol'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-2">
          {selectedUsers.length > 1 ? (
            <>
              <Alert variant="info" className="py-1 px-2 mb-2 small">
                {selectedUsers.length} usuarios seleccionados
              </Alert>
              <div className="small mb-2" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                {selectedUsers.map((user, i) => (
                  <div key={user.id} className="d-flex justify-content-between">
                    <span>{user.username}</span>
                    {getRoleBadge(user.currentRole)}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center mb-2">
              <small className="text-muted">Usuario: <strong>{selectedUsers[0]?.username}</strong></small>
            </div>
          )}
          <Form.Select
            size="sm"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">Nuevo rol...</option>
            <option value="admin">Admin</option>
            <option value="maestro">Maestro</option>
            <option value="alumno">Alumno</option>
          </Form.Select>
        </Modal.Body>
        <Modal.Footer className="py-1">
          <Button size="sm" variant="secondary" onClick={() => setShowModal(false)} disabled={updating}>
            Cancelar
          </Button>
          <Button size="sm" variant="primary" onClick={handleAssignRole} disabled={!selectedRole}>
            <Check2 className="me-1" size={12} /> Confirmar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de progreso simplificado */}
      <Modal show={showConfirmModal} backdrop="static" keyboard={false} centered size="sm">
        <Modal.Header className="bg-light py-2">
          <Modal.Title className="fs-6">Procesando...</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-2">
          {updating ? (
            <>
              <LoadingSpinner />
              <div className="text-center small mt-2">
                <div>{currentUser}</div>
                <ProgressBar 
                  now={(processedCount / totalToProcess) * 100} 
                  size="sm"
                  className="mt-2"
                />
              </div>
            </>
          ) : (
            <div className="text-center">
              <Check2 size={32} className="text-success mb-2" />
              <p className="small mb-0">{processedCount} usuarios actualizados</p>
            </div>
          )}
        </Modal.Body>
        {!updating && (
          <Modal.Footer className="py-1">
            <Button size="sm" variant="primary" onClick={() => setShowConfirmModal(false)}>
              Cerrar
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </div>
  );
};

export default Users;