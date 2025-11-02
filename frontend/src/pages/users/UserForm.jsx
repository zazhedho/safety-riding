import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import userService from '../../services/userService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, register } = useAuth();

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

  useEffect(() => {
    if (!id && user?.role !== 'admin') {
      toast.error('You are not authorized to create users.');
      navigate('/dashboard');
      return;
    }

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
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
                {id ? (
                  <>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </>
                ) : (
                  <option value="viewer">Viewer</option>
                )}
              </select>
            </div>
            <hr />
            <h5>{id ? 'Change Password (Optional)' : 'Password'}</h5>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={id ? 'Leave blank to keep current password' : 'Enter a strong password'}
                required={!id}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={id ? 'Confirm new password' : 'Confirm your password'}
                required={!id}
              />
            </div>
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/users')}>Cancel</button>
            {id && user?.role === 'admin' && (
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
