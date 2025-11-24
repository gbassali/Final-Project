import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { postJSON } from './api/client';

type MemberPayload = {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  password: string;
};

type Member = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  createdAt: string;
};

type MemberSummary = {
  id: number;
  name: string;
  email: string;
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

const emptyForm: MemberPayload = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  password: '',
};

const emptyLoginForm: LoginPayload = {
  email: '',
  password: '',
};

type TabKey = 'register' | 'login' | 'members' | 'goals' | 'metrics';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'register', label: 'Register Member' },
  { key: 'login', label: 'Login' },
  { key: 'members', label: 'Members' },
  { key: 'goals', label: 'Fitness Goals' },
  { key: 'metrics', label: 'Health Metrics' },
];

const SESSION_KEY = 'member-session';

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('register');
  const [form, setForm] = useState<MemberPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMember, setCreatedMember] = useState<Member | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [loginForm, setLoginForm] = useState<LoginPayload>(emptyLoginForm);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: MemberPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      password: form.password.trim(),
    };

    try {
      const member = await postJSON<Member>('/api/members', payload);
      setCreatedMember(member);
      setForm(emptyForm);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create member';
      setError(message);
    } finally {
      setSubmitting(false);
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

  return (
    <div className="page">
      <header>
        <h1>Member & Profile Console</h1>
        <p>Manage members, fitness goals, and health metrics.</p>
      </header>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={tab.key === activeTab ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main>
        {activeTab === 'register' && (
          <>
            <form className="card" onSubmit={handleSubmit}>
              <label>
                Name
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Jane Doe"
                />
              </label>

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="jane@example.com"
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />
              </label>

              <label>
                Phone
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="555-1234"
                />
              </label>

              <label>
                Date of Birth
                <input
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                />
              </label>

              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Register Member'}
              </button>

              {error && <p className="status error">{error}</p>}
              {createdMember && !error && (
                <p className="status success">
                  Member #{createdMember.id} created successfully.
                </p>
              )}
            </form>

            {createdMember && (
              <section className="card">
                <h2>Last Created Member</h2>
                <dl>
                  <div>
                    <dt>Name</dt>
                    <dd>{createdMember.name}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{createdMember.email}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{createdMember.phone ?? 'N/A'}</dd>
                  </div>
                  <div>
                    <dt>Date of Birth</dt>
                    <dd>
                      {createdMember.dateOfBirth
                        ? new Date(createdMember.dateOfBirth).toLocaleDateString()
                        : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt>Created At</dt>
                    <dd>
                      {new Date(createdMember.createdAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </section>
            )}
          </>
        )}
        {activeTab === 'login' && (
          <section className="card">
            <h2>Member Login</h2>
            {!isAuthenticated ? (
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
            ) : (
              <>
                <p>
                  You are logged in as{' '}
                  {session?.member?.name ?? session?.member?.email}.
                </p>
                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </section>
        )}
        {activeTab !== 'register' && activeTab !== 'login' && (
          <section className="card">
            <h2>{tabs.find((t) => t.key === activeTab)?.label}</h2>
            {isAuthenticated ? (
              <p>UI coming soon.</p>
            ) : (
              <p>Please log in to access this section.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
