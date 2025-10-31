import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name, email: user.email, phone: user.phone || '' });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile(profileData);
    if (result.success) {
      toast.success('Profile updated successfully');
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    const result = await updatePassword(passwordData);
    if (result.success) {
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(result.error || 'Failed to update password');
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'bg-danger',
      staff: 'bg-primary',
      viewer: 'bg-secondary'
    };
    return <span className={`badge ${variants[role] || 'bg-secondary'}`}>{role?.toUpperCase()}</span>;
  };

  return (
    <DashboardLayout>
      <h2>My Profile</h2>
      
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Current Information</h5>
          <table className="table table-borderless">
            <tbody>
              <tr>
                <td style={{ width: '150px' }}><strong>Name</strong></td>
                <td>: {user?.name}</td>
              </tr>
              <tr>
                <td><strong>Email</strong></td>
                <td>: {user?.email}</td>
              </tr>
              <tr>
                <td><strong>Phone</strong></td>
                <td>: {user?.phone || '-'}</td>
              </tr>
              <tr>
                <td><strong>Role</strong></td>
                <td>: {getRoleBadge(user?.role)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Update Profile</h5>
              <form onSubmit={handleProfileSubmit}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Change Password</h5>
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">Update Password</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
