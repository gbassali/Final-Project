import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { postJSON, getJSON, patchJSON } from './api/client';

type MemberSummary = {
  id: number;
  name: string;
  email: string;
};

type MemberProfile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string;
};

type FitnessGoal = {
  id: number;
  value: string;
  active: boolean;
  recordedAt: string | null;
  memberId: number;
};

type HealthMetric = {
  id: number;
  metricType: string;
  value: number;
  unit: string | null;
  recordedAt: string | null;
  memberId: number;
};

type Session = {
  token: string;
  member: MemberSummary;
};

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  token: string;
  member: MemberSummary;
};

const emptyLoginForm: LoginPayload = {
  email: '',
  password: '',
};

const SESSION_KEY = 'member-session';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loginForm, setLoginForm] = useState<LoginPayload>(emptyLoginForm);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    dateOfBirth: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  const [goalForm, setGoalForm] = useState({
    value: '',
    active: true,
    recordedAt: '',
  });
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalMessage, setGoalMessage] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [metricForm, setMetricForm] = useState({
    metricType: '',
    value: '',
    unit: '',
    recordedAt: '',
  });
  const [metricSaving, setMetricSaving] = useState(false);
  const [metricMessage, setMetricMessage] = useState<string | null>(null);

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Session;
      if (parsed?.token && parsed?.member) {
        setSession(parsed);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        dateOfBirth: profile.dateOfBirth
          ? profile.dateOfBirth.slice(0, 10)
          : '',
      });
    } else {
      setProfileForm({ name: '', phone: '', dateOfBirth: '' });
    }
  }, [profile]);

  useEffect(() => {
    if (session?.token) {
      loadDashboard();
    } else {
      setProfile(null);
      setGoals([]);
      setMetrics([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  const loadDashboard = async () => {
    if (!session?.token) return;
    setDashboardLoading(true);
    setDashboardError(null);
    const memberId = session.member.id;
    try {
      const [member, goalsData, metricsData] = await Promise.all([
        getJSON<MemberProfile>(`/api/members/${memberId}`, {
          token: session.token,
        }),
        getJSON<FitnessGoal[]>(`/api/members/${memberId}/goals`, {
          token: session.token,
        }),
        getJSON<HealthMetric[]>(`/api/members/${memberId}/metrics`, {
          token: session.token,
        }),
      ]);
      setProfile(member);
      setGoals(goalsData);
      setMetrics(metricsData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load dashboard';
      setDashboardError(message);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleLoginChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginSubmitting(true);
    setLoginError(null);
    try {
      const payload: LoginPayload = {
        email: loginForm.email.trim(),
        password: loginForm.password,
      };
      const response = await postJSON<LoginResponse>(
        '/api/auth/login',
        payload
      );
      setSession(response);
      localStorage.setItem(SESSION_KEY, JSON.stringify(response));
      setLoginForm(emptyLoginForm);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to login';
      setLoginError(message);
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (!session?.token) {
      setSession(null);
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    try {
      await postJSON('/api/auth/logout', {}, { token: session.token });
    } catch {
      // ignore logout errors
    } finally {
      setSession(null);
      localStorage.removeItem(SESSION_KEY);
    }
  };

  const isAuthenticated = Boolean(session?.token);

  const handleProfileFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGoalFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setGoalForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMetricFieldChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setMetricForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="page">
      <header>
        <h1>Member Dashboard</h1>
        <p>Login to view and manage your profile, goals, and health metrics.</p>
      </header>

      <main>
        {!isAuthenticated && (
          <section className="card">
            <h2>Member Login</h2>
            <form onSubmit={handleLoginSubmit} className="stack">
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  required
                  placeholder="jane@example.com"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                />
              </label>
              <button type="submit" disabled={loginSubmitting}>
                {loginSubmitting ? 'Logging in…' : 'Login'}
              </button>
              {loginError && <p className="status error">{loginError}</p>}
            </form>
          </section>
        )}

        {isAuthenticated && (
          <>
            <section className="card">
              <div className="card-header">
                <h2>Profile</h2>
                <div className="actions">
                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                  <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={dashboardLoading}
                  >
                    Refresh
                  </button>
                </div>
              </div>
              {dashboardError && (
                <p className="status error">{dashboardError}</p>
              )}
              {profile ? (
                <>
                  <dl>
                    <div>
                      <dt>Name</dt>
                      <dd>{profile.name}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{profile.email}</dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{profile.phone ?? 'N/A'}</dd>
                    </div>
                    <div>
                      <dt>Date of Birth</dt>
                      <dd>
                        {profile.dateOfBirth
                          ? new Date(profile.dateOfBirth).toLocaleDateString()
                          : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                  <form
                    className="stack"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      if (!session?.token) return;
                      setProfileSaving(true);
                      setProfileMessage(null);
                      try {
                        const payload: Record<string, unknown> = {
                          name: profileForm.name,
                          phone: profileForm.phone || null,
                        };
                        if (profileForm.dateOfBirth) {
                          payload.dateOfBirth = profileForm.dateOfBirth;
                        }
                        const updated = await patchJSON<MemberProfile>(
                          `/api/members/${session.member.id}`,
                          payload,
                          { token: session.token }
                        );
                        setProfile(updated);
                        setProfileMessage('Profile updated successfully');
                      } catch (err) {
                        setProfileMessage(
                          err instanceof Error
                            ? err.message
                            : 'Failed to update profile'
                        );
                      } finally {
                        setProfileSaving(false);
                      }
                    }}
                  >
                    <h3>Edit Profile</h3>
                    <label>
                      Name
                      <input
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileFieldChange}
                        required
                      />
                    </label>
                    <label>
                      Phone
                      <input
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileFieldChange}
                      />
                    </label>
                    <label>
                      Date of Birth
                      <input
                        name="dateOfBirth"
                        type="date"
                        value={profileForm.dateOfBirth}
                        onChange={handleProfileFieldChange}
                      />
                    </label>
                    <button type="submit" disabled={profileSaving}>
                      {profileSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                    {profileMessage && (
                      <p className="status success">{profileMessage}</p>
                    )}
                  </form>
                </>
              ) : (
                <p>Loading profile…</p>
              )}
            </section>

            <section className="card">
              <h2>Fitness Goals</h2>
              {goalMessage && (
                <p className="status success">{goalMessage}</p>
              )}
              {goals.length ? (
                <ul className="list">
                  {goals.map((goal) => (
                    <li key={goal.id}>
                      <strong>{goal.value}</strong> ·{' '}
                      {goal.active ? 'Active' : 'Inactive'} ·{' '}
                      {goal.recordedAt
                        ? new Date(goal.recordedAt).toLocaleDateString()
                        : 'No date'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No goals recorded yet.</p>
              )}
              <form
                className="stack"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!session?.token) return;
                  setGoalSaving(true);
                  setGoalMessage(null);
                  try {
                    const payload: Record<string, unknown> = {
                      value: goalForm.value,
                      active: goalForm.active,
                    };
                    if (goalForm.recordedAt) {
                      payload.recordedAt = goalForm.recordedAt;
                    }
                    const created = await postJSON<FitnessGoal>(
                      `/api/members/${session.member.id}/goals`,
                      payload,
                      { token: session.token }
                    );
                    setGoals((prev) => [created, ...prev]);
                    setGoalForm({ value: '', active: true, recordedAt: '' });
                    setGoalMessage('Goal added successfully');
                  } catch (err) {
                    setGoalMessage(
                      err instanceof Error
                        ? err.message
                        : 'Failed to add goal'
                    );
                  } finally {
                    setGoalSaving(false);
                  }
                }}
              >
                <h3>Add Goal</h3>
                <label>
                  Goal
                  <input
                    name="value"
                    value={goalForm.value}
                    onChange={handleGoalFieldChange}
                    required
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    name="active"
                    checked={goalForm.active}
                    onChange={handleGoalFieldChange}
                  />
                  Active
                </label>
                <label>
                  Recorded At
                  <input
                    type="date"
                    name="recordedAt"
                    value={goalForm.recordedAt}
                    onChange={handleGoalFieldChange}
                  />
                </label>
                <button type="submit" disabled={goalSaving}>
                  {goalSaving ? 'Saving…' : 'Add Goal'}
                </button>
              </form>
            </section>

            <section className="card">
              <h2>Health Metrics</h2>
              {metricMessage && (
                <p className="status success">{metricMessage}</p>
              )}
              {metrics.length ? (
                <ul className="list">
                  {metrics.map((metric) => (
                    <li key={metric.id}>
                      <strong>{metric.metricType}</strong> · {metric.value}{' '}
                      {metric.unit ?? ''}
                      {' · '}
                      {metric.recordedAt
                        ? new Date(metric.recordedAt).toLocaleString()
                        : 'No timestamp'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No metrics recorded yet.</p>
              )}
              <form
                className="stack"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!session?.token) return;
                  setMetricSaving(true);
                  setMetricMessage(null);
                  const valueNumber = Number(metricForm.value);
                  if (Number.isNaN(valueNumber)) {
                    setMetricMessage('Metric value must be a number');
                    setMetricSaving(false);
                    return;
                  }
                  try {
                    const payload: Record<string, unknown> = {
                      metricType: metricForm.metricType,
                      value: valueNumber,
                      unit: metricForm.unit || null,
                    };
                    if (metricForm.recordedAt) {
                      payload.recordedAt = metricForm.recordedAt;
                    }
                    const created = await postJSON<HealthMetric>(
                      `/api/members/${session.member.id}/metrics`,
                      payload,
                      { token: session.token }
                    );
                    setMetrics((prev) => [created, ...prev]);
                    setMetricForm({
                      metricType: '',
                      value: '',
                      unit: '',
                      recordedAt: '',
                    });
                    setMetricMessage('Metric added successfully');
                  } catch (err) {
                    setMetricMessage(
                      err instanceof Error
                        ? err.message
                        : 'Failed to add metric'
                    );
                  } finally {
                    setMetricSaving(false);
                  }
                }}
              >
                <h3>Add Metric</h3>
                <label>
                  Type
                  <input
                    name="metricType"
                    value={metricForm.metricType}
                    onChange={handleMetricFieldChange}
                    required
                    placeholder="WEIGHT, HEART_RATE, etc."
                  />
                </label>
                <label>
                  Value
                  <input
                    name="value"
                    type="number"
                    step="any"
                    value={metricForm.value}
                    onChange={handleMetricFieldChange}
                    required
                  />
                </label>
                <label>
                  Unit
                  <input
                    name="unit"
                    value={metricForm.unit}
                    onChange={handleMetricFieldChange}
                    placeholder="kg, bpm, %"
                  />
                </label>
                <label>
                  Recorded At
                  <input
                    type="datetime-local"
                    name="recordedAt"
                    value={metricForm.recordedAt}
                    onChange={handleMetricFieldChange}
                  />
                </label>
                <button type="submit" disabled={metricSaving}>
                  {metricSaving ? 'Saving…' : 'Add Metric'}
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
