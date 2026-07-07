import { PlusSquareIcon } from "@chakra-ui/icons";
import { FaChartPie, FaCog, FaUserAstronaut, FaUsers, FaUserTie } from "react-icons/fa";
import { expandRoleAliases } from "@/app/config/utils/roleAccess";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import { FaPeopleGroup } from "react-icons/fa6";
import { HiOutlineComputerDesktop } from "react-icons/hi2";
import { LucideBriefcaseBusiness } from "lucide-react";
import { BiCategory } from "react-icons/bi";
import { FiBell, FiSettings, FiTrendingUp } from "react-icons/fi";

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
    role: ["patient", "admin", "superadmin", "departmenthead"],
    permissionKey: PERMISSION_KEYS.VIEW_DASHBOARD,
  },
  {
    id: 100,
    name: "Users",
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
    url: "/dashboard/admins",
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
    id: 17,
    name: "Courses",
    icon: <HiOutlineComputerDesktop />,
    url: "/dashboard/course",
    role: ["superadmin", "admin", "departmenthead"],
    permissionKey: PERMISSION_KEYS.VIEW_ASSIGNED_COURSES,
    children: [
      {
        id: 171,
        name: "All Courses",
        icon: <PlusSquareIcon />,
        url: "/dashboard/course",
        role: ["superadmin", "admin", "departmenthead"],
        permissionKey: PERMISSION_KEYS.VIEW_ASSIGNED_COURSES,
      },
      {
        id: 172,
        name: "Assigned Courses",
        icon: <PlusSquareIcon />,
        url: "/dashboard/course/assigned",
        role: ["superadmin", "admin", "departmenthead"],
        permissionKey: PERMISSION_KEYS.VIEW_ASSIGNED_COURSES,
      },
      {
        id: 174,
        name: "Assignments Audit",
        icon: <PlusSquareIcon />,
        url: "/dashboard/course/assignments",
        role: ["superadmin", "admin", "departmenthead"],
        permissionKey: PERMISSION_KEYS.VIEW_ASSIGNED_COURSES,
      },
    ],
  },
  {
  id: 18,
  name: "Batches",
  icon: <FaPeopleGroup />,
  url: "/dashboard/batches",
  role: ["superadmin", "admin", "departmenthead"],
  permissionKey: PERMISSION_KEYS.VIEW_BATCHES,
  children: [
    {
      id: 181,
      name: "All Batches",
      icon: <PlusSquareIcon />,
      url: "/dashboard/batches",
      role: ["superadmin", "admin", "departmenthead"],
      permissionKey: PERMISSION_KEYS.VIEW_BATCHES,
    },
    {
      id: 182,
      name: "Batch Reports",
      icon: <PlusSquareIcon />,
      url: "/dashboard/batches/reports",
      role: ["superadmin", "admin", "departmenthead"],
      permissionKey: PERMISSION_KEYS.VIEW_BATCHES,
    },
  ],
},
  {
    id: 19,
    name: "Learner Progress",
    icon: <FiTrendingUp />,
    url: "/dashboard/learner-progress",
    role: ["superadmin", "admin", "departmenthead"],
    permissionKey: PERMISSION_KEYS.VIEW_LEARNER_PROGRESS_RESULTS,
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

const getSidebarDataByRole = (role: string[] = ["admin"], user?: any): SidebarItem[] => {
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

  return filterByRole(sidebarDatas);
};

export { getSidebarDataByRole, sidebarDatas };
