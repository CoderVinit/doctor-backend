# Role-Based Data Partitioning Implementation

## Overview
This implementation provides role-based data access control (partitioning) at the application level, ensuring users can only access data appropriate for their role.

## User Roles

### 1. **USER** (Patient)
- Can view their own appointments
- Can view all available doctors
- Can book appointments
- Cannot access other users' data

### 2. **DOCTOR**
- Can view appointments assigned to them
- Can view patient profiles for their appointments only
- Can update their own profile
- Cannot access other doctors' data

### 3. **ADMIN**
- Full access to all data
- Can manage users, doctors, and appointments
- Can view system-wide analytics

## Usage Examples

### 1. Using the RolesGuard in Controllers

\`\`\`typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { AuthGuard } from './guards/auth.guard';

@Controller('appointments')
@UseGuards(AuthGuard, RolesGuard) // Apply both guards
export class AppointmentsController {
  
  // Only accessible by admins
  @Get('all')
  @Roles(UserRole.ADMIN)
  getAllAppointments() {
    // Implementation
  }

  // Accessible by users and doctors
  @Get('my-appointments')
  @Roles(UserRole.USER, UserRole.DOCTOR)
  getMyAppointments() {
    // Implementation
  }

  // Accessible by doctors only
  @Get('doctor-schedule')
  @Roles(UserRole.DOCTOR)
  getDoctorSchedule() {
    // Implementation
  }
}
\`\`\`

### 2. Using DataAccessService

\`\`\`typescript
import { Injectable } from '@nestjs/common';
import { DataAccessService } from '../common/services/data-access.service';

@Injectable()
export class AppointmentsService {
  constructor(private dataAccess: DataAccessService) {}

  async getAppointments(userId: string, userRole: string) {
    const userContext = { id: userId, role: userRole };
    
    // Automatically filters based on role
    return await this.dataAccess.getAppointments(userContext);
  }

  async cancelAppointment(userId: string, userRole: string, appointmentId: string) {
    const userContext = { id: userId, role: userRole };
    
    // Check if user can access this appointment
    const canAccess = await this.dataAccess.canAccessAppointment(userContext, appointmentId);
    
    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this appointment');
    }
    
    // Proceed with cancellation
  }
}
\`\`\`

### 3. Example Auth Service Integration

\`\`\`typescript
@Injectable()
export class AuthService {
  constructor(private dataAccess: DataAccessService) {}

  async getMyAppointments(userId: string, userRole: string) {
    const userContext = { id: userId, role: userRole };
    return await this.dataAccess.getAppointments(userContext);
  }
}
\`\`\`

## Data Access Matrix

| Resource | USER | DOCTOR | ADMIN |
|----------|------|--------|-------|
| Own appointments | ✅ Read | ✅ Read | ✅ Full |
| Other user appointments | ❌ | ✅ Read (if assigned) | ✅ Full |
| All appointments | ❌ | ❌ | ✅ Full |
| Own profile | ✅ Full | ✅ Full | ✅ Full |
| Other profiles | ❌ | ✅ Read (patients only) | ✅ Full |
| Doctor list | ✅ Read (available) | ❌ | ✅ Full |
| Own doctor profile | N/A | ✅ Full | ✅ Full |

## Security Benefits

1. **Principle of Least Privilege**: Users only access what they need
2. **Data Isolation**: Role-based filtering prevents unauthorized access
3. **Centralized Logic**: All access control in one service
4. **Type Safety**: TypeScript ensures correct role handling
5. **Audit Trail**: Easy to log access attempts per role

## Alternative: PostgreSQL Row-Level Security (RLS)

For production systems with high security requirements, consider implementing PostgreSQL RLS:

\`\`\`sql
-- Enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their appointments
CREATE POLICY user_appointments ON appointments
  FOR SELECT
  TO app_user
  USING (user_id = current_setting('app.user_id')::uuid);

-- Policy for doctors to see their appointments
CREATE POLICY doctor_appointments ON appointments
  FOR SELECT
  TO app_doctor
  USING (doc_id = current_setting('app.user_id')::uuid);

-- Policy for admins to see all
CREATE POLICY admin_appointments ON appointments
  FOR ALL
  TO app_admin
  USING (true);
\`\`\`

Then set the user context before queries:
\`\`\`typescript
await db.execute(\`SET LOCAL app.user_id = '\${userId}'\`);
\`\`\`

## Migration Path

1. ✅ Start with Application-Level (current implementation)
2. Add PostgreSQL RLS for additional security layer
3. Implement database-level partitioning for scale (if needed)

## Testing Role-Based Access

\`\`\`typescript
// Test user can only see their appointments
const userAppointments = await dataAccess.getAppointments({
  id: 'user-123',
  role: 'user'
});
// Should only return appointments where userId = 'user-123'

// Test doctor can only see assigned appointments
const doctorAppointments = await dataAccess.getAppointments({
  id: 'doctor-456',
  role: 'doctor'
});
// Should only return appointments where docId = 'doctor-456'
\`\`\`
