import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import roleService from '../../services/roleService';
import permissionService from '../../services/permissionService';
import menuService from '../../services/menuService';
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
  const [menus, setMenus] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSystem, setIsSystem] = useState(false);

  useEffect(() => {
    fetchPermissions();
    fetchMenus();
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
      setSelectedMenus(roleData.menu_ids || []);
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

  const fetchMenus = async () => {
    try {
      const response = await menuService.getAll({ limit: 1000 });
      setMenus(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load menus');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  const handleMenuToggle = (menuId) => {
    setSelectedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleSelectAllPermissions = () => {
    if (selectedPermissions.length === permissions.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(permissions.map(p => p.id));
    }
  };

  const handleSelectAllMenus = () => {
    if (selectedMenus.length === menus.length) {
      setSelectedMenus([]);
    } else {
      setSelectedMenus(menus.map(m => m.id));
    }
  };

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
        // Update menus
        await roleService.assignMenus(id, { menu_ids: selectedMenus });
        toast.success('Role updated successfully');
      } else {
        // Create role
        const response = await roleService.create(formData);
        const newRoleId = response.data.data.id;
        // Assign permissions
        await roleService.assignPermissions(newRoleId, { permission_ids: selectedPermissions });
        // Assign menus
        await roleService.assignMenus(newRoleId, { menu_ids: selectedMenus });
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
            <h5 className="mb-3">
              Menu Access
              <button
                type="button"
                className="btn btn-sm btn-outline-primary ms-3"
                onClick={handleSelectAllMenus}
              >
                {selectedMenus.length === menus.length ? 'Deselect All' : 'Select All'}
              </button>
            </h5>
            <div className="mb-4">
              <div className="row">
                {menus.map(menu => (
                  <div key={menu.id} className="col-md-4 col-lg-3 mb-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`menu-${menu.id}`}
                        checked={selectedMenus.includes(menu.id)}
                        onChange={() => handleMenuToggle(menu.id)}
                      />
                      <label className="form-check-label" htmlFor={`menu-${menu.id}`}>
                        <i className={`bi ${menu.icon} me-2`}></i>
                        {menu.display_name}
                      </label>
                    </div>
                  </div>
                ))}
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
