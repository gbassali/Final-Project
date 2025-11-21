import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.classRegistration.deleteMany();
  await prisma.fitnessClass.deleteMany();
  await prisma.session.deleteMany();
  await prisma.trainerAvailability.deleteMany();
  await prisma.fitnessGoals.deleteMany();
  await prisma.healthMetric.deleteMany();
  await prisma.member.deleteMany();
  await prisma.trainer.deleteMany();
  await prisma.adminStaff.deleteMany();
  await prisma.room.deleteMany();

  // ============================================
  // 1. ADMIN STAFF
  // ============================================
  console.log('👔 Creating admin staff...');
  const admin1 = await prisma.adminStaff.create({
    data: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@fitness.com',
    },
  });
  const admin2 = await prisma.adminStaff.create({
    data: {
      name: 'Michael Chen',
      email: 'michael.chen@fitness.com',
    },
  });

  // ============================================
  // 2. ROOMS
  // ============================================
  console.log('🏠 Creating rooms...');
  const room1 = await prisma.room.create({
    data: {
      name: 'Main Studio',
      capacity: 30,
    },
  });
  const room2 = await prisma.room.create({
    data: {
      name: 'Yoga Room',
      capacity: 20,
    },
  });
  const room3 = await prisma.room.create({
    data: {
      name: 'Cardio Room',
      capacity: 25,
    },
  });
  const room4 = await prisma.room.create({
    data: {
      name: 'Private Training Room A',
      capacity: 2,
    },
  });
  const room5 = await prisma.room.create({
    data: {
      name: 'Private Training Room B',
      capacity: 2,
    },
  });
  const room6 = await prisma.room.create({
    data: {
      name: 'Spin Studio',
      capacity: 15,
    },
  });

  // ============================================
  // 3. TRAINERS
  // ============================================
  console.log('💪 Creating trainers...');
  const trainer1 = await prisma.trainer.create({
    data: {
      name: 'Alex Martinez',
      email: 'alex.martinez@fitness.com',
      phone: '555-0101',
    },
  });
  const trainer2 = await prisma.trainer.create({
    data: {
      name: 'Jordan Smith',
      email: 'jordan.smith@fitness.com',
      phone: '555-0102',
    },
  });
  const trainer3 = await prisma.trainer.create({
    data: {
      name: 'Taylor Brown',
      email: 'taylor.brown@fitness.com',
      phone: '555-0103',
    },
  });
  const trainer4 = await prisma.trainer.create({
    data: {
      name: 'Casey Williams',
      email: 'casey.williams@fitness.com',
      phone: '555-0104',
    },
  });

  // ============================================
  // 4. MEMBERS
  // ============================================
  console.log('👥 Creating members...');
  const now = new Date();
  
  const member1 = await prisma.member.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '555-1001',
      dateOfBirth: new Date('1990-05-15'),
      pastClassCount: 12,
    },
  });
  
  const member2 = await prisma.member.create({
    data: {
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '555-1002',
      dateOfBirth: new Date('1985-08-22'),
      pastClassCount: 8,
    },
  });
  
  const member3 = await prisma.member.create({
    data: {
      name: 'Bob Wilson',
      email: 'bob.wilson@email.com',
      phone: '555-1003',
      dateOfBirth: new Date('1992-11-10'),
      pastClassCount: 0,
    },
  });
  
  const member4 = await prisma.member.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice.johnson@email.com',
      phone: '555-1004',
      dateOfBirth: new Date('1988-03-25'),
      pastClassCount: 25,
    },
  });
  
  const member5 = await prisma.member.create({
    data: {
      name: 'Charlie Davis',
      email: 'charlie.davis@email.com',
      phone: '555-1005',
      dateOfBirth: new Date('1995-07-18'),
      pastClassCount: 3,
    },
  });
  
  const member6 = await prisma.member.create({
    data: {
      name: 'Diana Prince',
      email: 'diana.prince@email.com',
      phone: '555-1006',
      dateOfBirth: new Date('1991-12-05'),
      pastClassCount: 15,
    },
  });
  
  const member7 = await prisma.member.create({
    data: {
      name: 'Ethan Hunt',
      email: 'ethan.hunt@email.com',
      phone: '555-1007',
      dateOfBirth: new Date('1987-09-30'),
      pastClassCount: 0,
    },
  });
  
  const member8 = await prisma.member.create({
    data: {
      name: 'Fiona Green',
      email: 'fiona.green@email.com',
      phone: '555-1008',
      dateOfBirth: new Date('1993-04-12'),
      pastClassCount: 7,
    },
  });

  // ============================================
  // 5. HEALTH METRICS
  // ============================================
  console.log('📊 Creating health metrics...');
  
  // Member 1 - Multiple weight entries over time
  await prisma.healthMetric.createMany({
    data: [
      {
        memberId: member1.id,
        recordedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        metricType: 'WEIGHT',
        value: 85.5,
        unit: 'kg',
      },
      {
        memberId: member1.id,
        recordedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        metricType: 'WEIGHT',
        value: 83.2,
        unit: 'kg',
      },
      {
        memberId: member1.id,
        recordedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        metricType: 'WEIGHT',
        value: 81.8,
        unit: 'kg',
      },
      {
        memberId: member1.id,
        recordedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        metricType: 'WEIGHT',
        value: 80.5,
        unit: 'kg',
      },
      {
        memberId: member1.id,
        recordedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        metricType: 'HEART_RATE_RESTING',
        value: 68,
        unit: 'bpm',
      },
    ],
  });
  
  // Member 2 - Various metrics
  await prisma.healthMetric.createMany({
    data: [
      {
        memberId: member2.id,
        recordedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        metricType: 'WEIGHT',
        value: 65.0,
        unit: 'kg',
      },
      {
        memberId: member2.id,
        recordedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        metricType: 'BODY_FAT_PERCENTAGE',
        value: 22.5,
        unit: '%',
      },
      {
        memberId: member2.id,
        recordedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        metricType: 'HEART_RATE_RESTING',
        value: 62,
        unit: 'bpm',
      },
    ],
  });
  
  // Member 3 - New member, minimal data
  await prisma.healthMetric.create({
    data: {
      memberId: member3.id,
      recordedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      metricType: 'WEIGHT',
      value: 92.3,
      unit: 'kg',
    },
  });
  
  // Member 4 - Active member with comprehensive tracking
  await prisma.healthMetric.createMany({
    data: [
      {
        memberId: member4.id,
        recordedAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
        metricType: 'WEIGHT',
        value: 70.0,
        unit: 'kg',
      },
      {
        memberId: member4.id,
        recordedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        metricType: 'WEIGHT',
        value: 68.5,
        unit: 'kg',
      },
      {
        memberId: member4.id,
        recordedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        metricType: 'WEIGHT',
        value: 67.2,
        unit: 'kg',
      },
      {
        memberId: member4.id,
        recordedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        metricType: 'WEIGHT',
        value: 66.0,
        unit: 'kg',
      },
      {
        memberId: member4.id,
        recordedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        metricType: 'BODY_FAT_PERCENTAGE',
        value: 18.0,
        unit: '%',
      },
    ],
  });

  // ============================================
  // 6. FITNESS GOALS
  // ============================================
  console.log('🎯 Creating fitness goals...');
  
  // Member 1 - Active and completed goals
  await prisma.fitnessGoals.createMany({
    data: [
      {
        memberId: member1.id,
        recordedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        active: false,
        value: 'Lose 5kg in 3 months',
      },
      {
        memberId: member1.id,
        recordedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        active: true,
        value: 'Maintain weight below 82kg',
      },
    ],
  });
  
  // Member 2 - Multiple active goals
  await prisma.fitnessGoals.createMany({
    data: [
      {
        memberId: member2.id,
        recordedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        active: true,
        value: 'Increase muscle mass by 5kg',
      },
      {
        memberId: member2.id,
        recordedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        active: true,
        value: 'Run a 5K in under 25 minutes',
      },
    ],
  });
  
  // Member 3 - New member, single goal
  await prisma.fitnessGoals.create({
    data: {
      memberId: member3.id,
      recordedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      active: true,
      value: 'Lose 10kg and improve cardiovascular health',
    },
  });
  
  // Member 4 - Completed goal
  await prisma.fitnessGoals.create({
    data: {
      memberId: member4.id,
      recordedAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
      active: false,
      value: 'Lose 5kg and reduce body fat to 18%',
    },
  });
  
  // Member 5 - Active goal
  await prisma.fitnessGoals.create({
    data: {
      memberId: member5.id,
      recordedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      active: true,
      value: 'Build upper body strength',
    },
  });

  // ============================================
  // 7. TRAINER AVAILABILITIES
  // ============================================
  console.log('📅 Creating trainer availabilities...');
  
  // Helper function to create time-only DateTime
  const createTime = (hours: number, minutes: number): Date => {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };
  
  // Trainer 1 - Weekly availability (Monday, Wednesday, Friday mornings)
  await prisma.trainerAvailability.createMany({
    data: [
      {
        trainerId: trainer1.id,
        type: 'WEEKLY',
        dayOfWeek: 1, // Monday
        startTime: createTime(9, 0),
        endTime: createTime(12, 0),
      },
      {
        trainerId: trainer1.id,
        type: 'WEEKLY',
        dayOfWeek: 3, // Wednesday
        startTime: createTime(9, 0),
        endTime: createTime(12, 0),
      },
      {
        trainerId: trainer1.id,
        type: 'WEEKLY',
        dayOfWeek: 5, // Friday
        startTime: createTime(9, 0),
        endTime: createTime(12, 0),
      },
      {
        trainerId: trainer1.id,
        type: 'WEEKLY',
        dayOfWeek: 2, // Tuesday
        startTime: createTime(14, 0),
        endTime: createTime(18, 0),
      },
    ],
  });
  
  // Trainer 2 - Weekly availability (Tuesday, Thursday afternoons)
  await prisma.trainerAvailability.createMany({
    data: [
      {
        trainerId: trainer2.id,
        type: 'WEEKLY',
        dayOfWeek: 2, // Tuesday
        startTime: createTime(13, 0),
        endTime: createTime(17, 0),
      },
      {
        trainerId: trainer2.id,
        type: 'WEEKLY',
        dayOfWeek: 4, // Thursday
        startTime: createTime(13, 0),
        endTime: createTime(17, 0),
      },
      {
        trainerId: trainer2.id,
        type: 'WEEKLY',
        dayOfWeek: 6, // Saturday
        startTime: createTime(10, 0),
        endTime: createTime(14, 0),
      },
    ],
  });
  
  // Trainer 3 - Mixed: Weekly + One-time
  await prisma.trainerAvailability.createMany({
    data: [
      {
        trainerId: trainer3.id,
        type: 'WEEKLY',
        dayOfWeek: 1, // Monday
        startTime: createTime(8, 0),
        endTime: createTime(16, 0),
      },
      {
        trainerId: trainer3.id,
        type: 'WEEKLY',
        dayOfWeek: 3, // Wednesday
        startTime: createTime(8, 0),
        endTime: createTime(16, 0),
      },
      {
        trainerId: trainer3.id,
        type: 'ONE_TIME',
        startDateTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
        endDateTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
      },
    ],
  });
  
  // Trainer 4 - One-time availability only
  await prisma.trainerAvailability.createMany({
    data: [
      {
        trainerId: trainer4.id,
        type: 'ONE_TIME',
        startDateTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endDateTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours later
      },
      {
        trainerId: trainer4.id,
        type: 'ONE_TIME',
        startDateTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        endDateTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // 5 hours later
      },
    ],
  });

  // ============================================
  // 8. PT SESSIONS
  // ============================================
  console.log('🏋️ Creating PT sessions...');
  
  // Past sessions
  const pastSession1 = await prisma.session.create({
    data: {
      memberId: member1.id,
      trainerId: trainer1.id,
      roomId: room4.id,
      startTime: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
      endTime: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour later
    },
  });
  
  const pastSession2 = await prisma.session.create({
    data: {
      memberId: member2.id,
      trainerId: trainer2.id,
      roomId: room5.id,
      startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    },
  });
  
  // Upcoming sessions (with rooms)
  const upcomingSession1 = await prisma.session.create({
    data: {
      memberId: member1.id,
      trainerId: trainer1.id,
      roomId: room4.id,
      startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    },
  });
  
  const upcomingSession2 = await prisma.session.create({
    data: {
      memberId: member3.id,
      trainerId: trainer2.id,
      roomId: room5.id,
      startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    },
  });
  
  // Sessions without rooms (room booking pending)
  const upcomingSession3 = await prisma.session.create({
    data: {
      memberId: member4.id,
      trainerId: trainer3.id,
      roomId: null, // No room assigned yet
      startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    },
  });
  
  const upcomingSession4 = await prisma.session.create({
    data: {
      memberId: member5.id,
      trainerId: trainer1.id,
      roomId: null, // No room assigned yet
      startTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      endTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    },
  });
  
  // More past sessions for history
  await prisma.session.createMany({
    data: [
      {
        memberId: member1.id,
        trainerId: trainer1.id,
        roomId: room4.id,
        startTime: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000), // 4 weeks ago
        endTime: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      },
      {
        memberId: member4.id,
        trainerId: trainer3.id,
        roomId: room4.id,
        startTime: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
        endTime: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      },
      {
        memberId: member6.id,
        trainerId: trainer2.id,
        roomId: room5.id,
        startTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        endTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      },
    ],
  });

  // ============================================
  // 9. FITNESS CLASSES
  // ============================================
  console.log('🧘 Creating fitness classes...');
  
  // Past classes
  const pastClass1 = await prisma.fitnessClass.create({
    data: {
      name: 'Morning Yoga',
      trainerId: trainer2.id,
      roomId: room2.id,
      startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      capacity: 20,
    },
  });
  
  // Upcoming classes - various scenarios
  const upcomingClass1 = await prisma.fitnessClass.create({
    data: {
      name: 'HIIT Bootcamp',
      trainerId: trainer1.id,
      roomId: room1.id,
      startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      capacity: 30,
    },
  });
  
  const upcomingClass2 = await prisma.fitnessClass.create({
    data: {
      name: 'Yoga Flow',
      trainerId: trainer2.id,
      roomId: room2.id,
      startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      capacity: 20,
    },
  });
  
  const upcomingClass3 = await prisma.fitnessClass.create({
    data: {
      name: 'Spin Class',
      trainerId: trainer3.id,
      roomId: room6.id,
      startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 minutes
      capacity: 15,
    },
  });
  
  const upcomingClass4 = await prisma.fitnessClass.create({
    data: {
      name: 'Cardio Blast',
      trainerId: trainer1.id,
      roomId: room3.id,
      startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      capacity: 25,
    },
  });
  
  const upcomingClass5 = await prisma.fitnessClass.create({
    data: {
      name: 'Pilates',
      trainerId: trainer4.id,
      roomId: room2.id,
      startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      capacity: 20,
    },
  });
  
  const upcomingClass6 = await prisma.fitnessClass.create({
    data: {
      name: 'Strength Training',
      trainerId: trainer2.id,
      roomId: room1.id,
      startTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      endTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      capacity: 30,
    },
  });

  // ============================================
  // 10. CLASS REGISTRATIONS
  // ============================================
  console.log('📝 Creating class registrations...');
  
  // Past class registration (for history)
  await prisma.classRegistration.createMany({
    data: [
      {
        memberId: member1.id,
        fitnessClassId: pastClass1.id,
        registeredAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        memberId: member2.id,
        fitnessClassId: pastClass1.id,
        registeredAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        memberId: member4.id,
        fitnessClassId: pastClass1.id,
        registeredAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      },
    ],
  });
  
  // Upcoming Class 1 (HIIT Bootcamp) - Partially filled (8/30)
  await prisma.classRegistration.createMany({
    data: [
      { memberId: member1.id, fitnessClassId: upcomingClass1.id },
      { memberId: member2.id, fitnessClassId: upcomingClass1.id },
      { memberId: member3.id, fitnessClassId: upcomingClass1.id },
      { memberId: member4.id, fitnessClassId: upcomingClass1.id },
      { memberId: member5.id, fitnessClassId: upcomingClass1.id },
      { memberId: member6.id, fitnessClassId: upcomingClass1.id },
      { memberId: member7.id, fitnessClassId: upcomingClass1.id },
      { memberId: member8.id, fitnessClassId: upcomingClass1.id },
    ],
  });
  
  // Upcoming Class 2 (Yoga Flow) - Partially filled (8/20)
  await prisma.classRegistration.createMany({
    data: [
      { memberId: member1.id, fitnessClassId: upcomingClass2.id },
      { memberId: member2.id, fitnessClassId: upcomingClass2.id },
      { memberId: member3.id, fitnessClassId: upcomingClass2.id },
      { memberId: member4.id, fitnessClassId: upcomingClass2.id },
      { memberId: member5.id, fitnessClassId: upcomingClass2.id },
      { memberId: member6.id, fitnessClassId: upcomingClass2.id },
      { memberId: member7.id, fitnessClassId: upcomingClass2.id },
      { memberId: member8.id, fitnessClassId: upcomingClass2.id },
    ],
  });
  
  // Upcoming Class 3 (Spin Class) - Partially filled (8/15) - Note: We only have 8 members, so this shows 8/15
  // In a real scenario, you'd have more members to fill it completely
  await prisma.classRegistration.createMany({
    data: [
      { memberId: member1.id, fitnessClassId: upcomingClass3.id },
      { memberId: member2.id, fitnessClassId: upcomingClass3.id },
      { memberId: member3.id, fitnessClassId: upcomingClass3.id },
      { memberId: member4.id, fitnessClassId: upcomingClass3.id },
      { memberId: member5.id, fitnessClassId: upcomingClass3.id },
      { memberId: member6.id, fitnessClassId: upcomingClass3.id },
      { memberId: member7.id, fitnessClassId: upcomingClass3.id },
      { memberId: member8.id, fitnessClassId: upcomingClass3.id },
    ],
  });
  
  // Upcoming Class 4 (Cardio Blast) - Empty (0/25)
  // No registrations - testing empty class scenario
  
  // Upcoming Class 5 (Pilates) - Few registrations (3/20)
  await prisma.classRegistration.createMany({
    data: [
      { memberId: member2.id, fitnessClassId: upcomingClass5.id },
      { memberId: member4.id, fitnessClassId: upcomingClass5.id },
      { memberId: member6.id, fitnessClassId: upcomingClass5.id },
    ],
  });
  
  // Upcoming Class 6 (Strength Training) - Partially filled (4/30)
  await prisma.classRegistration.createMany({
    data: [
      { memberId: member1.id, fitnessClassId: upcomingClass6.id },
      { memberId: member3.id, fitnessClassId: upcomingClass6.id },
      { memberId: member5.id, fitnessClassId: upcomingClass6.id },
      { memberId: member7.id, fitnessClassId: upcomingClass6.id },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Admin Staff: 2`);
  console.log(`   - Rooms: 6`);
  console.log(`   - Trainers: 4`);
  console.log(`   - Members: 8`);
  console.log(`   - Health Metrics: Multiple entries across members`);
  console.log(`   - Fitness Goals: Active and inactive goals`);
  console.log(`   - Trainer Availabilities: Weekly and one-time patterns`);
  console.log(`   - PT Sessions: Past and upcoming (some with rooms, some without)`);
  console.log(`   - Fitness Classes: Past and upcoming with various capacity scenarios`);
  console.log(`   - Class Registrations: Full, partially filled, and empty classes`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    globalThis.process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

