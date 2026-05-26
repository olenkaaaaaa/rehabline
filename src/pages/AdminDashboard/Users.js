import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { createAuditLog } from '../../utils/auditLog';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import '../../styles/pages/admin-users.css';

const roleLabels = {
  client: {
    UA: 'Клієнт',
    EN: 'Client',
  },
  specialist: {
    UA: 'Спеціаліст',
    EN: 'Specialist',
  },
  registrar: {
    UA: 'Реєстратор',
    EN: 'Registrar',
  },
  admin: {
    UA: 'Адміністратор',
    EN: 'Administrator',
  },
};

const getRoleLabel = (role, lang) => {
  return roleLabels[role]?.[lang] || role || '—';
};

const AdminUsers = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [specialists, setSpecialists] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);

  const [editData, setEditData] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: 'client',
    specialistId: '',
    isBlocked: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const [profilesResponse, specialistsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('specialists')
          .select('*')
          .order('name', { ascending: true }),
      ]);

      if (profilesResponse.error) throw profilesResponse.error;
      if (specialistsResponse.error) throw specialistsResponse.error;

      setProfiles(profilesResponse.data || []);
      setSpecialists(specialistsResponse.data || []);
    } catch (error) {
      console.error('Admin users loading failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити користувачів: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load users: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const enrichedUsers = useMemo(() => {
    return profiles.map((profile) => {
      const linkedSpecialist = specialists.find(
        (specialist) => specialist.user_id === profile.id
      );

      return {
        ...profile,
        fullName: profile.full_name || profile.name || profile.email || 'Користувач',
        emailLabel: profile.email || '',
        phoneLabel: profile.phone || '',
        roleValue: profile.role || 'client',
        linkedSpecialist,
      };
    });
  }, [profiles, specialists]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return enrichedUsers.filter((profile) => {
      const matchesRole = !roleFilter || profile.roleValue === roleFilter;

      const searchText = [
        profile.fullName,
        profile.emailLabel,
        profile.phoneLabel,
        profile.roleValue,
        profile.linkedSpecialist?.name,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchText.includes(normalizedSearch);

      return matchesRole && matchesSearch;
    });
  }, [enrichedUsers, searchTerm, roleFilter]);

  const stats = useMemo(() => {
    return {
      all: enrichedUsers.length,
      clients: enrichedUsers.filter((item) => item.roleValue === 'client').length,
      specialists: enrichedUsers.filter((item) => item.roleValue === 'specialist').length,
      registrars: enrichedUsers.filter((item) => item.roleValue === 'registrar').length,
      admins: enrichedUsers.filter((item) => item.roleValue === 'admin').length,
    };
  }, [enrichedUsers]);

  const startEdit = (profile) => {
    setEditingUserId(profile.id);

    setEditData({
      fullName: profile.fullName || '',
      phone: profile.phoneLabel || '',
      email: profile.emailLabel || '',
      role: profile.roleValue || 'client',
      specialistId: profile.linkedSpecialist?.id ? String(profile.linkedSpecialist.id) : '',
      isBlocked: Boolean(profile.is_blocked),
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);

    setEditData({
      fullName: '',
      phone: '',
      email: '',
      role: 'client',
      specialistId: '',
      isBlocked: false,
    });
  };

  const handleEditChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveUser = async (profile) => {
    try {
      setSaving(true);

      const previousRole = profile.roleValue;

      const profilePayload = {
        full_name: editData.fullName.trim() || null,
        phone: editData.phone.trim() || null,
        email: editData.email.trim() || null,
        role: editData.role,
        is_blocked: Boolean(editData.isBlocked),
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', profile.id);

      if (profileError) throw profileError;

      const previouslyLinkedSpecialist = specialists.find(
        (specialist) => specialist.user_id === profile.id
      );

      if (previouslyLinkedSpecialist && editData.role !== 'specialist') {
        const { error: unlinkError } = await supabase
          .from('specialists')
          .update({ user_id: null })
          .eq('id', previouslyLinkedSpecialist.id);

        if (unlinkError) throw unlinkError;
      }

      if (editData.role === 'specialist' && editData.specialistId) {
        const { error: unlinkDuplicatesError } = await supabase
          .from('specialists')
          .update({ user_id: null })
          .eq('user_id', profile.id);

        if (unlinkDuplicatesError) throw unlinkDuplicatesError;

        const { error: linkError } = await supabase
          .from('specialists')
          .update({
            user_id: profile.id,
            name: editData.fullName.trim() || previouslyLinkedSpecialist?.name || profile.fullName,
          })
          .eq('id', Number(editData.specialistId));

        if (linkError) throw linkError;
      }

      await createAuditLog({
        user,
        action: 'update_user_role',
        entity: 'profile',
        tableName: 'profiles',
        recordId: profile.id,
        description: `Змінено користувача ${profile.fullName}: роль ${previousRole} → ${editData.role}`,
        metadata: {
          previousRole,
          newRole: editData.role,
          specialistId: editData.specialistId || null,
          isBlocked: Boolean(editData.isBlocked),
        },
      });

      await loadUsers();
      cancelEdit();

      alert(lang === 'UA' ? 'Користувача збережено' : 'User saved');
    } catch (error) {
      console.error('Save user failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося зберегти користувача: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to save user: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-users">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Користувачі' : 'Users'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="section-header-row">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Користувачі' : 'Users'}
        </h1>

        <button type="button" className="btn-outline" onClick={loadUsers}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{lang === 'UA' ? 'Усього' : 'Total'}</div>
          <div className="stat-value">{stats.all}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{lang === 'UA' ? 'Клієнти' : 'Clients'}</div>
          <div className="stat-value">{stats.clients}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Спеціалісти' : 'Specialists'}
          </div>
          <div className="stat-value">{stats.specialists}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Адміни / реєстратори' : 'Admins / registrars'}
          </div>
          <div className="stat-value">{stats.admins + stats.registrars}</div>
        </div>
      </div>

      <div className="records-actions admin-users-filters">
        <input
          type="text"
          value={searchTerm}
          placeholder={
            lang === 'UA'
              ? 'Пошук за ПІБ, email, телефоном, роллю...'
              : 'Search by name, email, phone, role...'
          }
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="">{lang === 'UA' ? 'Усі ролі' : 'All roles'}</option>
          <option value="client">{getRoleLabel('client', lang)}</option>
          <option value="specialist">{getRoleLabel('specialist', lang)}</option>
          <option value="registrar">{getRoleLabel('registrar', lang)}</option>
          <option value="admin">{getRoleLabel('admin', lang)}</option>
        </select>
      </div>

      <div className="admin-users-table-wrap">
        {filteredUsers.length > 0 ? (
          <table className="appointments-table admin-users-table">
            <thead>
              <tr>
                <th>{lang === 'UA' ? 'Користувач' : 'User'}</th>
                <th>Email</th>
                <th>{lang === 'UA' ? 'Телефон' : 'Phone'}</th>
                <th>{lang === 'UA' ? 'Роль' : 'Role'}</th>
                <th>{lang === 'UA' ? 'Лікар' : 'Specialist'}</th>
                <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((profile) => {
                const isEditing = editingUserId === profile.id;

                return (
                  <tr key={profile.id}>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.fullName}
                          onChange={(event) =>
                            handleEditChange('fullName', event.target.value)
                          }
                        />
                      ) : (
                        <>
                          <strong>{profile.fullName}</strong>
                          <div className="table-subtext">ID: {profile.id}</div>
                        </>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(event) =>
                            handleEditChange('email', event.target.value)
                          }
                        />
                      ) : (
                        profile.emailLabel || '—'
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.phone}
                          onChange={(event) =>
                            handleEditChange('phone', event.target.value)
                          }
                        />
                      ) : (
                        profile.phoneLabel || '—'
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <select
                          value={editData.role}
                          onChange={(event) =>
                            handleEditChange('role', event.target.value)
                          }
                        >
                          <option value="client">{getRoleLabel('client', lang)}</option>
                          <option value="specialist">
                            {getRoleLabel('specialist', lang)}
                          </option>
                          <option value="registrar">
                            {getRoleLabel('registrar', lang)}
                          </option>
                          <option value="admin">{getRoleLabel('admin', lang)}</option>
                        </select>
                      ) : (
                        <span className={`status-badge role-badge role-${profile.roleValue}`}>
                          {getRoleLabel(profile.roleValue, lang)}
                        </span>
                      )}
                    </td>

                    <td>
                      {isEditing && editData.role === 'specialist' ? (
                        <select
                          value={editData.specialistId}
                          onChange={(event) =>
                            handleEditChange('specialistId', event.target.value)
                          }
                        >
                          <option value="">
                            {lang === 'UA'
                              ? 'Не прив’язувати'
                              : 'Do not link'}
                          </option>

                          {specialists.map((specialist) => (
                            <option key={specialist.id} value={specialist.id}>
                              {specialist.name}
                              {specialist.user_id && specialist.user_id !== profile.id
                                ? lang === 'UA'
                                  ? ' · вже прив’язаний'
                                  : ' · already linked'
                                : ''}
                            </option>
                          ))}
                        </select>
                      ) : profile.linkedSpecialist ? (
                        profile.linkedSpecialist.name
                      ) : (
                        '—'
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <label className="inline-checkbox">
                          <input
                            type="checkbox"
                            checked={editData.isBlocked}
                            onChange={(event) =>
                              handleEditChange('isBlocked', event.target.checked)
                            }
                          />
                          {lang === 'UA' ? 'Заблокований' : 'Blocked'}
                        </label>
                      ) : (
                        <span
                          className={`status-badge ${
                            profile.is_blocked ? 'status-cancelled' : 'status-confirmed'
                          }`}
                        >
                          {profile.is_blocked
                            ? lang === 'UA'
                              ? 'Заблокований'
                              : 'Blocked'
                            : lang === 'UA'
                              ? 'Активний'
                              : 'Active'}
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="table-actions">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => saveUser(profile)}
                              disabled={saving}
                              title={lang === 'UA' ? 'Зберегти' : 'Save'}
                            >
                              <FaSave />
                            </button>

                            <button
                              type="button"
                              className="icon-btn"
                              onClick={cancelEdit}
                              disabled={saving}
                              title={lang === 'UA' ? 'Скасувати' : 'Cancel'}
                            >
                              <FaTimes />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => startEdit(profile)}
                            title={lang === 'UA' ? 'Редагувати' : 'Edit'}
                          >
                            <FaEdit />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>
              {lang === 'UA'
                ? 'Користувачів не знайдено'
                : 'No users found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;