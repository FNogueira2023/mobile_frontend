export const ROLES = {
  VISITOR: 'visitor',
  USER: 'user',
  STUDENT: 'student',
};

export const ROLE_PERMISSIONS = {
  [ROLES.VISITOR]: {
    canViewRecipes: true,
    canSaveRecipes: false,
    canCreateRecipes: false,
    canAccessPremium: false,
  },
  [ROLES.USER]: {
    canViewRecipes: true,
    canSaveRecipes: true,
    canCreateRecipes: true,
    canAccessPremium: false,
  },
  [ROLES.STUDENT]: {
    canViewRecipes: true,
    canSaveRecipes: true,
    canCreateRecipes: true,
    canAccessPremium: true,
  },
};

export const hasPermission = (userRole, permission) => {
  return ROLE_PERMISSIONS[userRole]?.[permission] || false;
};

export const canUpgradeToStudent = (userRole) => {
  return userRole === ROLES.USER;
}; 