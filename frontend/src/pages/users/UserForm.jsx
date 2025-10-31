import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import userService from '../../services/userService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, register } = useAuth(); // Get current user and register function from auth context

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: id ? 'staff' : 'viewer', // Set default role based on whether it's an edit or create operation
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Access control: Only admin can create users
    if (!id && user?.role !== 'admin') {
      toast.error('You are not authorized to create users.');
      navigate('/dashboard'); // Redirect to dashboard or another appropriate page
      return;
    }

    if (id) {
      fetchUser(id);
    } else {
      setLoading(false);
    }
  }, [id, user, navigate]); // Add user and navigate to dependency array

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
    // Remove confirmPassword as it's not part of the DTO
    delete userData.confirmPassword;

    // Remove password field if empty for update, but keep for creation
    if (id && !userData.password) {
      delete userData.password;
    }

    try {
      if (id) {
        // Update existing user
        await userService.update(id, userData); // This should map to PUT /api/user/:id
        toast.success('User updated successfully');
      } else {
        // Create new user using the register function from AuthContext
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

  const handleDelete = async () => {
    const toastId = toast.warn(
      ({ closeToast }) => (
        <div>
          <p>Are you sure you want to delete this user?</p>
          <button className="btn btn-danger me-2" onClick={async () => {
            try {
              await userService.delete(id); // This should map to DELETE /api/user/:id
              toast.dismiss(toastId); // Close the confirmation toast
              toast.success('User deleted successfully');
              navigate('/users');
            } catch (error) {
              toast.dismiss(toastId); // Close the confirmation toast
              toast.error(error.response?.data?.message || 'Failed to delete user');
            }
          }}>
            Yes, Delete
          </button>
          <button className="btn btn-secondary" onClick={() => closeToast()}>Cancel</button>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        position: 'top-center'
      }
    );
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
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-control"
                name="phone"
                value={formData.phone}
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
                placeholder={id ? 'Leave blank to keep current password' : ''}
                required={!id} // Password is required for new users
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
                required={!id} // Confirm password is required for new users
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
    </DashboardLayout>
  );
};

export default UserForm;
