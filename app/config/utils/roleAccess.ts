export function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^department[-\s]?head$/i, "departmenthead");
}

export function isLearnerRole(value: unknown) {
  const role = normalizeRole(value);
  return role === "user" || role === "learner" || role === "manager" || /^l\d+-manager$/i.test(role);
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
  return ["superadmin", "admin", "departmenthead"].includes(role)
    ? "/dashboard"
    : "/";
}
