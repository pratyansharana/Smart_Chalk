import { ROLE } from '../constants/roles';
import { ROUTES } from '../constants/routes';

export const routeConfig = [
  { path: ROUTES.HOME, access: 'public' },
  { path: ROUTES.LOGIN, access: 'public' },
  { path: ROUTES.STUDENT, access: [ROLE.STUDENT] },
  { path: ROUTES.TEACHER, access: [ROLE.TEACHER, ROLE.ADMIN] },
];
