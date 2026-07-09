import { ROLE } from '../constants/roles';
import { ROUTES } from '../constants/routes';

export function getDefaultRouteForRole(role) {
  if (role === ROLE.TEACHER || role === ROLE.ADMIN) return ROUTES.TEACHER;
  if (role === ROLE.STUDENT) return ROUTES.STUDENT;
  return ROUTES.HOME;
}
