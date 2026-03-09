import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Badge, Alert, ProgressBar, Card, Row, Col, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { adminService } from '../../services/adminService';
import { User } from '../../interfaces';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  Search, 
  Filter,
  X,
  ArrowRepeat,
  Shield,
  People,
  Gear,
  ExclamationTriangle,
  Check2Square,
  PersonBadge,
  PersonVcard,
  Person,
  InfoCircle,
  Hash,
  Envelope,
  SortUp,
  SortDown,
  CheckCircle,
  Trash,
  QuestionCircle,
  ChevronDown,
  ChevronUp
} from 'react-bootstrap-icons';
import { useAuth } from '../../contexts/AuthContext';

interface SelectedUser {
  id: number;
  username: string;
  currentRoles: string[];
}

interface PendingChange {
  userId: number;
  role: string;
  action: 'add' | 'remove';
}

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'id', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [currentProcessingUser, setCurrentProcessingUser] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const availableRoles = [
    { value: 'admin', label: 'Administrador', icon: <Shield className="me-1" size={14} />, bg: 'danger' },
    { value: 'maestro', label: 'Maestro', icon: <PersonVcard className="me-1" size={14} />, bg: 'warning' },
    { value: 'alumno', label: 'Alumno', icon: <PersonBadge className="me-1" size={14} />, bg: 'success' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id?.toString().includes(searchTerm)
      );
    }

    if (filterRole !== 'todos') {
      if (filterRole === 'sin-rol') {
        filtered = filtered.filter(u => !u.roles || u.roles.length === 0);
      } else {
        filtered = filtered.filter(u => u.roles?.includes(filterRole));
      }
    }

    if (statusFilter !== 'todos') {
      switch(statusFilter) {
        case 'activo':
          filtered = filtered.filter(u => !u.suspended && u.confirmed);
          break;
        case 'suspendido':
          filtered = filtered.filter(u => u.suspended);
          break;
        case 'no-confirmado':
          filtered = filtered.filter(u => !u.confirmed);
          break;
        case 'eliminado':
          filtered = filtered.filter(u => u.deleted);
          break;
      }
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof User];
      let bValue: any = b[sortConfig.key as keyof User];
      
      if (sortConfig.key === 'nombre') {
        aValue = `${a.firstname} ${a.lastname}`;
        bValue = `${b.firstname} ${b.lastname}`;
      }
      
      if (sortConfig.key === 'roles') {
        aValue = a.roles?.length || 0;
        bValue = b.roles?.length || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
    setSelectAll(selectedIds.size === filtered.length && filtered.length > 0);
  }, [users, searchTerm, filterRole, statusFilter, selectedIds.size, filteredUsers.length, sortConfig]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      
      const processedData = data.map(user => {
        if (user.roles && Array.isArray(user.roles)) {
          return user;
        }
        if (user.role_name) {
          return {
            ...user,
            roles: [user.role_name]
          };
        }
        return {
          ...user,
          roles: []
        };
      });

      setUsers(processedData);
      setFilteredUsers(processedData);
      setError('');
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const handleRoleChange = (userId: number, role: string, checked: boolean, currentRoles: string[]) => {
    const action = checked ? 'add' : 'remove';
    
    if (action === 'remove' && role === 'admin' && currentUser?.id === userId) {
      setError('No puedes quitarte el rol de administrador a ti mismo');
      return;
    }

    setPendingChange({
      userId,
      role,
      action
    });
    setShowConfirmModal(true);
  };

  const executeRoleChange = async () => {
    if (!pendingChange) return;

    setShowConfirmModal(false);
    setShowLoadingModal(true);
    setProcessingMessage(pendingChange.action === 'add' ? 'Agregando rol...' : 'Eliminando rol...');
    setProcessedCount(0);
    setTotalToProcess(1);

    const user = users.find(u => u.id === pendingChange.userId);
    setCurrentProcessingUser(user?.username || 'Usuario');

    try {
      if (pendingChange.action === 'add') {
        await adminService.assignMultipleRoles(pendingChange.userId, [pendingChange.role]);
      } else {
        await adminService.removeRoles(pendingChange.userId, [pendingChange.role]);
      }
      setProcessedCount(1);
      await fetchUsers();
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      setError('Error al actualizar el rol');
    }

    setTimeout(() => {
      setShowLoadingModal(false);
      setProcessingMessage('');
      setCurrentProcessingUser('');
      setProcessedCount(0);
      setPendingChange(null);
    }, 500);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = availableRoles.find(r => r.value === role);
    if (!roleConfig) return null;
    
    return (
      <Badge 
        bg={roleConfig.bg} 
        className="px-2 py-1 d-inline-flex align-items-center me-1 mb-1"
        style={{ fontSize: '0.75rem' }}
      >
        {roleConfig.icon}
        {roleConfig.label}
      </Badge>
    );
  };

  const getUserRoles = (user: User) => {
    const roles = user.roles || [];
    
    if (roles.length === 0) {
      return <Badge bg="secondary" className="px-2 py-1">Sin rol</Badge>;
    }

    return (
      <div className="d-flex flex-wrap gap-1">
        {roles.map(role => getRoleBadge(role))}
      </div>
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
      admin: users.filter(u => u.roles?.includes('admin')).length,
      maestro: users.filter(u => u.roles?.includes('maestro')).length,
      alumno: users.filter(u => u.roles?.includes('alumno')).length,
      sinRol: users.filter(u => !u.roles || u.roles.length === 0).length
    };
    return counts;
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <SortUp className="ms-1" size={14} /> : <SortDown className="ms-1" size={14} />;
  };

  if (loading) return <LoadingSpinner />;

  const counts = getRoleCounts();

  return (
    <div className="container-fluid px-0 py-3 min-vh-100 d-flex flex-column">
      {/* Header con título */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="mb-1 d-flex align-items-center">
            <People className="me-2 text-primary" size={32} />
            Gestión de Usuarios
          </h2>
          <div className="d-flex align-items-center text-muted small flex-wrap gap-2">
            <InfoCircle className="me-1" size={14} />
            <span>Total: <strong>{counts.total}</strong> usuarios</span>
            <span className="badge bg-light text-dark d-inline-flex align-items-center">
              <Shield className="text-danger me-1" size={12} /> {counts.admin}
            </span>
            <span className="badge bg-light text-dark d-inline-flex align-items-center">
              <PersonVcard className="text-warning me-1" size={12} /> {counts.maestro}
            </span>
            <span className="badge bg-light text-dark d-inline-flex align-items-center">
              <PersonBadge className="text-success me-1" size={12} /> {counts.alumno}
            </span>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button variant="primary" size="sm" onClick={fetchUsers} className="d-flex align-items-center">
            <ArrowRepeat className="me-2" /> Actualizar
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-4">{error}</Alert>}

      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 p-3 rounded-circle me-3">
                  <Shield className="text-danger" size={24} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">{counts.admin}</h6>
                  <small className="text-muted">Administradores</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                  <PersonVcard className="text-warning" size={24} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">{counts.maestro}</h6>
                  <small className="text-muted">Maestros</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                  <PersonBadge className="text-success" size={24} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">{counts.alumno}</h6>
                  <small className="text-muted">Alumnos</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="bg-secondary bg-opacity-10 p-3 rounded-circle me-3">
                  <ExclamationTriangle className="text-secondary" size={24} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">{counts.sinRol}</h6>
                  <small className="text-muted">Sin rol</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Barra de selección masiva */}
      {selectedIds.size > 0 && (
        <Card className="mb-4 border-primary border-2">
          <Card.Body className="p-3">
            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                  <Check2Square className="text-primary" size={20} />
                </div>
                <div>
                  <h6 className="mb-0">{selectedIds.size} usuario{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}</h6>
                  <small className="text-muted">Acciones masivas disponibles</small>
                </div>
              </div>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" onClick={clearSelection} className="d-flex align-items-center">
                  <X className="me-2" /> Limpiar
                </Button>
                <Button variant="outline-danger" size="sm" className="d-flex align-items-center">
                  <Trash className="me-2" /> Quitar roles
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Filtros - Versión desktop */}
      <Card className="mb-4 d-none d-md-block">
        <Card.Header className="bg-light py-3 d-flex justify-content-between align-items-center">
          <span className="fw-bold d-flex align-items-center">
            <Filter className="me-2" size={16} />
            Filtros de búsqueda
          </span>
          <Button 
            variant="link" 
            onClick={() => setShowFilters(!showFilters)}
            className="text-decoration-none p-0"
          >
            {showFilters ? 'Ocultar' : 'Mostrar'}
          </Button>
        </Card.Header>
        {showFilters && (
          <Card.Body className="p-3">
            <Row className="g-3">
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Buscar</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <Search size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Nombre, email, ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                        <X size={14} />
                      </Button>
                    )}
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Rol</Form.Label>
                  <Form.Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="todos">Todos los roles</option>
                    <option value="admin">Administradores ({counts.admin})</option>
                    <option value="maestro">Maestros ({counts.maestro})</option>
                    <option value="alumno">Alumnos ({counts.alumno})</option>
                    <option value="sin-rol">Sin rol ({counts.sinRol})</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Estado</Form.Label>
                  <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="todos">Todos</option>
                    <option value="activo">Activos</option>
                    <option value="suspendido">Suspendidos</option>
                    <option value="no-confirmado">No confirmados</option>
                    <option value="eliminado">Eliminados</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="small fw-bold">&nbsp;</Form.Label>
                  <Button 
                    variant="outline-primary" 
                    onClick={handleSelectAll}
                    className="w-100 d-flex align-items-center justify-content-center"
                  >
                    <Check2Square className="me-2" size={14} />
                    {selectAll ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  </Button>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        )}
      </Card>

      {/* Filtros - Versión móvil */}
      <div className="d-block d-md-none mb-4">
        <Button 
          variant="outline-primary" 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-100 d-flex align-items-center justify-content-between mb-2"
        >
          <span className="d-flex align-items-center">
            <Filter className="me-2" size={16} />
            Filtros de búsqueda
          </span>
          {showMobileFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
        
        {showMobileFilters && (
          <Card>
            <Card.Body className="p-3">
              <div className="d-flex flex-column gap-3">
                <InputGroup>
                  <InputGroup.Text>
                    <Search size={14} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                
                <Form.Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                  <option value="todos">Todos los roles</option>
                  <option value="admin">Administradores</option>
                  <option value="maestro">Maestros</option>
                  <option value="alumno">Alumnos</option>
                  <option value="sin-rol">Sin rol</option>
                </Form.Select>
                
                <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="todos">Todos los estados</option>
                  <option value="activo">Activos</option>
                  <option value="suspendido">Suspendidos</option>
                  <option value="no-confirmado">No confirmados</option>
                </Form.Select>
                
                <Button 
                  variant="outline-primary" 
                  onClick={handleSelectAll}
                  className="w-100"
                >
                  {selectAll ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Tabla de usuarios con scroll */}
      <Card className="flex-grow-1 shadow-sm d-flex flex-column">
        <Card.Header className="bg-light py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <People className="me-2 text-primary" size={16} />
            <span className="fw-bold">Lista de Usuarios</span>
            <Badge bg="light" text="dark" className="ms-2">
              {filteredUsers.length} de {users.length}
            </Badge>
          </div>
          {selectedIds.size > 0 && (
            <Badge bg="primary" className="d-flex align-items-center">
              <Check2Square className="me-1" size={12} />
              {selectedIds.size} selec.
            </Badge>
          )}
        </Card.Header>
        
        <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
          <Table hover className="mb-0 align-middle">
            <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th width="40" className="text-center">
                  <Form.Check 
                    type="checkbox" 
                    checked={selectAll} 
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="cursor-pointer" onClick={() => handleSort('id')}>
                  <div className="d-flex align-items-center">
                    <Hash size={14} className="me-1" />
                    ID {getSortIcon('id')}
                  </div>
                </th>
                <th className="cursor-pointer" onClick={() => handleSort('username')}>
                  Usuario {getSortIcon('username')}
                </th>
                <th className="cursor-pointer d-none d-md-table-cell" onClick={() => handleSort('nombre')}>
                  Nombre {getSortIcon('nombre')}
                </th>
                <th className="d-none d-lg-table-cell">Email</th>
                <th style={{ minWidth: '250px' }}>Roles</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className={selectedIds.has(user.id) ? 'table-primary' : ''}
                >
                  <td className="text-center">
                    <Form.Check
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleUser(user.id)}
                    />
                  </td>
                  <td>
                    <Badge bg="light" text="dark" className="px-2 py-1">
                      #{user.id}
                    </Badge>
                  </td>
                  <td>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>@{user.username}</Tooltip>}
                    >
                      <span className="fw-semibold">@{user.username}</span>
                    </OverlayTrigger>
                  </td>
                  <td className="d-none d-md-table-cell">
                    <div className="d-flex align-items-center">
                      <div className="bg-light rounded-circle p-1 me-2">
                        <Person size={14} className="text-primary" />
                      </div>
                      <span className="text-truncate" style={{ maxWidth: '150px' }}>
                        {user.firstname} {user.lastname}
                      </span>
                    </div>
                  </td>
                  <td className="d-none d-lg-table-cell">
                    <small className="text-muted d-flex align-items-center">
                      <Envelope className="me-1" size={12} />
                      <span className="text-truncate" style={{ maxWidth: '180px' }}>
                        {user.email}
                      </span>
                    </small>
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex flex-wrap">
                        {getUserRoles(user)}
                      </div>
                      <div className="d-flex gap-2">
                        {availableRoles.map(role => {
                          const isChecked = user.roles?.includes(role.value) || false;
                          const isSelfAdmin = role.value === 'admin' && currentUser?.id === user.id;
                          
                          return (
                            <Form.Check
                              key={role.value}
                              type="checkbox"
                              id={`role-${user.id}-${role.value}`}
                              label={role.icon}
                              checked={isChecked}
                              onChange={(e) => handleRoleChange(user.id, role.value, e.target.checked, user.roles || [])}
                              disabled={isSelfAdmin}
                              inline
                              title={isSelfAdmin ? "No puedes modificar tu propio rol de admin" : ""}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </td>
                  <td>{getStatusBadge(user)}</td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <People size={48} className="text-muted mb-3" />
                    <h6 className="text-muted">No se encontraron usuarios</h6>
                    <p className="text-muted small mb-0">Intenta con otros filtros</p>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
        
        <Card.Footer className="bg-white py-3 mt-auto">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
            <small className="text-muted">
              Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuarios
            </small>
            <div className="d-flex gap-2">
              <Badge bg="light" text="dark" className="px-3 py-2 d-flex align-items-center">
                <People className="me-1" size={12} /> {users.length}
              </Badge>
              <Badge bg="light" text="dark" className="px-3 py-2 d-flex align-items-center">
                <Check2Square className="me-1" size={12} /> {selectedIds.size}
              </Badge>
            </div>
          </div>
        </Card.Footer>
      </Card>

      {/* Modal de confirmación */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <QuestionCircle className="me-2 text-warning" size={24} />
            Confirmar cambio
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pendingChange && (
            <>
              <p className="text-center mb-3">
                {pendingChange.action === 'add' ? (
                  <>¿Agregar el rol <strong className="text-success">de</strong></>
                ) : (
                  <>¿Quitar el rol <strong className="text-danger">de</strong></>
                )}
              </p>
              <div className="text-center mb-3">
                {availableRoles.find(r => r.value === pendingChange.role) && (
                  <Badge 
                    bg={availableRoles.find(r => r.value === pendingChange.role)?.bg}
                    className="px-4 py-2"
                    style={{ fontSize: '1.1rem' }}
                  >
                    {availableRoles.find(r => r.value === pendingChange.role)?.icon}
                    {availableRoles.find(r => r.value === pendingChange.role)?.label}
                  </Badge>
                )}
              </div>
              <p className="text-center mb-0">
                al usuario <strong>{users.find(u => u.id === pendingChange.userId)?.username}</strong>?
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant={pendingChange?.action === 'add' ? 'success' : 'danger'}
            onClick={executeRoleChange}
            className="d-flex align-items-center"
          >
            {pendingChange?.action === 'add' ? (
              <>
                <CheckCircle className="me-2" /> Confirmar
              </>
            ) : (
              <>
                <Trash className="me-2" /> Confirmar
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de carga */}
      <Modal show={showLoadingModal} backdrop="static" keyboard={false} centered>
        <Modal.Body className="text-center py-4">
          <div className="mb-4">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
          <h6 className="mb-2">{processingMessage}</h6>
          <p className="text-muted small mb-3">{currentProcessingUser}</p>
          {totalToProcess > 0 && (
            <>
              <ProgressBar 
                now={(processedCount / totalToProcess) * 100} 
                label={`${processedCount}/${totalToProcess}`}
                className="mb-2"
                striped
                animated
              />
              <small className="text-muted">
                {Math.round((processedCount / totalToProcess) * 100)}% completado
              </small>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Users;