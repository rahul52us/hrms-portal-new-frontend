export function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^department[-\s]?head$/i, "departmenthead")
    .replace(/^head[-\s]?hr$/i, "hradmin")
    .replace(/^hr[-\s]?admin$/i, "hradmin")
    .replace(/^hr[-\s]?executive$/i, "hr");
}

export function formatRoleLabel(value: unknown) {
  const role = normalizeRole(value);
  const labels: Record<string, string> = {
    superadmin: "Super Admin",
    admin: "Admin",
    hradmin: "HR Admin",
    hr: "HR",
    departmenthead: "Department Head",
    user: "Employee",
  };

  if (!role) {
    return "Role not assigned";
  }

  return labels[role] || role
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function isLearnerRole(value: unknown) {
  const role = normalizeRole(value);
  return role === "user" || role === "learner" || role === "manager" || /^l\d+-manager$/i.test(role);
}

export function isEmployeeRole(value: unknown) {
  const role = normalizeRole(value);
  return role === "user" || role === "manager" || /^l\d+-manager$/i.test(role);
}

export function isEmployeeDashboardRole(value: unknown) {
  const role = normalizeRole(value);
  return isEmployeeRole(role) || role === "departmenthead";
}

export function isManagerRole(value: unknown) {
  const role = normalizeRole(value);
  return role === "manager" || /^l\d+-manager$/i.test(role);
}

export function expandRoleAliases(roles: string[] = []) {
  const expanded = new Set(roles.map((role) => normalizeRole(role)));

  if (Array.from(expanded).some((role) => isLearnerRole(role))) {
    expanded.add("user");
  }

  return Array.from(expanded);
}

export function getDefaultAuthenticatedRoute(user: any) {
  const role = normalizeRole(
    user?.effectiveRole || user?.activeMembership?.role || user?.role
  );

  if (isEmployeeDashboardRole(role)) {
    return "/employee";
  }

  if (role === "hradmin" || role === "hr") {
    return "/dashboard/hr";
  }

  if (role === "admin") {
    return "/dashboard/users";
  }

  return "/dashboard";
}
