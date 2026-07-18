"use client";

export const PERMISSION_KEYS = {
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_USERS: "view_users",
  CREATE_USERS: "create_users",
  CREATE_MANAGERS: "create_managers",
  CREATE_DEPARTMENT_HEADS: "create_department_heads",
  EDIT_USERS: "edit_users",
  ASSIGN_MANAGERS: "assign_managers",
  VIEW_DEPARTMENTS: "view_departments",
  VIEW_LOCATIONS: "view_locations",
  MANAGE_LOCATIONS: "manage_locations",
  VIEW_ASSIGNED_COURSES: "view_assigned_courses",
  VIEW_ALL_COURSES: "view_all_courses",
  CREATE_COURSES: "create_courses",
  EDIT_COURSES: "edit_courses",
  DELETE_COURSES: "delete_courses",
  ASSIGN_COURSES: "assign_courses",
  VIEW_BATCHES: "view_batches",
  MANAGE_BATCHES: "manage_batches",
  VIEW_LEARNER_PROGRESS_RESULTS: "view_learner_progress_results",
  MANAGE_PERMISSIONS: "manage_permissions",
  COMPANY_SETTINGS: "company_settings",
  VIEW_PROFILE: "view_profile",
} as const;

export const ALL_PERMISSION_KEYS = Object.values(PERMISSION_KEYS);

const LEGACY_PERMISSION_ALIASES: Record<string, string[]> = {
  view_courses: [PERMISSION_KEYS.VIEW_ASSIGNED_COURSES, PERMISSION_KEYS.VIEW_ALL_COURSES],
  manage_courses: [
    PERMISSION_KEYS.CREATE_COURSES,
    PERMISSION_KEYS.EDIT_COURSES,
    PERMISSION_KEYS.DELETE_COURSES,
    PERMISSION_KEYS.VIEW_ASSIGNED_COURSES,
  ],
};

function normalizePermissionRecord(value: any) {
  const normalized: Record<string, boolean> = {};

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return normalized;
  }

  for (const [rawKey, rawValue] of Object.entries(value)) {
    if (typeof rawValue !== "boolean") {
      continue;
    }

    if (ALL_PERMISSION_KEYS.includes(rawKey as (typeof ALL_PERMISSION_KEYS)[number])) {
      normalized[rawKey] = rawValue;
      continue;
    }

    const aliasTargets = LEGACY_PERMISSION_ALIASES[rawKey];
    if (!aliasTargets?.length) {
      continue;
    }

    aliasTargets.forEach((aliasKey) => {
      normalized[aliasKey] = rawValue;
    });
  }

  return normalized;
}

export function getPermissionRecord(user: any) {
  const role = String(user?.role || user?.userType || "").toLowerCase();
  if (role === "superadmin") {
    return ALL_PERMISSION_KEYS.reduce<Record<string, boolean>>((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
  }

  return normalizePermissionRecord(user?.effectivePermissions || user?.permissions || {});
}

export function hasPermission(user: any, permissionKey: string) {
  const permissions = getPermissionRecord(user);
  return Boolean(permissions?.[permissionKey]);
}

export function hasAnyCourseViewPermission(user: any) {
  return (
    hasPermission(user, PERMISSION_KEYS.VIEW_ASSIGNED_COURSES) ||
    hasPermission(user, PERMISSION_KEYS.VIEW_ALL_COURSES) ||
    hasPermission(user, PERMISSION_KEYS.CREATE_COURSES) ||
    hasPermission(user, PERMISSION_KEYS.EDIT_COURSES) ||
    hasPermission(user, PERMISSION_KEYS.DELETE_COURSES) ||
    hasPermission(user, PERMISSION_KEYS.ASSIGN_COURSES)
  );
}

export function hasAnyCourseManagementPermission(user: any) {
  return (
    hasPermission(user, PERMISSION_KEYS.CREATE_COURSES) ||
    hasPermission(user, PERMISSION_KEYS.EDIT_COURSES) ||
    hasPermission(user, PERMISSION_KEYS.DELETE_COURSES)
  );
}
