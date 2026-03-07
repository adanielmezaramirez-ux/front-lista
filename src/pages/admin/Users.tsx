import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { adminService } from '../../services/adminService';
import { User } from '../../interfaces';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PersonBadge, Person, PersonPlus } from 'react-bootstrap-icons';

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
  
  // Selección individual
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filtrar usuarios por búsqueda y rol
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
  }, [users, searchTerm, filterRole]);

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

  // Seleccionar por filtro
  const selectByFilter = (roleFilter: string) => {
    const newSelected = new Set<number>();
    
    filteredUsers.forEach(user => {
      if (roleFilter === 'todos') {
        newSelected.add(user.id);
      } else if (roleFilter === 'sin-rol' && !user.role_name) {
        newSelected.add(user.id);
      } else if (user.role_name === roleFilter) {
        newSelected.add(user.id);
      }
    });

    setSelectedIds(newSelected);
  };

  // Limpiar selección
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Seleccionar/Deseleccionar usuario individual
  const toggleUser = (userId: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedIds(newSelected);
  };

  // Preparar cambio individual
  const prepareSingleRoleChange = (user: User) => {
    setSelectedUsers([{
      id: user.id,
      username: user.username,
      currentRole: user.role_name || 'sin-rol'
    }]);
    setSelectedRole(user.role_name || '');
    setShowModal(true);
  };

  // Preparar cambio masivo
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

  // Procesar cambios
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

      // Pequeña pausa para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Recargar usuarios después de completar
    await fetchUsers();
    
    setUpdating(false);
    setShowConfirmModal(false);
    setSelectedIds(new Set());
    setSelectedUsers([]);
    setSelectedRole('');
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return <Badge bg="secondary">Sin rol</Badge>;
    
    const variants: { [key: string]: string } = {
      admin: 'danger',
      maestro: 'warning',
      alumno: 'success',
    };
    return <Badge bg={variants[role] || 'secondary'}>{role}</Badge>;
  };

  const getStatusBadge = (user: User) => {
    if (user.deleted) return <Badge bg="dark">Eliminado</Badge>;
    if (user.suspended) return <Badge bg="danger">Suspendido</Badge>;
    if (!user.confirmed) return <Badge bg="warning">No confirmado</Badge>;
    return <Badge bg="success">Activo</Badge>;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="mb-4">Gestión de Usuarios</h2>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Barra de selección masiva */}
      {selectedIds.size > 0 && (
        <div className="bulk-actions-bar">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <strong className="me-3">
              {selectedIds.size} usuario{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </strong>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={clearSelection}
              className="me-3"
            >
              Limpiar
            </Button>
            
            <div className="d-flex gap-2 flex-wrap">
              <Button
                variant="danger"
                size="sm"
                onClick={() => prepareBulkRoleChange('admin')}
              >
                <PersonBadge className="me-1" /> Cambiar a Admin
              </Button>
              <Button
                variant="warning"
                size="sm"
                onClick={() => prepareBulkRoleChange('maestro')}
              >
                <Person className="me-1" /> Cambiar a Maestro
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => prepareBulkRoleChange('alumno')}
              >
                <PersonPlus className="me-1" /> Cambiar a Alumno
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <Form.Control
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-3 mb-2">
          <Form.Select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="maestro">Maestros</option>
            <option value="alumno">Alumnos</option>
            <option value="sin-rol">Sin rol</option>
          </Form.Select>
        </div>
        <div className="col-md-5 mb-2">
          <div className="d-flex gap-2 justify-content-end flex-wrap">
            <Button variant="outline-primary" size="sm" onClick={() => selectByFilter('todos')}>
              Todos
            </Button>
            <Button variant="outline-danger" size="sm" onClick={() => selectByFilter('admin')}>
              Admins
            </Button>
            <Button variant="outline-warning" size="sm" onClick={() => selectByFilter('maestro')}>
              Maestros
            </Button>
            <Button variant="outline-success" size="sm" onClick={() => selectByFilter('alumno')}>
              Alumnos
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => selectByFilter('sin-rol')}>
              Sin rol
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla con scroll */}
      <div className="table-responsive-custom">
        <Table striped bordered hover responsive className="bg-white mb-0">
          <thead>
            <tr>
              <th width="40">
                <Form.Check
                  type="checkbox"
                  checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allIds = new Set(filteredUsers.map(u => u.id));
                      setSelectedIds(allIds);
                    } else {
                      clearSelection();
                    }
                  }}
                />
              </th>
              <th>ID</th>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedIds.has(user.id)}
                    onChange={() => toggleUser(user.id)}
                  />
                </td>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.firstname} {user.lastname}</td>
                <td>{user.email}</td>
                <td>{getRoleBadge(user.role_name)}</td>
                <td>{getStatusBadge(user)}</td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => prepareSingleRoleChange(user)}
                  >
                    Cambiar Rol
                  </Button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Modal de confirmación de rol */}
      <Modal show={showModal} onHide={() => !updating && setShowModal(false)}>
        <Modal.Header closeButton={!updating}>
          <Modal.Title>
            {selectedUsers.length > 1 ? 'Cambiar Roles en Lote' : 'Cambiar Rol'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUsers.length > 1 && (
            <>
              <p>Se cambiará el rol de <strong>{selectedUsers.length}</strong> usuario(s):</p>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }} className="mb-3 border p-2">
                <ul className="list-unstyled mb-0">
                  {selectedUsers.map((user, index) => (
                    <li key={user.id} className="mb-1">
                      <small>
                        {index + 1}. {user.username} - Rol actual: {getRoleBadge(user.currentRole)}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          {selectedUsers.length === 1 && (
            <p>
              Usuario: <strong>{selectedUsers[0]?.username}</strong>
              <br />
              Rol actual: {getRoleBadge(selectedUsers[0]?.currentRole)}
            </p>
          )}
          <Form.Group>
            <Form.Label>Nuevo Rol</Form.Label>
            <Form.Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="admin">Administrador</option>
              <option value="maestro">Maestro</option>
              <option value="alumno">Alumno</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={updating}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAssignRole}
            disabled={!selectedRole || updating}
          >
            {updating ? 'Procesando...' : 'Confirmar'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de procesamiento */}
      <Modal 
        show={showConfirmModal} 
        onHide={() => {}} 
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <Modal.Header>
          <Modal.Title>Procesando cambios de rol</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            {updating ? (
              <>
                <div className="mb-3">
                  <LoadingSpinner />
                </div>
                <h5>Procesando: {currentUser}</h5>
                <p className="text-muted">
                  Procesados {processedCount} de {totalToProcess}
                </p>
                <ProgressBar 
                  now={(processedCount / totalToProcess) * 100} 
                  label={`${Math.round((processedCount / totalToProcess) * 100)}%`}
                  animated
                />
              </>
            ) : (
              <>
                <div className="text-success mb-3">
                  <span style={{ fontSize: '3rem' }}>✓</span>
                </div>
                <h5>¡Proceso completado!</h5>
                <p>Se han actualizado {processedCount} usuarios correctamente</p>
              </>
            )}
          </div>
        </Modal.Body>
        {!updating && (
          <Modal.Footer>
            <Button variant="primary" onClick={() => setShowConfirmModal(false)}>
              Cerrar
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </div>
  );
};

export default Users;