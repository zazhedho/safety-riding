import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import userService from '../../services/userService';
import { toast } from 'react-toastify';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUser(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchUser = async (userId) => {
    try {
      const response = await userService.getById(userId);
      const { name, email, role } = response.data.data;
      setFormData({ name, email, role, password: '', confirmPassword: '' });
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
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const userData = { ...formData };
    if (!userData.password) {
      delete userData.password;
    }

    try {
      if (id) {
        await userService.update(id, userData);
        toast.success('User updated successfully');
      } else {
        await userService.create(userData);
        toast.success('User created successfully');
      }
      navigate('/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
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
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <hr />
            <h5>Change Password</h5>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={id ? 'Leave blank to keep current password' : ''}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/users')}>Cancel</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserForm;
