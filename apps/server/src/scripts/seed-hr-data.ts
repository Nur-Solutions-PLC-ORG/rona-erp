// Demo HR

export const DEMO_DEPARTMENTS = [
  { name: 'Production', code: 'PROD' },
  { name: 'Quality Assurance', code: 'QA' },
] as const;

export const buildDemoPositions = (departmentIds: Record<string, string>) =>
  [
    {
      title: 'Baker',
      code: 'BAKER',
      description: 'Produces dough and baked goods on the line',
      departmentId: departmentIds['PROD'],
    },
    {
      title: 'Line Supervisor',
      code: 'SUP',
      description: 'Supervises the production line',
      departmentId: departmentIds['PROD'],
    },
    {
      title: 'QA Inspector',
      code: 'QAINSPECT',
      description: 'Performs quality inspections',
      departmentId: departmentIds['QA'],
    },
  ] as const;

export const buildDemoEmployees = (
  departmentIds: Record<string, string>,
  positionIds: Record<string, string>,
  seedingUserId: string,
) => [
  {
    eId: '10001',
    fullName: 'Selam Bekele',
    phone: '+251911000001',
    email: 'selam.bekele@ronaerp.com',
    gender: 'F' as const,
    birthDate: '1995-04-12',
    departmentId: departmentIds['PROD'],
    positionId: positionIds['SUP'],
    userId: seedingUserId,
    hireDate: '2024-01-15',
  },
  {
    eId: '10002',
    fullName: 'Dawit Haile',
    phone: '+251911000002',
    email: 'dawit.haile@ronaerp.com',
    gender: 'M' as const,
    birthDate: '1990-09-03',
    departmentId: departmentIds['PROD'],
    positionId: positionIds['BAKER'],
    hireDate: '2023-06-01',
  },
  {
    eId: '10003',
    fullName: 'Marta Alemu',
    phone: '+251911000003',
    email: 'marta.alemu@ronaerp.com',
    gender: 'F' as const,
    birthDate: '1998-11-25',
    departmentId: departmentIds['QA'],
    positionId: positionIds['QAINSPECT'],
    hireDate: '2025-02-10',
  },
];

export const DEMO_EMERGENCY_CONTACT = {
  name: 'Abebe Bekele',
  relationship: 'Brother',
  phone: '+251911100002',
} as const;

export const DEMO_SHIFTS = [
  {
    name: 'Morning Shift',
    code: 'MORNING',
    startTime: '06:00',
    endTime: '14:00',
    breakMinutes: 30,
  },
  {
    name: 'Night Shift',
    code: 'NIGHT',
    startTime: '22:00',
    endTime: '06:00',
    breakMinutes: 45,
  },
] as const;
