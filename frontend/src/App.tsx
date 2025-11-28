import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { postJSON, getJSON, patchJSON, deleteJSON } from './api/client';

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
};

type HealthMetric = {
  id: number;
  metricType: string;
  value: number;
  unit: string | null;
  recordedAt: string | null;
};

type TrainerSummary = {
  id: number;
  name: string;
  email: string;
};

type TrainerAvailability = {
  id: number;
  type: 'ONE_TIME' | 'WEEKLY';
  dayOfWeek: number | null;
  startTime: string | null;
  endTime: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
};

type TrainerSchedule = {
  sessions: {
    id: number;
    memberId: number;
    startTime: string;
    endTime: string;
    roomId: number | null;
    member?: { id: number; name: string } | null;
    room?: { id: number; name: string } | null;
  }[];
  classes: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    roomId: number;
    capacity: number;
  }[];
};

type RoomSummary = {
  id: number;
  name: string;
  type: string | null;
  capacity: number;
};

type MemberSessionDetail = {
  id: number;
  startTime: string;
  endTime: string;
  trainerId: number | null;
  roomId: number | null;
  trainer?: {
    id: number;
    name: string | null;
    email: string | null;
  } | null;
  room?: {
    id: number;
    name: string;
    type: string | null;
    capacity: number;
  } | null;
};

type SessionState = {
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

type SectionKey = 'profile' | 'goals' | 'metrics' | 'sessions' | 'trainer';

const sections: { key: SectionKey; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'goals', label: 'Fitness Goals' },
  { key: 'metrics', label: 'Health Metrics' },
  { key: 'sessions', label: 'PT Sessions' },
  { key: 'trainer', label: 'Trainer Tools' },
];

const PT_TIME_SLOTS = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

type ScheduleEntry = {
  id: string;
  kind: 'SESSION' | 'CLASS';
  title: string;
  subTitle: string;
  startTime: string;
  endTime: string;
};

function App() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [activeSection, setActiveSection] =
    useState<SectionKey>('profile');

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

  const [trainers, setTrainers] = useState<TrainerSummary[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState<
    number | null
  >(null);
  const [availabilities, setAvailabilities] = useState<
    TrainerAvailability[]
  >([]);
  const [schedule, setSchedule] = useState<TrainerSchedule | null>(null);
  const [trainerMessage, setTrainerMessage] = useState<string | null>(null);
  const [availabilityForm, setAvailabilityForm] = useState({
    type: 'WEEKLY' as 'WEEKLY' | 'ONE_TIME',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '12:00',
    startDateTime: '',
    endDateTime: '',
  });
  const [trainerLoading, setTrainerLoading] = useState(false);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [memberSessions, setMemberSessions] = useState<MemberSessionDetail[]>(
    []
  );
  const [sessionForm, setSessionForm] = useState({
    trainerId: '',
    roomId: '',
    date: '',
    timeSlot: '',
  });
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [sessionMessageTone, setSessionMessageTone] = useState<
    'success' | 'error'
  >('success');
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionSaving, setSessionSaving] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SessionState;
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
      loadTrainers();
      loadRooms();
      loadMemberSessions();
    } else {
      setProfile(null);
      setGoals([]);
      setMetrics([]);
      setTrainers([]);
      setAvailabilities([]);
      setSchedule(null);
      setRooms([]);
      setMemberSessions([]);
      setSessionForm({
        trainerId: '',
        roomId: '',
        date: '',
        timeSlot: '',
      });
      setSessionMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  useEffect(() => {
    if (session?.token && selectedTrainerId) {
      loadTrainerDetails(selectedTrainerId);
    } else {
      setAvailabilities([]);
      setSchedule(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrainerId]);

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

  const loadTrainers = async () => {
    if (!session?.token) return;
    try {
      const data = await getJSON<TrainerSummary[]>('/api/trainers', {
        token: session.token,
      });
      setTrainers(data);
      if (data.length && !selectedTrainerId) {
        setSelectedTrainerId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load trainers', err);
    }
  };

  const loadTrainerDetails = async (trainerId: number) => {
    if (!session?.token) return;
    setTrainerLoading(true);
    setTrainerMessage(null);
    try {
      const [availabilityData, scheduleData] = await Promise.all([
        getJSON<TrainerAvailability[]>(
          `/api/trainers/${trainerId}/availabilities`,
          { token: session.token }
        ),
        getJSON<TrainerSchedule>(`/api/trainers/${trainerId}/schedule`, {
          token: session.token,
        }),
      ]);
      setAvailabilities(availabilityData);
      setSchedule(scheduleData);
    } catch (err) {
      setTrainerMessage(
        err instanceof Error ? err.message : 'Failed to load trainer data'
      );
    } finally {
      setTrainerLoading(false);
    }
  };

  const loadRooms = async () => {
    if (!session?.token) return;
    try {
      const data = await getJSON<RoomSummary[]>('/api/rooms', {
        token: session.token,
      });
      setRooms(data);
    } catch (err) {
      console.error('Failed to load rooms', err);
    }
  };

  const loadMemberSessions = async () => {
    if (!session?.token) return;
    setSessionsLoading(true);
    try {
      const data = await getJSON<MemberSessionDetail[]>(
        `/api/members/${session.member.id}/sessions`,
        { token: session.token }
      );
      setMemberSessions(data);
    } catch (err) {
      console.error('Failed to load PT sessions', err);
    } finally {
      setSessionsLoading(false);
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

  const handleAvailabilityFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target as HTMLInputElement;
    setAvailabilityForm((prev) => ({
      ...prev,
      [name]:
        name === 'dayOfWeek'
          ? Number(value)
          : name === 'type'
          ? (value as 'WEEKLY' | 'ONE_TIME')
          : value,
    }));
  };

  const handleAddAvailability = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.token || !selectedTrainerId) return;
    setTrainerLoading(true);
    setTrainerMessage(null);
    try {
      const payload: Record<string, unknown> = {
        type: availabilityForm.type,
      };
      if (availabilityForm.type === 'WEEKLY') {
        payload.dayOfWeek = availabilityForm.dayOfWeek;
        payload.startTime = availabilityForm.startTime;
        payload.endTime = availabilityForm.endTime;
      } else {
        payload.startDateTime = availabilityForm.startDateTime;
        payload.endDateTime = availabilityForm.endDateTime;
      }
      const created = await postJSON<TrainerAvailability>(
        `/api/trainers/${selectedTrainerId}/availabilities`,
        payload,
        { token: session.token }
      );
      setAvailabilities((prev) => [...prev, created]);
      setTrainerMessage('Availability added');
    } catch (err) {
      setTrainerMessage(
        err instanceof Error ? err.message : 'Failed to add availability'
      );
    } finally {
      setTrainerLoading(false);
    }
  };

  const handleDeleteAvailability = async (id: number) => {
    if (!session?.token || !selectedTrainerId) return;
    try {
      await deleteJSON(
        `/api/trainers/${selectedTrainerId}/availabilities/${id}`,
        { token: session.token }
      );
      setAvailabilities((prev) => prev.filter((slot) => slot.id !== id));
      setTrainerMessage('Availability removed');
    } catch (err) {
      setTrainerMessage(
        err instanceof Error ? err.message : 'Failed to delete availability'
      );
    }
  };

  const handleSessionFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setSessionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSessionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.token) return;
    if (
      !sessionForm.trainerId ||
      !sessionForm.roomId ||
      !sessionForm.date ||
      !sessionForm.timeSlot
    ) {
      setSessionMessage('Trainer, room, date, and time slot are required');
      setSessionMessageTone('error');
      return;
    }

    const start = new Date(`${sessionForm.date}T${sessionForm.timeSlot}`);
    if (Number.isNaN(start.getTime())) {
      setSessionMessage('Please choose a valid date and time slot');
      setSessionMessageTone('error');
      return;
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    setSessionSaving(true);
    setSessionMessage(null);
    try {
      const payload = {
        trainerId: Number(sessionForm.trainerId),
        roomId: Number(sessionForm.roomId),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };
      await postJSON(
        `/api/members/${session.member.id}/sessions`,
        payload,
        { token: session.token }
      );
      setSessionForm({
        trainerId: '',
        roomId: '',
        date: '',
        timeSlot: '',
      });
      setSessionMessage('Session booked successfully');
      setSessionMessageTone('success');
      await loadMemberSessions();
    } catch (err) {
      setSessionMessage(
        err instanceof Error ? err.message : 'Failed to book session'
      );
      setSessionMessageTone('error');
    } finally {
      setSessionSaving(false);
    }
  };

  const isAuthenticated = Boolean(session?.token);
  const now = Date.now();
  const upcomingPtSessions = memberSessions.filter(
    (session) => new Date(session.endTime).getTime() >= now
  );
  const sessionSlotPreview = (() => {
    if (!sessionForm.date || !sessionForm.timeSlot) {
      return null;
    }
    const startPreview = new Date(`${sessionForm.date}T${sessionForm.timeSlot}`);
    if (Number.isNaN(startPreview.getTime())) {
      return null;
    }
    const endPreview = new Date(startPreview.getTime() + 60 * 60 * 1000);
    return {
      start: startPreview.toISOString(),
      end: endPreview.toISOString(),
    };
  })();

  return (
    <div className="page">
      <header>
        <h1>Health Club Console</h1>
        <p>
          Manage your personal data and trainer resources in one place.
        </p>
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
            <div className="section-tabs">
              {sections.map((section) => (
                <button
                  key={section.key}
                  className={
                    activeSection === section.key
                      ? 'section-tab active'
                      : 'section-tab'
                  }
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                >
                  {section.label}
                </button>
              ))}
              <button
                className="section-tab"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>

            {activeSection === 'profile' && (
              <section className="card">
                <div className="card-header">
                  <h2>Profile</h2>
                  <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={dashboardLoading}
                  >
                    Refresh
                  </button>
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
                            ? new Date(
                                profile.dateOfBirth
                              ).toLocaleDateString()
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
            )}

            {activeSection === 'goals' && (
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
            )}

            {activeSection === 'metrics' && (
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
            )}

            {activeSection === 'sessions' && (
              <section className="card">
                <div className="card-header">
                  <h2>PT Sessions</h2>
                  <button
                    type="button"
                    onClick={loadMemberSessions}
                    disabled={sessionsLoading}
                  >
                    {sessionsLoading ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
                {sessionMessage && (
                  <p className={`status ${sessionMessageTone}`}>
                    {sessionMessage}
                  </p>
                )}
                <h3>Upcoming Sessions</h3>
                {sessionsLoading && memberSessions.length === 0 ? (
                  <p>Loading sessions…</p>
                ) : upcomingPtSessions.length ? (
                  <ul className="list">
                    {upcomingPtSessions.map((session) => (
                      <li key={session.id}>
                        <strong>
                          {session.trainer?.name ??
                            (session.trainerId
                              ? `Trainer #${session.trainerId}`
                              : 'Trainer TBD')}
                        </strong>{' '}
                        ·{' '}
                        {session.room?.name
                          ? `Room ${session.room.name}`
                          : session.roomId
                          ? `Room #${session.roomId}`
                          : 'Room TBD'}{' '}
                        · {formatDate(session.startTime)}{' '}
                        {formatTime(session.startTime)} -{' '}
                        {formatTime(session.endTime)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No upcoming PT sessions.</p>
                )}
                <form className="stack" onSubmit={handleSessionSubmit}>
                  <h3>Book a Session</h3>
                  <label>
                    Trainer
                    <select
                      name="trainerId"
                      value={sessionForm.trainerId}
                      onChange={handleSessionFieldChange}
                      required
                    >
                      <option value="">Select trainer</option>
                      {trainers.map((trainer) => (
                        <option key={trainer.id} value={trainer.id}>
                          {trainer.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Room
                    <select
                      name="roomId"
                      value={sessionForm.roomId}
                      onChange={handleSessionFieldChange}
                      required
                    >
                      <option value="">Select room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} (Cap {room.capacity})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Date
                    <input
                      type="date"
                      name="date"
                      value={sessionForm.date}
                      onChange={handleSessionFieldChange}
                      required
                    />
                  </label>
                  <label>
                    Time Slot (1 hour)
                    <select
                      name="timeSlot"
                      value={sessionForm.timeSlot}
                      onChange={handleSessionFieldChange}
                      required
                    >
                      <option value="">Select time</option>
                      {PT_TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {formatSlotRange(slot)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {sessionSlotPreview && (
                    <p className="hint">
                      Session will run from {formatDate(sessionSlotPreview.start)}{' '}
                      {formatTime(sessionSlotPreview.start)} to{' '}
                      {formatTime(sessionSlotPreview.end)}
                    </p>
                  )}
                  <button type="submit" disabled={sessionSaving}>
                    {sessionSaving ? 'Booking…' : 'Book Session'}
                  </button>
                </form>
              </section>
            )}

            {activeSection === 'trainer' && (
              <section className="card">
                <h2>Trainer Tools</h2>
                {trainerMessage && (
                  <p className="status success">{trainerMessage}</p>
                )}
                <label>
                  Select Trainer
                  <select
                    value={selectedTrainerId ?? ''}
                    onChange={(e) =>
                      setSelectedTrainerId(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  >
                    {trainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name} ({trainer.email})
                      </option>
                    ))}
                  </select>
                </label>
                {trainerLoading && <p>Loading trainer data…</p>}
                {!trainerLoading && (
                  <>
                    <h3>Availabilities</h3>
                    {availabilities.length ? (
                      <ul className="list">
                        {availabilities.map((slot) => (
                          <li key={slot.id}>
                            <span>
                              {slot.type === 'WEEKLY'
                                ? `Weekly · ${weekdayName(
                                    slot.dayOfWeek
                                  )} ${formatTime(slot.startTime)} - ${formatTime(
                                    slot.endTime
                                  )}`
                                : `One-time · ${formatDate(slot.startDateTime)} ${formatTime(
                                    slot.startDateTime
                                  )} - ${formatDate(slot.endDateTime)} ${formatTime(
                                    slot.endDateTime
                                  )}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteAvailability(slot.id)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No availability slots yet.</p>
                    )}
                    <form className="stack" onSubmit={handleAddAvailability}>
                      <h3>Add Availability</h3>
                      <label>
                        Type
                        <select
                          name="type"
                          value={availabilityForm.type}
                          onChange={handleAvailabilityFieldChange}
                        >
                          <option value="WEEKLY">Weekly</option>
                          <option value="ONE_TIME">One-time</option>
                        </select>
                      </label>
                      {availabilityForm.type === 'WEEKLY' ? (
                        <>
                          <label>
                            Day of Week
                            <select
                              name="dayOfWeek"
                              value={availabilityForm.dayOfWeek}
                              onChange={handleAvailabilityFieldChange}
                            >
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                                (day, index) => (
                                  <option key={day} value={index}>
                                    {day}
                                  </option>
                                )
                              )}
                            </select>
                          </label>
                          <label>
                            Start Time
                            <input
                              type="time"
                              name="startTime"
                              value={availabilityForm.startTime}
                              onChange={handleAvailabilityFieldChange}
                              required
                            />
                          </label>
                          <label>
                            End Time
                            <input
                              type="time"
                              name="endTime"
                              value={availabilityForm.endTime}
                              onChange={handleAvailabilityFieldChange}
                              required
                            />
                          </label>
                        </>
                      ) : (
                        <>
                          <label>
                            Start Date & Time
                            <input
                              type="datetime-local"
                              name="startDateTime"
                              value={availabilityForm.startDateTime}
                              onChange={handleAvailabilityFieldChange}
                              required
                            />
                          </label>
                          <label>
                            End Date & Time
                            <input
                              type="datetime-local"
                              name="endDateTime"
                              value={availabilityForm.endDateTime}
                              onChange={handleAvailabilityFieldChange}
                              required
                            />
                          </label>
                        </>
                      )}
                      <button type="submit" disabled={trainerLoading}>
                        {trainerLoading ? 'Saving…' : 'Add Slot'}
                      </button>
                    </form>

                    <h3>Upcoming Schedule</h3>
                    {schedule ? (
                      schedule.sessions.length || schedule.classes.length ? (
                        <div className="schedule-grid">
                          {buildScheduleEntries(schedule).map((entry) => (
                            <div key={entry.id} className="schedule-card">
                              <span className={`badge ${entry.kind.toLowerCase()}`}>
                                {entry.kind === 'SESSION' ? 'PT Session' : 'Class'}
                              </span>
                              <h4>{entry.title}</h4>
                              <p>{entry.subTitle}</p>
                              <p className="time-range">
                                {formatDate(entry.startTime)} ·{' '}
                                {formatTime(entry.startTime)} -{' '}
                                {formatTime(entry.endTime)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No sessions or classes scheduled.</p>
                      )
                    ) : (
                      <p>No schedule data yet.</p>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function weekdayName(value: number | null): string {
  if (value == null) return 'N/A';
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][value] ?? 'N/A';
}

function formatDate(value: string | null): string {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString();
}

function formatTime(value: string | null): string {
  if (!value) return 'N/A';
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSlotRange(value: string): string {
  const date = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return value;
  const end = new Date(date.getTime() + 60 * 60 * 1000);
  return `${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function buildScheduleEntries(schedule: TrainerSchedule): ScheduleEntry[] {
  const sessionEntries: ScheduleEntry[] = schedule.sessions.map((session) => ({
    id: `session-${session.id}`,
    kind: 'SESSION',
    title: session.member?.name ?? `Member #${session.memberId}`,
    subTitle: session.room?.name ?? (session.roomId ? `Room #${session.roomId}` : 'Room TBD'),
    startTime: session.startTime,
    endTime: session.endTime,
  }));

  const classEntries: ScheduleEntry[] = schedule.classes.map((cls) => ({
    id: `class-${cls.id}`,
    kind: 'CLASS',
    title: cls.name,
    subTitle: `Room ${cls.roomId} · Capacity ${cls.capacity}`,
    startTime: cls.startTime,
    endTime: cls.endTime,
  }));

  return [...sessionEntries, ...classEntries].sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

export default App;
