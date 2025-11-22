import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { postJSON } from './api/client';

type MemberPayload = {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
};

type Member = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  createdAt: string;
};

const emptyForm: MemberPayload = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
};

function App() {
  const [form, setForm] = useState<MemberPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMember, setCreatedMember] = useState<Member | null>(null);

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

  return (
    <div className="page">
      <header>
        <h1>Member Registration</h1>
        <p>Use this form to add a new member to the database.</p>
      </header>

      <main>
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
      </main>
    </div>
  );
}

export default App;
