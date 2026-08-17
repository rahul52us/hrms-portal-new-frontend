import { FaCog } from "react-icons/fa";
import { expandRoleAliases } from "@/app/config/utils/roleAccess";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import { LucideBriefcaseBusiness, Network } from "lucide-react";
import { BiCategory } from "react-icons/bi";
import { FiBell, FiCalendar, FiCamera, FiClock, FiCreditCard, FiFileText, FiMapPin, FiSettings, FiShield, FiUser, FiUsers, FiPieChart, FiDatabase } from "react-icons/fi";

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
    icon: <FiPieChart />,
    url: "/dashboard",
    role: ["superadmin"],
    permissionKey: PERMISSION_KEYS.VIEW_DASHBOARD,
  },
  {
    id: 2,
    name: "HR Dashboard",
    icon: <FiPieChart />,
    url: "/dashboard/hr",
    role: ["admin", "hradmin", "hr"],
    permissionKey: PERMISSION_KEYS.VIEW_DASHBOARD,
  },
  {
    id: 3,
    name: "Me",
    icon: <FiUser />,
    url: "/dashboard/user-profile",
    role: ["admin", "departmenthead", "hradmin", "hr", "employee"],
  },
  {
    id: 100,
    name: "Employees",
    icon: <FiUsers />,
    url: "/dashboard/users",
    role: ["admin", "departmenthead", "hradmin", "hr"],
    permissionKey: PERMISSION_KEYS.VIEW_USERS,
  },
  {
    id: 103,
    name: "Organization",
    icon: <Network />,
    url: "/dashboard/organization",
    role: ["admin", "departmenthead", "hradmin", "hr"],
    permissionKey: PERMISSION_KEYS.VIEW_USERS,
  },
  {
    id: 101,
    name: "Departments",
    icon: <BiCategory />,
    url: "/dashboard/departments",
    role: ["admin", "departmenthead", "hradmin", "hr"],
    permissionKey: PERMISSION_KEYS.VIEW_DEPARTMENTS,
  },
  {
    id: 102,
    name: "Locations",
    icon: <FiMapPin />,
    url: "/dashboard/locations",
    role: ["admin", "departmenthead", "hradmin", "hr"],
    permissionKey: PERMISSION_KEYS.VIEW_LOCATIONS,
  },
  {
    id: 104,
    name: "Workforce Policies",
    icon: <FiClock />,
    url: "/dashboard/workforce-policies",
    role: ["admin", "departmenthead", "hradmin", "hr"],
    permissionKey: PERMISSION_KEYS.VIEW_WORKFORCE_POLICIES,
  },
  {
    id: 35,
    name: "Master Settings",
    icon: <FiDatabase />,
    url: "/dashboard/master-settings",
    role: ["admin", "hradmin"],
    permissionKey: PERMISSION_KEYS.COMPANY_SETTINGS,
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
  {
    id: 200,
    name: "Home",
    icon: <FiUser />,
    url: "/employee",
    role: ["user"],
  },
  {
    id: 201,
    name: "My Links",
    icon: <FiFileText />,
    url: "/employee",
    role: ["user"],
    children: [
      {
        id: 202,
        name: "My CTC",
        icon: <FiFileText />,
        url: "/employee/ctc",
        role: ["user"],
      },
      {
        id: 203,
        name: "My Salary Slip",
        icon: <FiFileText />,
        url: "/dashboard/salary-slip",
        role: ["user"],
      },
      {
        id: 204,
        name: "My Investment Declaration",
        icon: <FiFileText />,
        url: "/employee/investment-declaration",
        role: ["user"],
      },
      {
        id: 205,
        name: "My Tax Report",
        icon: <FiFileText />,
        url: "/employee/tax-report",
        role: ["user"],
      },
      {
        id: 206,
        name: "My Annual Salary",
        icon: <FiFileText />,
        url: "/employee/annual-salary",
        role: ["user"],
      },
      {
        id: 207,
        name: "My To Do",
        icon: <FiFileText />,
        url: "/employee/todo",
        role: ["user"],
      },
      {
        id: 208,
        name: "My Activity Update",
        icon: <FiFileText />,
        url: "/employee/activity-update",
        role: ["user"],
      },
      {
        id: 209,
        name: "Asset Allocated",
        icon: <FiFileText />,
        url: "/employee/assets",
        role: ["user"],
      },
      {
        id: 210,
        name: "View My Process Activities",
        icon: <FiFileText />,
        url: "/employee/process-activities",
        role: ["user"],
      },
      {
        id: 211,
        name: "My Form16",
        icon: <FiFileText />,
        url: "/employee/form16",
        role: ["user"],
      },
      {
        id: 212,
        name: "My Trainings",
        icon: <FiFileText />,
        url: "/course",
        role: ["user"],
      },
      {
        id: 213,
        name: "Remarks",
        icon: <FiFileText />,
        url: "/employee/remarks",
        role: ["user"],
      },
      {
        id: 214,
        name: "My Appreciation",
        icon: <FiFileText />,
        url: "/employee/appreciation",
        role: ["user"],
      },
    ],
  },
  {
    id: 215,
    name: "My Profile",
    icon: <FiUser />,
    url: "/dashboard/profile",
    role: ["user"],
    children: [
      {
        id: 2151,
        name: "Personal",
        icon: <FiUser />,
        url: "/dashboard/profile",
        role: ["user"],
      },
      {
        id: 2152,
        name: "Company",
        icon: <LucideBriefcaseBusiness />,
        url: "/dashboard/profile/company",
        role: ["user"],
      },
      {
        id: 2153,
        name: "Family",
        icon: <FiUsers />,
        url: "/dashboard/profile/family",
        role: ["user"],
      },
      {
        id: 2154,
        name: "Work Experience",
        icon: <FiFileText />,
        url: "/dashboard/profile/work-experience",
        role: ["user"],
      },
      {
        id: 2155,
        name: "Skill & Additional Info.",
        icon: <FiFileText />,
        url: "/dashboard/profile/skills",
        role: ["user"],
      },
      {
        id: 2156,
        name: "Qualification",
        icon: <FiFileText />,
        url: "/dashboard/profile/qualification",
        role: ["user"],
      },
      {
        id: 2157,
        name: "Photo",
        icon: <FiCamera />,
        url: "/dashboard/profile/photo",
        role: ["user"],
      },
      {
        id: 2158,
        name: "Documents",
        icon: <FiFileText />,
        url: "/dashboard/profile/documents",
        role: ["user"],
      },
      {
        id: 2159,
        name: "Bank Account Details",
        icon: <FiCreditCard />,
        url: "/dashboard/profile/bank-account",
        role: ["user"],
      },
    ],
  },
  {
    id: 216,
    name: "My Attendance",
    icon: <FiCalendar />,
    url: "/employee#attendance",
    role: ["user"],
  },
  {
    id: 217,
    name: "Request",
    icon: <FiFileText />,
    url: "/dashboard/request/leave",
    role: ["user"],
    children: [
      {
        id: 218,
        name: "Attendance Regularise",
        icon: <FiFileText />,
        url: "/dashboard/request",
        role: ["user"],
      },
      {
        id: 219,
        name: "Leave/OD/WFH",
        icon: <FiFileText />,
        url: "/dashboard/request/leave",
        role: ["user"],
      },
      {
        id: 220,
        name: "HelpDesk",
        icon: <FiFileText />,
        url: "/contact-us",
        role: ["user"],
      },
      {
        id: 221,
        name: "Appreciation",
        icon: <FiFileText />,
        url: "/employee/appreciation",
        role: ["user"],
      },
      {
        id: 222,
        name: "Resignation Note",
        icon: <FiFileText />,
        url: "/employee/resignation",
        role: ["user"],
      },
      {
        id: 223,
        name: "Leave Encashment",
        icon: <FiFileText />,
        url: "/employee/leave-encashment",
        role: ["user"],
      },
    ],
  },
  {
    id: 224,
    name: "My Claims",
    icon: <FiShield />,
    url: "/employee/claims",
    role: ["user"],
  },
  {
    id: 225,
    name: "Corp. Info.",
    icon: <FiShield />,
    url: "/dashboard/company-settings",
    role: ["user"],
  },
  {
    id: 226,
    name: "Value Add",
    icon: <FiShield />,
    url: "/employee/value-add",
    role: ["user"],
  },
  {
    id: 227,
    name: "Employee Benefit",
    icon: <FiShield />,
    url: "/employee/benefits",
    role: ["user"],
  },
];

export const sidebarFooterData: SidebarItem[] = [
  {
    id: 32,
    name: "My HRMS",
    icon: <FiUser />,
    url: "/employee",
    role: ["user"],
  },
  {
    id: 33,
    name: "Company Settings",
    icon: <FiSettings />,
    url: "/dashboard/company-settings",
    role: ["admin", "hradmin"],
    permissionKey: PERMISSION_KEYS.COMPANY_SETTINGS,
  },
  {
    id: 34,
    name: "Settings",
    icon: <FaCog />,
    url: "/dashboard/profile",
    role: ["admin", "superadmin", "patient", "doctor", "departmenthead", "hradmin", "hr"],
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
