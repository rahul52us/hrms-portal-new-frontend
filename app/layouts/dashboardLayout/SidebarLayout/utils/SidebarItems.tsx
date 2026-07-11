import { FaChartPie, FaCog, FaUsers } from "react-icons/fa";
import { expandRoleAliases } from "@/app/config/utils/roleAccess";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import { LucideBriefcaseBusiness } from "lucide-react";
import { BiCategory } from "react-icons/bi";
import { FiBell, FiSettings } from "react-icons/fi";

interface SidebarItem {
  id: number;
  name: string;
  icon: any;
  url: string;
  role?: string[];
  permissionKey?: string;
  children?: SidebarItem[];
}

const sidebarDatas: SidebarItem[] = [
  {
    id: 1,
    name: "Dashboard",
    icon: <FaChartPie />,
    url: "/dashboard",
    role: ["superadmin"],
    permissionKey: PERMISSION_KEYS.VIEW_DASHBOARD,
  },
  {
    id: 100,
    name: "Employees",
    icon: <FaUsers />,
    url: "/dashboard/users",
    role: ["admin", "superadmin", "departmenthead"],
    permissionKey: PERMISSION_KEYS.VIEW_USERS,
  },
  {
    id: 101,
    name: "Departments",
    icon: <BiCategory />,
    url: "/dashboard/departments",
    role: ["admin", "superadmin", "departmenthead"],
    permissionKey: PERMISSION_KEYS.VIEW_DEPARTMENTS,
  },
  {
    id: 12,
    name: "Companies",
    icon: <LucideBriefcaseBusiness />,
    url: "/dashboard/companies",
    role: ["superadmin"],
  },
  {
    id: 13,
    name: "Permissions",
    icon: <FaCog />,
    url: "/dashboard/permissions",
    role: ["superadmin"],
  },
  {
    id: 14,
    name: "Notifications",
    icon: <FiBell />,
    url: "/dashboard/notifications",
    role: ["superadmin"],
  },
];

export const sidebarFooterData: SidebarItem[] = [
  {
    id: 33,
    name: "Company Settings",
    icon: <FiSettings />,
    url: "/dashboard/company-settings",
    role: ["admin"],
    permissionKey: PERMISSION_KEYS.COMPANY_SETTINGS,
  },
  {
    id: 34,
    name: "Settings",
    icon: <FaCog />,
    url: "/dashboard/profile",
    role: ["admin", "superadmin", "patient", "doctor", "departmenthead"],
    permissionKey: PERMISSION_KEYS.VIEW_PROFILE,
  },
];

const filterSidebarItemsByRole = (
  items: SidebarItem[],
  role: string[] = ["admin"],
  user?: any
): SidebarItem[] => {
  const effectiveRoles = expandRoleAliases(role);

  const filterByRole = (items: SidebarItem[]): SidebarItem[] => {
    return items
      .filter(
        (item) =>
          (!item.role || item.role.some((r) => effectiveRoles.includes(r))) &&
          (!item.permissionKey || hasPermission(user, item.permissionKey))
      )
      .map((item) => ({
        ...item,
        children: item.children ? filterByRole(item.children) : undefined,
      }));
  };

  return filterByRole(items);
};

const getSidebarDataByRole = (role: string[] = ["admin"], user?: any): SidebarItem[] =>
  filterSidebarItemsByRole(sidebarDatas, role, user);

const getSidebarFooterDataByRole = (role: string[] = ["admin"], user?: any): SidebarItem[] =>
  filterSidebarItemsByRole(sidebarFooterData, role, user);

export { getSidebarDataByRole, getSidebarFooterDataByRole, sidebarDatas };
