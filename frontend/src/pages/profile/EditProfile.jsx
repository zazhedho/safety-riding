import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'bootstrap-icons/font/bootstrap-icons.css';

const EditProfile = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
    } else {
      toast.error(result.error || 'Failed to update password');
    }
  };

  return (
    <>
      <h2>Edit Profile</h2>
      <div className="row">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Profile Information</h5>
              <form onSubmit={handleProfileSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
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
                  <div className="col-md-6 mb-3">
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
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <input
                    type="text"
                    className="form-control"
                    value={user?.role?.toUpperCase() || ''}
                    disabled
                  />
                </div>
                <button type="submit" className="btn btn-primary">Update Profile</button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Change Password</h5>
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <div className="position-relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      className="form-control"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      style={{ paddingRight: '2.5rem' }}
                      required
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
                  <label className="form-label">New Password</label>
                  <div className="position-relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="form-control"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      style={{ paddingRight: '2.5rem' }}
                      required
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
                  <label className="form-label">Confirm New Password</label>
                  <div className="position-relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      style={{ paddingRight: '2.5rem' }}
                      required
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
                <button type="submit" className="btn btn-primary">Change Password</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProfile;
