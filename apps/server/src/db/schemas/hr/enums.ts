import { pgEnum } from 'drizzle-orm/pg-core';
import { ATTENDANCE_EVENT_TYPE_LIST } from '@rona/config/hr';

export const attendanceEventTypeList = pgEnum(
  'attendance_event_type_list',
  ATTENDANCE_EVENT_TYPE_LIST,
);
