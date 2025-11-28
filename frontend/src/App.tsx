//time stamp on metric
// edit goals.



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
  isRegistered: boolean;
};

type ClassRegistrationWithClass = {
  id: number;
  memberId: number;
  fitnessClassId: number;
  registeredAt: string;
  fitnessClass: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    trainerId: number;
    roomId: number;
    capacity: number;
  };
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

type SectionKey = 'profile' | 'goals' | 'metrics' | 'sessions' | 'trainer' | 'classes';

const sections: { key: SectionKey; label: string; icon: string }[] = [
  { key: 'profile', label: 'Profile', icon: '👤' },
  { key: 'goals', label: 'Fitness Goals', icon: '🎯' },
  { key: 'metrics', label: 'Health Metrics', icon: '📊' },
  { key: 'sessions', label: 'PT Sessions', icon: '🏋️' },
  { key: 'classes', label: 'Group Classes', icon: '👥' },
  { key: 'trainer', label: 'Trainer Tools', icon: '🔧' },
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

// Same slots for trainer availability
const AVAILABILITY_TIME_SLOTS = PT_TIME_SLOTS;

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
  // null = show dashboard, otherwise show overlay for that section
  const [activeOverlay, setActiveOverlay] = useState<SectionKey | null>(null);

  const [loginForm, setLoginForm] = useState<LoginPayload>(emptyLoginForm);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
  });
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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
    // One-time: date + start hour slot (end auto-calculated)
    oneTimeDate: '',
    oneTimeStartHour: '',
  });
  const [trainerLoading, setTrainerLoading] = useState(false);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [memberSessions, setMemberSessions] = useState<MemberSessionDetail[]>(
    []
  );
  // Date-first booking flow
  const [bookingDate, setBookingDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<
    { trainerId: number; trainerName: string; startTime: string; endTime: string }[]
  >([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    trainerId: number;
    trainerName: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [bookingRoomId, setBookingRoomId] = useState('');
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [sessionMessageTone, setSessionMessageTone] = useState<
    'success' | 'error'
  >('success');
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionSaving, setSessionSaving] = useState(false);
  // Reschedule state
  const [rescheduleSessionId, setRescheduleSessionId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<
    { trainerId: number; trainerName: string; startTime: string; endTime: string }[]
  >([]);
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState<{
    trainerId: number;
    trainerName: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [rescheduleRoomId, setRescheduleRoomId] = useState('');
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);

  // Group classes state
  const [fitnessClasses, setFitnessClasses] = useState<FitnessClassWithDetails[]>([]);
  const [classRegistrations, setClassRegistrations] = useState<ClassRegistrationWithClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classActionLoading, setClassActionLoading] = useState<number | null>(null);
  const [classMessage, setClassMessage] = useState<string | null>(null);
  const [classMessageTone, setClassMessageTone] = useState<'success' | 'error'>('success');

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
      loadFitnessClasses();
    } else {
      setProfile(null);
      setGoals([]);
      setMetrics([]);
      setTrainers([]);
      setAvailabilities([]);
      setSchedule(null);
      setRooms([]);
      setMemberSessions([]);
      setFitnessClasses([]);
      setClassRegistrations([]);
      setBookingDate('');
      setAvailableSlots([]);
      setSelectedSlot(null);
      setBookingRoomId('');
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

  const loadAvailableSlots = async (date: string) => {
    if (!session?.token || !date) {
      setAvailableSlots([]);
      return;
    }
    setSlotsLoading(true);
    try {
      const data = await getJSON<{
        date: string;
        slots: { trainerId: number; trainerName: string; startTime: string; endTime: string }[];
      }>(`/api/trainers/available-slots?date=${date}`, { token: session.token });
      setAvailableSlots(data.slots);
    } catch (err) {
      console.error('Failed to load available slots', err);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const loadFitnessClasses = async () => {
    if (!session?.token) return;
    setClassesLoading(true);
    try {
      const [classes, registrations] = await Promise.all([
        getJSON<FitnessClassWithDetails[]>(
          `/api/members/${session.member.id}/classes`,
          { token: session.token }
        ),
        getJSON<ClassRegistrationWithClass[]>(
          `/api/members/${session.member.id}/class-registrations`,
          { token: session.token }
        ),
      ]);
      setFitnessClasses(classes);
      setClassRegistrations(registrations);
    } catch (err) {
      console.error('Failed to load fitness classes', err);
    } finally {
      setClassesLoading(false);
    }
  };

  const handleRegisterForClass = async (classId: number) => {
    if (!session?.token) return;
    setClassActionLoading(classId);
    setClassMessage(null);
    try {
      await postJSON(
        `/api/members/${session.member.id}/class-registrations`,
        { fitnessClassId: classId },
        { token: session.token }
      );
      setClassMessage('Successfully registered for class!');
      setClassMessageTone('success');
      await loadFitnessClasses();
    } catch (err) {
      setClassMessage(err instanceof Error ? err.message : 'Failed to register');
      setClassMessageTone('error');
    } finally {
      setClassActionLoading(null);
    }
  };

  const handleCancelClassRegistration = async (registrationId: number) => {
    if (!session?.token) return;
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    setClassActionLoading(registrationId);
    setClassMessage(null);
    try {
      await deleteJSON(
        `/api/members/${session.member.id}/class-registrations/${registrationId}`,
        { token: session.token }
      );
      setClassMessage('Registration cancelled.');
      setClassMessageTone('success');
      await loadFitnessClasses();
    } catch (err) {
      setClassMessage(err instanceof Error ? err.message : 'Failed to cancel');
      setClassMessageTone('error');
    } finally {
      setClassActionLoading(null);
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

  const handleRegisterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterSubmitting(true);
    setRegisterMessage(null);
    try {
      const payload: Record<string, unknown> = {
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
      };
      if (registerForm.phone.trim()) {
        payload.phone = registerForm.phone.trim();
      }
      if (registerForm.dateOfBirth) {
        payload.dateOfBirth = registerForm.dateOfBirth;
      }
      await postJSON('/api/members', payload);
      setRegisterMessage({
        type: 'success',
        text: 'Registration successful! You can now log in.',
      });
      setRegisterForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        dateOfBirth: '',
      });
      // Switch back to login after short delay
      setTimeout(() => setShowRegister(false), 1500);
    } catch (err) {
      setRegisterMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Registration failed',
      });
    } finally {
      setRegisterSubmitting(false);
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
        // One-time: build start/end from date + hour slot
        if (!availabilityForm.oneTimeDate || !availabilityForm.oneTimeStartHour) {
          setTrainerMessage('Date and time slot are required');
          setTrainerLoading(false);
          return;
        }
        const start = new Date(
          `${availabilityForm.oneTimeDate}T${availabilityForm.oneTimeStartHour}`
        );
        if (Number.isNaN(start.getTime())) {
          setTrainerMessage('Invalid date or time');
          setTrainerLoading(false);
          return;
        }
        const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
        payload.startDateTime = start.toISOString();
        payload.endDateTime = end.toISOString();
      }
      const created = await postJSON<TrainerAvailability>(
        `/api/trainers/${selectedTrainerId}/availabilities`,
        payload,
        { token: session.token }
      );
      setAvailabilities((prev) => [...prev, created]);
      setTrainerMessage('Availability added');
      // Reset form
      setAvailabilityForm((prev) => ({
        ...prev,
        oneTimeDate: '',
        oneTimeStartHour: '',
      }));
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

  const handleBookingDateChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const date = event.target.value;
    setBookingDate(date);
    setSelectedSlot(null);
    setBookingRoomId('');
    if (date) {
      await loadAvailableSlots(date);
    } else {
      setAvailableSlots([]);
    }
  };

  const handleSlotSelect = (slot: {
    trainerId: number;
    trainerName: string;
    startTime: string;
    endTime: string;
  }) => {
    setSelectedSlot(slot);
    setBookingRoomId('');
  };

  const handleBookSession = async () => {
    if (!session?.token || !selectedSlot || !bookingRoomId || !bookingDate) {
      setSessionMessage('Please select a slot and room');
      setSessionMessageTone('error');
      return;
    }

    setSessionSaving(true);
    setSessionMessage(null);
    try {
      const startISO = `${bookingDate}T${selectedSlot.startTime}:00`;
      const endISO = `${bookingDate}T${selectedSlot.endTime}:00`;

      const payload = {
        trainerId: selectedSlot.trainerId,
        roomId: Number(bookingRoomId),
        startTime: startISO,
        endTime: endISO,
      };
      await postJSON(
        `/api/members/${session.member.id}/sessions`,
        payload,
        { token: session.token }
      );
      setSessionMessage('Session booked successfully!');
      setSessionMessageTone('success');
      // Reset form
      setBookingDate('');
      setAvailableSlots([]);
      setSelectedSlot(null);
      setBookingRoomId('');
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

  const handleCancelSession = async (sessionId: number) => {
    if (!session?.token) return;
    if (!confirm('Are you sure you want to cancel this session?')) return;

    setSessionSaving(true);
    setSessionMessage(null);
    try {
      await deleteJSON(
        `/api/members/${session.member.id}/sessions/${sessionId}`,
        { token: session.token }
      );
      setSessionMessage('Session cancelled successfully.');
      setSessionMessageTone('success');
      await loadMemberSessions();
    } catch (err) {
      setSessionMessage(
        err instanceof Error ? err.message : 'Failed to cancel session'
      );
      setSessionMessageTone('error');
    } finally {
      setSessionSaving(false);
    }
  };

  const handleStartReschedule = (sessionId: number) => {
    setRescheduleSessionId(sessionId);
    setRescheduleDate('');
    setRescheduleSlots([]);
    setRescheduleSelectedSlot(null);
    setRescheduleRoomId('');
  };

  const handleCancelReschedule = () => {
    setRescheduleSessionId(null);
    setRescheduleDate('');
    setRescheduleSlots([]);
    setRescheduleSelectedSlot(null);
    setRescheduleRoomId('');
  };

  const loadRescheduleSlots = async (date: string) => {
    if (!session?.token || !date) {
      setRescheduleSlots([]);
      return;
    }
    setRescheduleSlotsLoading(true);
    try {
      const data = await getJSON<{
        date: string;
        slots: { trainerId: number; trainerName: string; startTime: string; endTime: string }[];
      }>(`/api/trainers/available-slots?date=${date}`, { token: session.token });
      setRescheduleSlots(data.slots);
    } catch (err) {
      console.error('Failed to load reschedule slots', err);
      setRescheduleSlots([]);
    } finally {
      setRescheduleSlotsLoading(false);
    }
  };

  const handleRescheduleDateChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const date = event.target.value;
    setRescheduleDate(date);
    setRescheduleSelectedSlot(null);
    setRescheduleRoomId('');
    if (date) {
      await loadRescheduleSlots(date);
    } else {
      setRescheduleSlots([]);
    }
  };

  const handleRescheduleSlotSelect = (slot: {
    trainerId: number;
    trainerName: string;
    startTime: string;
    endTime: string;
  }) => {
    setRescheduleSelectedSlot(slot);
    setRescheduleRoomId('');
  };

  const handleConfirmReschedule = async () => {
    if (!session?.token || !rescheduleSessionId || !rescheduleSelectedSlot || !rescheduleRoomId || !rescheduleDate) {
      setSessionMessage('Please select a new slot and room');
      setSessionMessageTone('error');
      return;
    }

    setSessionSaving(true);
    setSessionMessage(null);
    try {
      const startISO = `${rescheduleDate}T${rescheduleSelectedSlot.startTime}:00`;
      const endISO = `${rescheduleDate}T${rescheduleSelectedSlot.endTime}:00`;

      const payload = {
        trainerId: rescheduleSelectedSlot.trainerId,
        roomId: Number(rescheduleRoomId),
        startTime: startISO,
        endTime: endISO,
      };
      await patchJSON(
        `/api/members/${session.member.id}/sessions/${rescheduleSessionId}`,
        payload,
        { token: session.token }
      );
      setSessionMessage('Session rescheduled successfully!');
      setSessionMessageTone('success');
      handleCancelReschedule();
      await loadMemberSessions();
    } catch (err) {
      setSessionMessage(
        err instanceof Error ? err.message : 'Failed to reschedule session'
      );
      setSessionMessageTone('error');
    } finally {
      setSessionSaving(false);
    }
  };

  const isAuthenticated = Boolean(session?.token);
  const now = Date.now();
  const upcomingPtSessions = memberSessions.filter(
    (s) => new Date(s.endTime).getTime() >= now
  );

  // Group available slots by time for display
  const slotsByTime = availableSlots.reduce((acc, slot) => {
    const key = `${slot.startTime}-${slot.endTime}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(slot);
    return acc;
  }, {} as Record<string, typeof availableSlots>);

  // Group reschedule slots by time
  const rescheduleSlotsByTime = rescheduleSlots.reduce((acc, slot) => {
    const key = `${slot.startTime}-${slot.endTime}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(slot);
    return acc;
  }, {} as Record<string, typeof rescheduleSlots>);

  // Preview for selected slot
  const selectedSlotPreview = selectedSlot && bookingDate ? {
    start: `${bookingDate}T${selectedSlot.startTime}`,
    end: `${bookingDate}T${selectedSlot.endTime}`,
  } : null;

  return (
    <div className="page">
      <header>
        <h1>Health Club Dashboard</h1>
        <p>
          Manage your personal data and trainer resources in one place.
        </p>
      </header>

      <main>
        {!isAuthenticated && (
          <section className="card">
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${!showRegister ? 'active' : ''}`}
                onClick={() => {
                  setShowRegister(false);
                  setRegisterMessage(null);
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={`auth-tab ${showRegister ? 'active' : ''}`}
                onClick={() => {
                  setShowRegister(true);
                  setLoginError(null);
                }}
              >
                Register
              </button>
            </div>

            {!showRegister ? (
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
              <form onSubmit={handleRegisterSubmit} className="stack">
                <label>
                  Name *
                  <input
                    name="name"
                    type="text"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    required
                    placeholder="Jane Doe"
                  />
                </label>
                <label>
                  Email *
                  <input
                    name="email"
                    type="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    required
                    placeholder="jane@example.com"
                  />
                </label>
                <label>
                  Password *
                  <input
                    name="password"
                    type="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    required
                    minLength={4}
                  />
                </label>
                <label>
                  Phone
                  <input
                    name="phone"
                    type="tel"
                    value={registerForm.phone}
                    onChange={handleRegisterChange}
                    placeholder="555-1234"
                  />
                </label>
                <label>
                  Date of Birth
                  <input
                    name="dateOfBirth"
                    type="date"
                    value={registerForm.dateOfBirth}
                    onChange={handleRegisterChange}
                  />
                </label>
                <button type="submit" disabled={registerSubmitting}>
                  {registerSubmitting ? 'Registering…' : 'Create Account'}
                </button>
                {registerMessage && (
                  <p className={`status ${registerMessage.type}`}>
                    {registerMessage.text}
                  </p>
                )}
              </form>
            )}
          </section>
        )}

        {isAuthenticated && (
          <>
            {/* Dashboard - always visible when authenticated */}
            <div className="dashboard">
              <div className="dashboard-header">
                <h2>Welcome back, {profile?.name ?? session?.member?.name ?? 'Member'}!</h2>
                <button type="button" className="btn-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>

              {/* Quick Stats Cards */}
              <div className="dashboard-stats">
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <div className="stat-value">{goals.filter(g => g.active).length}</div>
                    <div className="stat-label">Active Goals</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-value">{metrics.length}</div>
                    <div className="stat-label">Health Metrics</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏋️</div>
                  <div className="stat-content">
                    <div className="stat-value">{upcomingPtSessions.length}</div>
                    <div className="stat-label">Upcoming Sessions</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {memberSessions.filter(s => new Date(s.endTime).getTime() < now).length}
                    </div>
                    <div className="stat-label">Past Sessions</div>
                  </div>
                </div>
              </div>

              {/* Latest Health Metric */}
              {metrics.length > 0 && (
                <div className="dashboard-section">
                  <h3>Latest Health Metric</h3>
                  <div className="latest-metric">
                    <strong>{metrics[metrics.length - 1].metricType}</strong>:{' '}
                    {metrics[metrics.length - 1].value}
                    {metrics[metrics.length - 1].unit && ` ${metrics[metrics.length - 1].unit}`}
                    <span className="metric-date">
                      {metrics[metrics.length - 1].recordedAt
                        ? ` (${formatDate(metrics[metrics.length - 1].recordedAt!)})`
                        : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Active Goals Preview */}
              {goals.filter(g => g.active).length > 0 && (
                <div className="dashboard-section">
                  <h3>Active Goals</h3>
                  <ul className="goals-preview">
                    {goals.filter(g => g.active).slice(0, 3).map(goal => (
                      <li key={goal.id}>{goal.value}</li>
                    ))}
                    {goals.filter(g => g.active).length > 3 && (
                      <li className="more-link" onClick={() => setActiveOverlay('goals')}>
                        +{goals.filter(g => g.active).length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Upcoming Sessions Preview */}
              {upcomingPtSessions.length > 0 && (
                <div className="dashboard-section">
                  <h3>Upcoming Sessions</h3>
                  <ul className="sessions-preview">
                    {upcomingPtSessions.slice(0, 3).map(s => (
                      <li key={s.id}>
                        <strong>{s.trainer?.name ?? 'Trainer TBD'}</strong> ·{' '}
                        {formatDate(s.startTime)} {formatTime(s.startTime)}
                      </li>
                    ))}
                    {upcomingPtSessions.length > 3 && (
                      <li className="more-link" onClick={() => setActiveOverlay('sessions')}>
                        +{upcomingPtSessions.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Quick Actions */}
              <div className="dashboard-actions">
                <h3>Quick Actions</h3>
                <div className="action-grid">
                  {sections.map((section) => (
                    <button
                      key={section.key}
                      type="button"
                      className="action-card"
                      onClick={() => setActiveOverlay(section.key)}
                    >
                      <span className="action-icon">{section.icon}</span>
                      <span className="action-label">{section.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Overlay Modal for Sections */}
            {activeOverlay && (
              <div className="overlay-backdrop" onClick={() => setActiveOverlay(null)}>
                <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="overlay-close"
                    onClick={() => setActiveOverlay(null)}
                  >
                    ×
                  </button>

                  {activeOverlay === 'profile' && (
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

            {activeOverlay === 'goals' && (
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

            {activeOverlay === 'metrics' && (
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

            {activeOverlay === 'sessions' && (
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
                  <ul className="session-list">
                    {upcomingPtSessions.map((s) => (
                      <li key={s.id} className="session-item">
                        <div className="session-info">
                          <strong>
                            {s.trainer?.name ??
                              (s.trainerId
                                ? `Trainer #${s.trainerId}`
                                : 'Trainer TBD')}
                          </strong>{' '}
                          ·{' '}
                          {s.room?.name
                            ? `${s.room.name}`
                            : s.roomId
                            ? `Room #${s.roomId}`
                            : 'Room TBD'}{' '}
                          · {formatDate(s.startTime)}{' '}
                          {formatTime(s.startTime)} -{' '}
                          {formatTime(s.endTime)}
                        </div>
                        <div className="session-actions">
                          <button
                            type="button"
                            className="btn-small btn-secondary"
                            onClick={() => handleStartReschedule(s.id)}
                            disabled={sessionSaving || rescheduleSessionId === s.id}
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="btn-small btn-danger"
                            onClick={() => handleCancelSession(s.id)}
                            disabled={sessionSaving}
                          >
                            Cancel
                          </button>
                        </div>
                        {rescheduleSessionId === s.id && (
                          <div className="reschedule-form">
                            <h4>Reschedule Session</h4>
                            <label>
                              New Date
                              <input
                                type="date"
                                value={rescheduleDate}
                                onChange={handleRescheduleDateChange}
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </label>
                            {rescheduleDate && (
                              <>
                                <h5>Available Slots</h5>
                                {rescheduleSlotsLoading ? (
                                  <p>Loading slots…</p>
                                ) : rescheduleSlots.length === 0 ? (
                                  <p className="hint">No trainers available on this date.</p>
                                ) : (
                                  <div className="slots-grid compact">
                                    {Object.entries(rescheduleSlotsByTime).map(([timeKey, slots]) => (
                                      <div key={timeKey} className="time-group">
                                        <div className="time-group-header">
                                          {formatSlotRange(slots[0].startTime)}
                                        </div>
                                        <div className="time-group-trainers">
                                          {slots.map((slot) => (
                                            <button
                                              key={`${slot.trainerId}-${slot.startTime}`}
                                              type="button"
                                              className={`slot-btn ${
                                                rescheduleSelectedSlot?.trainerId === slot.trainerId &&
                                                rescheduleSelectedSlot?.startTime === slot.startTime
                                                  ? 'selected'
                                                  : ''
                                              }`}
                                              onClick={() => handleRescheduleSlotSelect(slot)}
                                            >
                                              {slot.trainerName}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                            {rescheduleSelectedSlot && (
                              <>
                                <label>
                                  Room
                                  <select
                                    value={rescheduleRoomId}
                                    onChange={(e) => setRescheduleRoomId(e.target.value)}
                                  >
                                    <option value="">Select room</option>
                                    {rooms.map((room) => (
                                      <option key={room.id} value={room.id}>
                                        {room.name} (Cap {room.capacity})
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </>
                            )}
                            <div className="reschedule-actions">
                              <button
                                type="button"
                                onClick={handleConfirmReschedule}
                                disabled={sessionSaving || !rescheduleSelectedSlot || !rescheduleRoomId}
                              >
                                {sessionSaving ? 'Saving…' : 'Confirm Reschedule'}
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCancelReschedule}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No upcoming PT sessions.</p>
                )}
                <div className="booking-flow">
                  <h3>Book a Session</h3>
                  
                  {/* Step 1: Pick a date */}
                  <label>
                    1. Choose a Date
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={handleBookingDateChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </label>

                  {/* Step 2: Show available slots */}
                  {bookingDate && (
                    <>
                      <h4>2. Available Trainers & Slots</h4>
                      {slotsLoading ? (
                        <p>Loading available slots…</p>
                      ) : availableSlots.length === 0 ? (
                        <p className="hint">No trainers available on this date.</p>
                      ) : (
                        <div className="slots-grid">
                          {Object.entries(slotsByTime).map(([timeKey, slots]) => (
                            <div key={timeKey} className="time-group">
                              <div className="time-group-header">
                                {formatSlotRange(slots[0].startTime)}
                              </div>
                              <div className="time-group-trainers">
                                {slots.map((slot) => (
                                  <button
                                    key={`${slot.trainerId}-${slot.startTime}`}
                                    type="button"
                                    className={`slot-btn ${
                                      selectedSlot?.trainerId === slot.trainerId &&
                                      selectedSlot?.startTime === slot.startTime
                                        ? 'selected'
                                        : ''
                                    }`}
                                    onClick={() => handleSlotSelect(slot)}
                                  >
                                    {slot.trainerName}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Step 3: Select room */}
                  {selectedSlot && (
                    <>
                      <h4>3. Select Room</h4>
                      <p className="hint">
                        Booking with <strong>{selectedSlot.trainerName}</strong> at{' '}
                        {formatSlotRange(selectedSlot.startTime)}
                      </p>
                      <label>
                        Room
                        <select
                          value={bookingRoomId}
                          onChange={(e) => setBookingRoomId(e.target.value)}
                        >
                          <option value="">Select room</option>
                          {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.name} (Cap {room.capacity})
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}

                  {/* Step 4: Confirm */}
                  {selectedSlot && bookingRoomId && (
                    <>
                      {selectedSlotPreview && (
                        <p className="booking-summary">
                          <strong>Summary:</strong> {selectedSlot.trainerName} on{' '}
                          {formatDate(selectedSlotPreview.start)},{' '}
                          {formatSlotRange(selectedSlot.startTime)} in{' '}
                          {rooms.find((r) => r.id === Number(bookingRoomId))?.name}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handleBookSession}
                        disabled={sessionSaving}
                      >
                        {sessionSaving ? 'Booking…' : 'Confirm Booking'}
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}

            {activeOverlay === 'trainer' && (
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
                    <h3>Weekly Availability</h3>
                    {(() => {
                      const weeklySlots = availabilities.filter(
                        (a) => a.type === 'WEEKLY'
                      );
                      const oneTimeSlots = availabilities.filter(
                        (a) => a.type === 'ONE_TIME'
                      );
                      const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                      return (
                        <>
                          <div className="weekly-grid">
                            {DAYS.map((day, idx) => {
                              const daySlots = weeklySlots.filter(
                                (s) => s.dayOfWeek === idx
                              );
                              return (
                                <div key={day} className="weekly-day">
                                  <div className="weekly-day-header">{day}</div>
                                  <div className="weekly-day-slots">
                                    {daySlots.length ? (
                                      daySlots.map((slot) => (
                                        <div
                                          key={slot.id}
                                          className="weekly-slot"
                                        >
                                          <span className="slot-time">
                                            {formatTimeShort(slot.startTime, true)} -{' '}
                                            {formatTimeShort(slot.endTime, true)}
                                          </span>
                                          <button
                                            type="button"
                                            className="slot-remove"
                                            onClick={() =>
                                              handleDeleteAvailability(slot.id)
                                            }
                                            title="Remove"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))
                                    ) : (
                                      <span className="no-slots">—</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {oneTimeSlots.length > 0 && (
                            <>
                              <h4>One-Time Slots</h4>
                              <ul className="onetime-list">
                                {oneTimeSlots.map((slot) => (
                                  <li key={slot.id} className="onetime-slot">
                                    <span>
                                      {formatDate(slot.startDateTime)}{' '}
                                      {formatTimeShort(slot.startDateTime)} -{' '}
                                      {formatTimeShort(slot.endDateTime)}
                                    </span>
                                    <button
                                      type="button"
                                      className="slot-remove"
                                      onClick={() =>
                                        handleDeleteAvailability(slot.id)
                                      }
                                    >
                                      ×
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}

                          {availabilities.length === 0 && (
                            <p className="hint">
                              No availability set. Add weekly or one-time slots
                              below.
                            </p>
                          )}
                        </>
                      );
                    })()}
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
                            Date
                            <input
                              type="date"
                              name="oneTimeDate"
                              value={availabilityForm.oneTimeDate}
                              onChange={handleAvailabilityFieldChange}
                              required
                            />
                          </label>
                          <label>
                            Time Slot (1 hour)
                            <select
                              name="oneTimeStartHour"
                              value={availabilityForm.oneTimeStartHour}
                              onChange={handleAvailabilityFieldChange}
                              required
                            >
                              <option value="">Select time</option>
                              {AVAILABILITY_TIME_SLOTS.map((slot) => (
                                <option key={slot} value={slot}>
                                  {formatSlotRange(slot)}
                                </option>
                              ))}
                            </select>
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

                  {activeOverlay === 'classes' && (
                    <section className="card">
                      <div className="card-header">
                        <h2>Group Classes</h2>
                        <button
                          type="button"
                          onClick={loadFitnessClasses}
                          disabled={classesLoading}
                        >
                          {classesLoading ? 'Refreshing…' : 'Refresh'}
                        </button>
                      </div>

                      {classMessage && (
                        <p className={`status ${classMessageTone}`}>{classMessage}</p>
                      )}

                      {/* My Registrations */}
                      {classRegistrations.filter(r => new Date(r.fitnessClass.startTime) > new Date()).length > 0 && (
                        <div className="my-registrations">
                          <h3>Your Registered Classes</h3>
                          <ul className="registration-list">
                            {classRegistrations
                              .filter(r => new Date(r.fitnessClass.startTime) > new Date())
                              .map((reg) => (
                                <li key={reg.id} className="registration-item">
                                  <div className="registration-info">
                                    <strong>{reg.fitnessClass.name}</strong>
                                    <span>
                                      {formatDate(reg.fitnessClass.startTime)} ·{' '}
                                      {formatTime(reg.fitnessClass.startTime)} -{' '}
                                      {formatTime(reg.fitnessClass.endTime)}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn-small btn-danger"
                                    onClick={() => handleCancelClassRegistration(reg.id)}
                                    disabled={classActionLoading === reg.id}
                                  >
                                    {classActionLoading === reg.id ? '…' : 'Cancel'}
                                  </button>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}

                      {/* Available Classes */}
                      <h3>Available Classes</h3>
                      {classesLoading && fitnessClasses.length === 0 ? (
                        <p>Loading classes…</p>
                      ) : fitnessClasses.length === 0 ? (
                        <p className="hint">No upcoming classes available.</p>
                      ) : (
                        <div className="classes-by-day">
                          {Object.entries(
                            fitnessClasses.reduce((acc, cls) => {
                              const dateKey = new Date(cls.startTime).toDateString();
                              if (!acc[dateKey]) acc[dateKey] = [];
                              acc[dateKey].push(cls);
                              return acc;
                            }, {} as Record<string, FitnessClassWithDetails[]>)
                          ).map(([dateKey, classes]) => (
                            <div key={dateKey} className="day-group">
                              <h4 className="day-header">
                                📅 {new Date(dateKey).toLocaleDateString(undefined, {
                                  weekday: 'long',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </h4>
                              <div className="class-cards">
                                {classes.map((cls) => {
                                  const isFull = cls.registrationCount >= cls.capacity;
                                  const spotsLeft = cls.capacity - cls.registrationCount;
                                  return (
                                    <div
                                      key={cls.id}
                                      className={`class-card ${cls.isRegistered ? 'registered' : ''} ${isFull ? 'full' : ''}`}
                                    >
                                      <div className="class-name">{cls.name}</div>
                                      <div className="class-time">
                                        {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                      </div>
                                      <div className="class-details">
                                        <span>👤 {cls.trainer.name}</span>
                                        <span>📍 {cls.room.name}</span>
                                      </div>
                                      <div className={`class-capacity ${isFull ? 'full' : ''}`}>
                                        {isFull
                                          ? `FULL (${cls.capacity}/${cls.capacity})`
                                          : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                                      </div>
                                      {cls.isRegistered ? (
                                        <div className="registered-badge">✓ Registered</div>
                                      ) : isFull ? (
                                        <button type="button" className="btn-full" disabled>
                                          Full
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          className="btn-register"
                                          onClick={() => handleRegisterForClass(cls.id)}
                                          disabled={classActionLoading === cls.id}
                                        >
                                          {classActionLoading === cls.id ? 'Registering…' : 'Register'}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
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

function formatTimeShort(value: string | null, useUtc = false): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  // For weekly availability, times are stored as UTC (1970-01-01T...Z)
  // so we need to read UTC hours/minutes to display correctly
  const h = useUtc ? d.getUTCHours() : d.getHours();
  const m = useUtc ? d.getUTCMinutes() : d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${m.toString().padStart(2, '0')}${ampm}`;
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
