import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import roleService from '../../services/roleService';
import permissionService from '../../services/permissionService';
import { toast } from 'react-toastify';

const RoleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
  });
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSystem, setIsSystem] = useState(false);
  const [derivedMenus, setDerivedMenus] = useState([]);

  useEffect(() => {
    fetchPermissions();
    if (id) {
      fetchRole(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchRole = async (roleId) => {
    try {
      const response = await roleService.getById(roleId);
      const roleData = response.data.data;
      setFormData({
        name: roleData.name,
        display_name: roleData.display_name,
        description: roleData.description || '',
      });
      setSelectedPermissions(roleData.permission_ids || []);
      setDerivedMenus(roleData.menu_ids || []);
      setIsSystem(roleData.is_system || false);
    } catch (error) {
      toast.error('Failed to fetch role');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await permissionService.getAll({ limit: 1000 });
      setPermissions(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load permissions');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate name field: lowercase, no spaces
    if (name === 'name') {
      const sanitizedValue = value.toLowerCase().replace(/\s/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: sanitizedValue,
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAllPermissions = () => {
    if (selectedPermissions.length === permissions.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(permissions.map(p => p.id));
    }
  };

  useEffect(() => {
    if (!permissions.length) {
      setDerivedMenus([]);
      return;
    }

    const menuConfig = [
      { id: 'dashboard', label: 'Dashboard', resources: ['dashboard'] },
      { id: 'schools', label: 'Schools', resources: ['schools'] },
      { id: 'education', label: 'Education', resources: ['education_stats', 'education_priority'] },
      { id: 'education_stats', label: 'Education Stats', resources: ['education_stats'] },
      { id: 'education_priority', label: 'Education Priority', resources: ['education_priority'] },
      { id: 'publics', label: 'Public Entities', resources: ['publics'] },
      { id: 'events', label: 'Events', resources: ['events'] },
      { id: 'accidents', label: 'Accidents', resources: ['accidents', 'polda_accidents'] },
      { id: 'budgets', label: 'Budgets', resources: ['budgets'] },
      { id: 'marketshare', label: 'Market Share', resources: ['market_shares'] },
      { id: 'approval_records', label: 'Submitted Forms', resources: ['approval_records'] },
      { id: 'users', label: 'Users', resources: ['users'] },
      { id: 'roles', label: 'Roles', resources: ['roles'] },
      { id: 'menus', label: 'Menus', resources: ['menus'] },
      { id: 'configs', label: 'Configurations', resources: ['configs'] },
      { id: 'polda_accidents', label: 'POLDA Accidents', resources: ['polda_accidents'] },
    ];

    const selectedPermissionSet = new Set(selectedPermissions);
    const allowedResources = new Set(
      permissions
        .filter(permission => selectedPermissionSet.has(permission.id))
        .map(permission => permission.resource)
    );

    const nextMenus = menuConfig.filter(menu =>
      menu.resources.some(resource => allowedResources.has(resource))
    );

    setDerivedMenus(nextMenus);
  }, [permissions, selectedPermissions]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (id) {
        // For system roles, only update permissions and menus (skip role update)
        if (!isSystem) {
          // Update role (only for non-system roles)
          await roleService.update(id, {
            display_name: formData.display_name,
            description: formData.description,
          });
        }
        // Update permissions
        await roleService.assignPermissions(id, { permission_ids: selectedPermissions });
        toast.success('Role updated successfully');
      } else {
        // Create role
        const response = await roleService.create(formData);
        const newRoleId = response.data.data.id;
        // Assign permissions
        await roleService.assignPermissions(newRoleId, { permission_ids: selectedPermissions });
        toast.success('Role created successfully');
      }
      navigate('/roles');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save role');
    }
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {});

  if (loading) {
    return <>Loading...</>;
  }

  return (
    <>
      <h2>{id ? 'Edit Role' : 'Add Role'}</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <h5 className="mb-3">Basic Information</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Name (Identifier)</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., manager"
                  required
                  disabled={id !== undefined || isSystem}
                />
                <small className="text-muted">Lowercase, no spaces. Used internally.</small>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder="e.g., Manager"
                  required
                  disabled={isSystem}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the role's purpose and responsibilities"
                rows="3"
              />
            </div>

            {/* Permissions */}
            <h5 className="mb-3">
              Permissions
              <button
                type="button"
                className="btn btn-sm btn-outline-primary ms-3"
                onClick={handleSelectAllPermissions}
              >
                {selectedPermissions.length === permissions.length ? 'Deselect All' : 'Select All'}
              </button>
            </h5>
            <div className="mb-4">
              {Object.keys(groupedPermissions).map(resource => (
                <div key={resource} className="mb-3">
                  <h6 className="text-capitalize">{resource.replace(/_/g, ' ')}</h6>
                  <div className="row">
                    {groupedPermissions[resource].map(perm => (
                      <div key={perm.id} className="col-md-4 col-lg-3 mb-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`perm-${perm.id}`}
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => handlePermissionToggle(perm.id)}
                          />
                          <label className="form-check-label" htmlFor={`perm-${perm.id}`}>
                            <small>{perm.display_name}</small>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Menus */}
            <h5 className="mb-3">Visible Menus</h5>
            <div className="mb-4">
              <p className="text-muted mb-3">
                Menus are derived automatically from the selected permissions. There is no separate menu assignment.
              </p>
              <div className="row">
                {derivedMenus.length > 0 ? (
                  derivedMenus.map(menu => (
                    <div key={menu.id} className="col-md-4 col-lg-3 mb-2">
                      <div className="border rounded px-3 py-2 bg-body-tertiary">
                        <small className="fw-semibold">{menu.label}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12">
                    <div className="alert alert-light border mb-0">
                      No menus will be shown until at least one module permission is selected.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              {id ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              className="btn btn-secondary ms-2"
              onClick={() => navigate('/roles')}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default RoleForm;
