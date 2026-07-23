export function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^department[-\s]?head$/i, "departmenthead")
    .replace(/^head[-\s]?hr$/i, "hradmin")
    .replace(/^hr[-\s]?admin$/i, "hradmin")
    .replace(/^hr[-\s]?executive$/i, "hr");
}

export function isLearnerRole(value: unknown) {
  const role = normalizeRole(value);
  return role === "user" || role === "learner" || role === "manager" || /^l\d+-manager$/i.test(role);
}

export function isEmployeeRole(value: unknown) {
  const role = normalizeRole(value);
  return role === "user";
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
  const role = normalizeRole(user?.role || user?.userType);

  if (role === "superadmin") {
    return "/dashboard/companies";
  }

  if (role === "admin" || role === "departmenthead" || role === "hradmin" || role === "hr") {
    return "/dashboard/users";
  }

  if (isEmployeeRole(role)) {
    return "/employee";
  }

  return "/";
}
