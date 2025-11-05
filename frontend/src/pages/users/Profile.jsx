import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Profile = () => {
  const { user, updateProfile, updatePassword, deleteUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSymbol: false
  });

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

    // Validate new password when it changes
    if (name === 'newPassword') {
      setPasswordValidation({
        minLength: value.length >= 8,
        hasLowercase: /[a-z]/.test(value),
        hasUppercase: /[A-Z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSymbol: /[^a-zA-Z0-9]/.test(value)
      });
    }
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

    // Validate password requirements
    const allRequirementsMet = Object.values(passwordValidation).every(val => val === true);
    if (!allRequirementsMet) {
      toast.error('New password does not meet all requirements');
      return;
    }

    const result = await updatePassword(passwordData);
    if (result.success) {
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Reset password validation
      setPasswordValidation({
        minLength: false,
        hasLowercase: false,
        hasUppercase: false,
        hasNumber: false,
        hasSymbol: false
      });
      navigate('/login'); // Redirect to login after password change and logout
    } else {
      toast.error(result.error || 'Failed to update password');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteModal(false);
    const result = await deleteUser();
    if (result.success) {
      toast.success('Account deleted successfully');
      navigate('/login'); // Redirect to login after account deletion and logout
    } else {
      toast.error(result.error || 'Failed to delete account');
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteModal(false);
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'bg-danger',
      staff: 'bg-primary',
      viewer: 'bg-secondary'
    };
    return <span className={`badge ${variants[role] || 'bg-secondary'}`}>{role?.toUpperCase()}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>My Profile</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active">Profile</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Profile Info Banner */}
      <div className="alert alert-primary mb-4">
        <div className="d-flex align-items-center">
          <div className="flex-shrink-0 me-3">
            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                 style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-person-circle" style={{ fontSize: '3rem', color: 'var(--primary-color)' }}></i>
            </div>
          </div>
          <div className="flex-grow-1">
            <h4 className="alert-heading mb-1">
              {user?.name}
            </h4>
            <p className="mb-0">
              <i className="bi bi-envelope me-2"></i>{user?.email}
              {user?.phone && (
                <span className="ms-3">
                  <i className="bi bi-telephone me-2"></i>{user.phone}
                </span>
              )}
              <span className="ms-3">{getRoleBadge(user?.role)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Current Information Card */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-info-circle me-2"></i>Account Information
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-lg-6">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>
                      <strong><i className="bi bi-person me-2"></i>Name</strong>
                    </td>
                    <td>{user?.name}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong><i className="bi bi-envelope me-2"></i>Email</strong>
                    </td>
                    <td>{user?.email}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong><i className="bi bi-telephone me-2"></i>Phone</strong>
                    </td>
                    <td>{user?.phone || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-lg-6">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>
                      <strong><i className="bi bi-shield-check me-2"></i>Role</strong>
                    </td>
                    <td>{getRoleBadge(user?.role)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong><i className="bi bi-clock-history me-2"></i>Created At</strong>
                    </td>
                    <td>{formatDate(user?.created_at)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong><i className="bi bi-arrow-repeat me-2"></i>Updated At</strong>
                    </td>
                    <td>{formatDate(user?.updated_at)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Update Profile */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100 border-primary">
            <div className="card-header bg-primary bg-opacity-10">
              <h5 className="mb-0">
                <i className="bi bi-pencil-square me-2"></i>Update Profile
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleProfileSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    <i className="bi bi-person me-2"></i>Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    placeholder="Enter your name"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    <i className="bi bi-envelope me-2"></i>Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    <i className="bi bi-telephone me-2"></i>Phone
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter your phone number"
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  <i className="bi bi-check-circle me-2"></i>Save Changes
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Change Password & Danger Zone */}
        <div className="col-lg-6">
          <div className="card mb-4 border-warning">
            <div className="card-header bg-warning bg-opacity-10">
              <h5 className="mb-0">
                <i className="bi bi-key me-2"></i>Change Password
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    <i className="bi bi-lock me-2"></i>Current Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      className="form-control"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      style={{ paddingRight: '2.5rem' }}
                      required
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{ textDecoration: 'none', color: '#6c757d' }}
                      tabIndex={-1}
                    >
                      <i className={`bi bi-eye${showCurrentPassword ? '-slash' : ''}`}></i>
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    <i className="bi bi-lock-fill me-2"></i>New Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="form-control"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      style={{ paddingRight: '2.5rem' }}
                      required
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ textDecoration: 'none', color: '#6c757d' }}
                      tabIndex={-1}
                    >
                      <i className={`bi bi-eye${showNewPassword ? '-slash' : ''}`}></i>
                    </button>
                  </div>
                  {passwordData.newPassword && (
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
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    <i className="bi bi-shield-lock me-2"></i>Confirm New Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      style={{ paddingRight: '2.5rem' }}
                      required
                      placeholder="Confirm new password"
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
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <small className="text-danger d-block mt-1">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      Passwords do not match
                    </small>
                  )}
                  {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                    <small className="text-success d-block mt-1">
                      <i className="bi bi-check-circle me-1"></i>
                      Passwords match
                    </small>
                  )}
                </div>
                <button type="submit" className="btn btn-warning w-100">
                  <i className="bi bi-shield-check me-2"></i>Update Password
                </button>
              </form>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border-danger">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>Danger Zone
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted mb-3">
                <i className="bi bi-info-circle me-2"></i>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                className="btn btn-danger w-100"
                onClick={handleDeleteAccount}
              >
                <i className="bi bi-trash me-2"></i>Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        title="Confirm Account Deletion"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmText="Delete Account"
        onConfirm={confirmDeleteAccount}
        onCancel={cancelDeleteAccount}
      />
    </DashboardLayout>
  );
};

export default Profile;
