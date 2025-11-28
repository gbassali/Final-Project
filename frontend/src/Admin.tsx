import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { postJSON, getJSON, patchJSON, deleteJSON } from './api/client';

type AdminSummary = {
  id: number;
  name: string;
  email: string;
};

type AdminSession = {
  token: string;
  admin: AdminSummary;
};

type TrainerSummary = {
  id: number;
  name: string;
};

type RoomSummary = {
  id: number;
  name: string;
  capacity: number;
};

type FitnessClassWithDetails = {
  id: number;
  name: string;
  trainerId: number;
  roomId: number;
  startTime: string;
  endTime: string;
  capacity: number;
  trainer: { id: number; name: string };
  room: { id: number; name: string };
  registrationCount: number;
};

const ADMIN_SESSION_KEY = 'admin-session';

function Admin() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [trainers, setTrainers] = useState<TrainerSummary[]>([]);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [classes, setClasses] = useState<FitnessClassWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [classForm, setClassForm] = useState({
    name: '',
    trainerId: '',
    roomId: '',
    date: '',
    startTime: '',
    endTime: '',
    capacity: '',
  });
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Load session from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as AdminSession;
      if (parsed?.token && parsed?.admin) {
        setSession(parsed);
      }
    } catch {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (session?.token) {
      loadData();
    }
  }, [session?.token]);

  const loadData = async () => {
    if (!session?.token) return;
    setLoading(true);
    try {
      const [trainersData, roomsData, classesData] = await Promise.all([
        getJSON<TrainerSummary[]>('/api/admin/trainers', { token: session.token }),
        getJSON<RoomSummary[]>('/api/admin/rooms', { token: session.token }),
        getJSON<FitnessClassWithDetails[]>('/api/admin/classes', { token: session.token }),
      ]);
      setTrainers(trainersData);
      setRooms(roomsData);
      setClasses(classesData);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const response = await postJSON<AdminSession>('/api/auth/admin/login', {
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
      setSession(response);
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(response));
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setClasses([]);
    setTrainers([]);
    setRooms([]);
  };

  const handleClassFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setClassForm(prev => ({ ...prev, [name]: value }));
  };

  const resetClassForm = () => {
    setClassForm({
      name: '',
      trainerId: '',
      roomId: '',
      date: '',
      startTime: '',
      endTime: '',
      capacity: '',
    });
    setEditingClassId(null);
  };

  const handleEditClass = (cls: FitnessClassWithDetails) => {
    const start = new Date(cls.startTime);
    const end = new Date(cls.endTime);
    setClassForm({
      name: cls.name,
      trainerId: String(cls.trainerId),
      roomId: String(cls.roomId),
      date: start.toISOString().split('T')[0],
      startTime: start.toTimeString().slice(0, 5),
      endTime: end.toTimeString().slice(0, 5),
      capacity: String(cls.capacity),
    });
    setEditingClassId(cls.id);
  };

  const handleSubmitClass = async (e: FormEvent) => {
    e.preventDefault();
    if (!session?.token) return;

    setSaving(true);
    setMessage(null);

    try {
      const startDateTime = `${classForm.date}T${classForm.startTime}:00`;
      const endDateTime = `${classForm.date}T${classForm.endTime}:00`;

      const payload = {
        name: classForm.name,
        trainerId: Number(classForm.trainerId),
        roomId: Number(classForm.roomId),
        startTime: startDateTime,
        endTime: endDateTime,
        capacity: Number(classForm.capacity),
      };

      if (editingClassId) {
        await patchJSON(`/api/admin/classes/${editingClassId}`, payload, { token: session.token });
        setMessage({ type: 'success', text: 'Class updated successfully!' });
      } else {
        await postJSON('/api/admin/classes', payload, { token: session.token });
        setMessage({ type: 'success', text: 'Class created successfully!' });
      }

      resetClassForm();
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save class' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (classId: number) => {
    if (!session?.token) return;
    if (!confirm('Are you sure you want to delete this class?')) return;

    setMessage(null);
    try {
      await deleteJSON(`/api/admin/classes/${classId}`, { token: session.token });
      setMessage({ type: 'success', text: 'Class deleted successfully!' });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete class' });
    }
  };

  const isAuthenticated = Boolean(session?.token);
  const now = new Date();
  const upcomingClasses = classes.filter(c => new Date(c.startTime) > now);
  const pastClasses = classes.filter(c => new Date(c.startTime) <= now);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>🏋️ Admin Panel</h1>
        <p>Health & Fitness Club Management</p>
      </header>

      <main>
        {!isAuthenticated ? (
          <section className="card admin-login">
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin} className="stack">
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@gym.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </label>
              {loginError && <p className="status error">{loginError}</p>}
              <button type="submit" disabled={loginLoading}>
                {loginLoading ? 'Logging in…' : 'Login'}
              </button>
            </form>
            <p className="hint" style={{ marginTop: '1rem' }}>
              Test credentials: admin@gym.com / admin123
            </p>
          </section>
        ) : (
          <>
            <div className="admin-toolbar">
              <span>Welcome, <strong>{session.admin.name}</strong></span>
              <button type="button" onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>

            {message && (
              <p className={`status ${message.type}`}>{message.text}</p>
            )}

            {/* Class Form */}
            <section className="card">
              <h2>{editingClassId ? 'Edit Class' : 'Create New Class'}</h2>
              <form onSubmit={handleSubmitClass} className="class-form">
                <div className="form-row">
                  <label>
                    Class Name
                    <input
                      type="text"
                      name="name"
                      value={classForm.name}
                      onChange={handleClassFormChange}
                      placeholder="e.g., Morning Yoga"
                      required
                    />
                  </label>
                  <label>
                    Capacity
                    <input
                      type="number"
                      name="capacity"
                      value={classForm.capacity}
                      onChange={handleClassFormChange}
                      min="1"
                      required
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Trainer
                    <select name="trainerId" value={classForm.trainerId} onChange={handleClassFormChange} required>
                      <option value="">Select trainer</option>
                      {trainers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Room
                    <select name="roomId" value={classForm.roomId} onChange={handleClassFormChange} required>
                      <option value="">Select room</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Date
                    <input
                      type="date"
                      name="date"
                      value={classForm.date}
                      onChange={handleClassFormChange}
                      required
                    />
                  </label>
                  <label>
                    Start Time
                    <input
                      type="time"
                      name="startTime"
                      value={classForm.startTime}
                      onChange={handleClassFormChange}
                      required
                    />
                  </label>
                  <label>
                    End Time
                    <input
                      type="time"
                      name="endTime"
                      value={classForm.endTime}
                      onChange={handleClassFormChange}
                      required
                    />
                  </label>
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : editingClassId ? 'Update Class' : 'Create Class'}
                  </button>
                  {editingClassId && (
                    <button type="button" onClick={resetClassForm} className="btn-secondary">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </section>

            {/* Classes List */}
            <section className="card">
              <div className="card-header">
                <h2>Upcoming Classes ({upcomingClasses.length})</h2>
                <button type="button" onClick={loadData} disabled={loading}>
                  {loading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>

              {loading && classes.length === 0 ? (
                <p>Loading classes…</p>
              ) : upcomingClasses.length === 0 ? (
                <p className="hint">No upcoming classes. Create one above!</p>
              ) : (
                <div className="admin-class-list">
                  {upcomingClasses.map(cls => (
                    <div key={cls.id} className="admin-class-card">
                      <div className="class-main">
                        <h3>{cls.name}</h3>
                        <p className="class-datetime">
                          {new Date(cls.startTime).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          · {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(cls.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="class-meta">
                          👤 {cls.trainer.name} · 📍 {cls.room.name}
                        </p>
                        <p className="class-capacity">
                          {cls.registrationCount}/{cls.capacity} registered
                        </p>
                      </div>
                      <div className="class-actions">
                        <button type="button" onClick={() => handleEditClass(cls)} className="btn-small">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(cls.id)}
                          className="btn-small btn-danger"
                          disabled={cls.registrationCount > 0}
                          title={cls.registrationCount > 0 ? 'Cannot delete class with registrations' : ''}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Past Classes (collapsed) */}
            {pastClasses.length > 0 && (
              <section className="card">
                <h2>Past Classes ({pastClasses.length})</h2>
                <p className="hint">Past classes are shown for reference only.</p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Admin;

