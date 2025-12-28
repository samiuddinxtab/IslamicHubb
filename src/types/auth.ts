export type AuthRole = 'institution_admin' | 'teacher' | 'student' | 'unknown';

export type AuthUser = {
  id: string;
  institutionId: string;
  role: AuthRole;
};
