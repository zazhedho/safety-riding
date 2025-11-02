import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import menuService from '../../services/menuService';
import { toast } from 'react-toastify';

// Common Bootstrap Icons for menus
const COMMON_ICONS = [
  { value: 'bi-speedometer2', label: 'Dashboard' },
  { value: 'bi-person-circle', label: 'Profile' },
  { value: 'bi-people', label: 'Users' },
  { value: 'bi-shield-lock', label: 'Roles' },
  { value: 'bi-building', label: 'Schools' },
  { value: 'bi-calendar-event', label: 'Events' },
  { value: 'bi-exclamation-triangle', label: 'Accidents' },
  { value: 'bi-cash-stack', label: 'Budgets' },
  { value: 'bi-bar-chart', label: 'Statistics' },
  { value: 'bi-graph-up', label: 'Analytics' },
  { value: 'bi-file-text', label: 'Reports' },
  { value: 'bi-gear', label: 'Settings' },
  { value: 'bi-list-ul', label: 'List' },
  { value: 'bi-grid', label: 'Grid' },
  { value: 'bi-card-list', label: 'Cards' },
  { value: 'bi-folder', label: 'Folder' },
  { value: 'bi-inbox', label: 'Inbox' },
  { value: 'bi-bell', label: 'Notifications' },
  { value: 'bi-envelope', label: 'Messages' },
  { value: 'bi-bookmark', label: 'Bookmarks' },
  { value: 'bi-heart', label: 'Favorites' },
  { value: 'bi-star', label: 'Featured' },
  { value: 'bi-house', label: 'Home' },
  { value: 'bi-compass', label: 'Navigation' },
  { value: 'bi-map', label: 'Map' },
  { value: 'bi-globe', label: 'Global' },
  { value: 'bi-box', label: 'Package' },
  { value: 'bi-truck', label: 'Delivery' },
  { value: 'bi-cart', label: 'Cart' },
  { value: 'bi-wallet', label: 'Wallet' },
  { value: 'bi-clipboard', label: 'Clipboard' },
  { value: 'bi-calculator', label: 'Calculator' },
  { value: 'bi-phone', label: 'Phone' },
  { value: 'bi-camera', label: 'Camera' },
  { value: 'bi-image', label: 'Images' },
  { value: 'bi-upload', label: 'Upload' },
  { value: 'bi-download', label: 'Download' },
  { value: 'bi-cloud', label: 'Cloud' },
  { value: 'bi-lock', label: 'Security' },
  { value: 'bi-key', label: 'Access' },
];

const MenuForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    path: '',
    icon: '',
    parent_id: null,
    order_index: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [allMenus, setAllMenus] = useState([]);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    fetchAllMenus();
    if (id) {
      fetchMenu(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchMenu = async (menuId) => {
    try {
      const response = await menuService.getById(menuId);
      const menuData = response.data.data;
      setFormData({
        name: menuData.name,
        display_name: menuData.display_name,
        path: menuData.path,
        icon: menuData.icon || '',
        parent_id: menuData.parent_id || null,
        order_index: menuData.order_index || 0,
        is_active: menuData.is_active !== undefined ? menuData.is_active : true,
      });
    } catch (error) {
      toast.error('Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMenus = async () => {
    try {
      const response = await menuService.getAll({ limit: 1000 });
      setAllMenus(response.data.data || []);
    } catch (error) {
      console.error('Failed to load menus for parent selection');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleIconSelect = (iconValue) => {
    setFormData(prev => ({ ...prev, icon: iconValue }));
    setShowIconPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
      ...formData,
      order_index: parseInt(formData.order_index) || 0,
      parent_id: formData.parent_id || null,
    };

    try {
      if (id) {
        await menuService.update(id, dataToSend);
        toast.success('Menu updated successfully');
      } else {
        await menuService.create(dataToSend);
        toast.success('Menu created successfully');
      }
      navigate('/menus');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save menu');
    }
  };

  if (loading) {
    return <DashboardLayout>Loading...</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <h2>{id ? 'Edit Menu' : 'Add Menu'}</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Name (Identifier) *</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., reports"
                  required
                  disabled={id !== undefined}
                />
                <small className="text-muted">Lowercase, no spaces. Used internally (cannot be changed after creation).</small>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Display Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder="e.g., Reports"
                  required
                />
                <small className="text-muted">Name shown in the sidebar.</small>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Path *</label>
                <input
                  type="text"
                  className="form-control"
                  name="path"
                  value={formData.path}
                  onChange={handleChange}
                  placeholder="e.g., /reports"
                  required
                />
                <small className="text-muted">Route path in the application.</small>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Icon</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    placeholder="e.g., bi-file-text"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                  >
                    <i className="bi bi-palette"></i> Pick
                  </button>
                  {formData.icon && (
                    <span className="input-group-text">
                      <i className={`bi ${formData.icon}`} style={{ fontSize: '1.2rem' }}></i>
                    </span>
                  )}
                </div>
                <small className="text-muted">Bootstrap icon class.</small>
              </div>
            </div>

            {/* Icon Picker */}
            {showIconPicker && (
              <div className="mb-3">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <span>Select Icon</span>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowIconPicker(false)}
                    ></button>
                  </div>
                  <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <div className="row g-2">
                      {COMMON_ICONS.map(icon => (
                        <div key={icon.value} className="col-6 col-sm-4 col-md-3 col-lg-2">
                          <button
                            type="button"
                            className={`btn w-100 ${formData.icon === icon.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => handleIconSelect(icon.value)}
                            title={icon.label}
                          >
                            <i className={`bi ${icon.value}`} style={{ fontSize: '1.5rem' }}></i>
                            <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>{icon.label}</div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Parent Menu</label>
                <select
                  className="form-select"
                  name="parent_id"
                  value={formData.parent_id || ''}
                  onChange={handleChange}
                >
                  <option value="">None (Top Level)</option>
                  {allMenus
                    .filter(m => m.id !== id)
                    .map(menu => (
                      <option key={menu.id} value={menu.id}>
                        {menu.display_name}
                      </option>
                    ))}
                </select>
                <small className="text-muted">Optional. For sub-menus.</small>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Order Index *</label>
                <input
                  type="number"
                  className="form-control"
                  name="order_index"
                  value={formData.order_index}
                  onChange={handleChange}
                  min="0"
                  required
                />
                <small className="text-muted">Lower number appears first.</small>
              </div>
              <div className="col-md-4 mb-3 d-flex align-items-center pt-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="is_active">
                    Active
                  </label>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mb-4">
              <h6>Preview:</h6>
              <div className="card bg-light">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    {formData.icon && (
                      <i className={`bi ${formData.icon} me-3`} style={{ fontSize: '1.5rem', color: '#6a9ae0' }}></i>
                    )}
                    <div>
                      <strong>{formData.display_name || 'Menu Name'}</strong>
                      <div className="text-muted small">{formData.path || '/path'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              {id ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              className="btn btn-secondary ms-2"
              onClick={() => navigate('/menus')}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MenuForm;
