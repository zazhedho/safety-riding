import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import roleService from '../../services/roleService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useTranslation } from 'react-i18next';

const UserForm = () => {
  const { t } = useTranslation();
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
    if (!id && user?.role !== 'admin' && user?.role !== 'superadmin') {
      toast.error(t('users.form.unauthorizedCreate'));
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
      toast.error(t('users.form.fetchUserFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleService.getAll({ limit: 1000 });
      setRoles(response.data.data || []);
    } catch (error) {
      console.error(t('users.form.fetchRolesFailed'));
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
      toast.error(t('users.form.passwordMismatch'));
      return;
    }

    // Validate password requirements for new users or when changing password
    if (formData.password && (!id || formData.password)) {
      const allRequirementsMet = Object.values(passwordValidation).every(val => val === true);
      if (!allRequirementsMet) {
        toast.error(t('users.form.passwordRequirementsNotMet'));
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
        toast.success(t('users.form.updateSuccess'));
      } else {
        const result = await register(userData);
        if (result.success) {
          toast.success(t('users.form.createSuccess'));
        } else {
          toast.error(result.error || t('users.form.createFailed'));
        }
      }
      navigate('/users');
    } catch (error) {
      toast.error(error.response?.data?.message || t('users.form.saveFailed'));
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    setShowDeleteModal(false);
    try {
      await userService.delete(id);
      toast.success(t('users.form.deleteSuccess'));
      navigate('/users');
    } catch (error) {
      toast.error(error.response?.data?.message || t('users.form.deleteFailed'));
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return <>{t('common.loading')}</>;
  }

  return (
    <>
      <h2>{id ? t('users.form.editTitle') : t('users.form.createTitle')}</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">{t('users.form.name')}</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('users.form.namePlaceholder')}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">{t('users.form.email')}</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('users.form.emailPlaceholder')}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">{t('users.form.phone')}</label>
              <input
                type="text"
                className="form-control"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('users.form.phonePlaceholder')}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">{t('users.form.role')}</label>
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
            <h5>{id ? t('users.form.changePassword') : t('users.form.password')}</h5>
            <div className="mb-3">
              <label className="form-label">{t('users.form.password')}</label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={id ? t('users.form.passwordPlaceholderEdit') : t('users.form.passwordPlaceholderCreate')}
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
                  <small className="d-block fw-bold mb-2 text-secondary">{t('users.form.passwordRequirementsTitle')}</small>
                  <div className="d-flex flex-column gap-1">
                    <small className={passwordValidation.minLength ? 'text-success' : 'text-danger'}>
                      <i className={`bi bi-${passwordValidation.minLength ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      {t('users.form.reqMinLength')}
                    </small>
                    <small className={passwordValidation.hasLowercase ? 'text-success' : 'text-danger'}>
                      <i className={`bi bi-${passwordValidation.hasLowercase ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      {t('users.form.reqLowercase')}
                    </small>
                    <small className={passwordValidation.hasUppercase ? 'text-success' : 'text-danger'}>
                      <i className={`bi bi-${passwordValidation.hasUppercase ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      {t('users.form.reqUppercase')}
                    </small>
                    <small className={passwordValidation.hasNumber ? 'text-success' : 'text-danger'}>
                      <i className={`bi bi-${passwordValidation.hasNumber ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      {t('users.form.reqNumber')}
                    </small>
                    <small className={passwordValidation.hasSymbol ? 'text-success' : 'text-danger'}>
                      <i className={`bi bi-${passwordValidation.hasSymbol ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      {t('users.form.reqSymbol')}
                    </small>
                  </div>
                </div>
              )}
              {!formData.password && !id && (
                <small className="text-muted d-block mt-1">
                  <i className="bi bi-info-circle me-1"></i>
                  {t('users.form.reqSummary')}
                </small>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">{t('users.form.confirmPassword')}</label>
              <div className="position-relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={id ? t('users.form.confirmPasswordPlaceholderEdit') : t('users.form.confirmPasswordPlaceholderCreate')}
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
                  {t('users.form.passwordMismatch')}
                </small>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <small className="text-success d-block mt-1">
                  <i className="bi bi-check-circle me-1"></i>
                  {t('users.form.passwordMatch')}
                </small>
              )}
            </div>
            <button type="submit" className="btn btn-primary">{t('users.form.save')}</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/users')}>{t('users.form.cancel')}</button>
            {id && hasPermission('delete_users') && (
              <button type="button" className="btn btn-danger ms-2" onClick={handleDelete}>
                {t('users.form.delete')}
              </button>
            )}
          </form>
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        title={t('users.form.deleteConfirmTitle')}
        message={t('users.form.deleteConfirmMessage')}
        confirmText={t('users.form.delete')}
        onConfirm={confirmDeleteUser}
        onCancel={cancelDeleteUser}
      />
    </>
  );
};

export default UserForm;
