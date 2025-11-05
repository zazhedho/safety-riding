import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import userService from '../../services/userService';
import roleService from '../../services/roleService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import 'bootstrap-icons/font/bootstrap-icons.css';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, register, hasPermission } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: id ? 'staff' : 'viewer',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSymbol: false
  });

  useEffect(() => {
    if (!id && user?.role !== 'admin') {
      toast.error('You are not authorized to create users.');
      navigate('/dashboard');
      return;
    }

    fetchRoles();

    if (id) {
      fetchUser(id);
    } else {
      setLoading(false);
    }
  }, [id, user, navigate]);

  const fetchUser = async (userId) => {
    try {
      const response = await userService.getById(userId);
      const { name, email, phone, role } = response.data.data;
      setFormData({ name, email, phone, role, password: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleService.getAll({ limit: 1000 });
      setRoles(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch roles');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate password when it changes
    if (name === 'password') {
      setPasswordValidation({
        minLength: value.length >= 8,
        hasLowercase: /[a-z]/.test(value),
        hasUppercase: /[A-Z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSymbol: /[^a-zA-Z0-9]/.test(value)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password requirements for new users or when changing password
    if (formData.password && (!id || formData.password)) {
      const allRequirementsMet = Object.values(passwordValidation).every(val => val === true);
      if (!allRequirementsMet) {
        toast.error('Password does not meet all requirements');
        return;
      }
    }

    const userData = { ...formData };
    delete userData.confirmPassword;

    if (id && !userData.password) {
      delete userData.password;
    }

    try {
      if (id) {
        await userService.update(id, userData);
        toast.success('User updated successfully');
      } else {
        const result = await register(userData);
        if (result.success) {
          toast.success('User created successfully!');
        } else {
          toast.error(result.error || 'Failed to create user');
        }
      }
      navigate('/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    setShowDeleteModal(false);
    try {
      await userService.delete(id);
      toast.success('User deleted successfully');
      navigate('/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return <DashboardLayout>Loading...</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <h2>{id ? 'Edit User' : 'Create User'}</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., John Doe"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g., john.doe@example.com"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-control"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., 081234567890"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                {roles.map(role => (
                  <option key={role.id} value={role.name}>
                    {role.display_name}
                  </option>
                ))}
              </select>
            </div>
            <hr />
            <h5>{id ? 'Change Password (Optional)' : 'Password'}</h5>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={id ? 'Leave blank to keep current password' : 'Enter a strong password'}
                  style={{ paddingRight: '2.5rem' }}
                  required={!id}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ textDecoration: 'none', color: '#6c757d' }}
                  tabIndex={-1}
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 p-3 bg-light rounded">
                  <small className="d-block fw-bold mb-2 text-secondary">Password Requirements:</small>
                  <div className="d-flex flex-column gap-1">
                    <small className={passwordValidation.minLength ? 'text-success' : 'text-danger'}>
                      <i className={`bi bi-${passwordValidation.minLength ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      Minimum 8 characters
                    </small>
                    <small className={passwordValidation.hasLowercase ? 'text-success' : 'text-danger'}>
                      <i className={`bi bi-${passwordValidation.hasLowercase ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      At least 1 lowercase letter (a-z)
                    </small>
                    <small className={passwordValidation.hasUppercase ? 'text-success' : 'text-danger'}>
                      <i className={`bi bi-${passwordValidation.hasUppercase ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      At least 1 uppercase letter (A-Z)
                    </small>
                    <small className={passwordValidation.hasNumber ? 'text-success' : 'text-danger'}>
                      <i className={`bi bi-${passwordValidation.hasNumber ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      At least 1 number (0-9)
                    </small>
                    <small className={passwordValidation.hasSymbol ? 'text-success' : 'text-danger'}>
                      <i className={`bi bi-${passwordValidation.hasSymbol ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      At least 1 symbol (!@#$%^&*...)
                    </small>
                  </div>
                </div>
              )}
              {!formData.password && !id && (
                <small className="text-muted d-block mt-1">
                  <i className="bi bi-info-circle me-1"></i>
                  Password must contain: minimum 8 characters, 1 lowercase, 1 uppercase, 1 number, and 1 symbol
                </small>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <div className="position-relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={id ? 'Confirm new password' : 'Confirm your password'}
                  style={{ paddingRight: '2.5rem' }}
                  required={!id}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ textDecoration: 'none', color: '#6c757d' }}
                  tabIndex={-1}
                >
                  <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <small className="text-danger d-block mt-1">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  Passwords do not match
                </small>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <small className="text-success d-block mt-1">
                  <i className="bi bi-check-circle me-1"></i>
                  Passwords match
                </small>
              )}
            </div>
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/users')}>Cancel</button>
            {id && hasPermission('delete_users') && (
              <button type="button" className="btn btn-danger ms-2" onClick={handleDelete}>
                Delete User
              </button>
            )}
          </form>
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        title="Confirm User Deletion"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete User"
        onConfirm={confirmDeleteUser}
        onCancel={cancelDeleteUser}
      />
    </DashboardLayout>
  );
};

export default UserForm;
