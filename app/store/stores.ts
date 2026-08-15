// store/index.ts
import { authStore } from "./authStore/authStore";
import { batchStore } from "./batchStore/batchStore";
import { bookingStore } from "./bookingStore/bookingStore";
import { CompanyStore } from "./companyStore/companyStore";
import { contactStore } from "./contactStore/contactStore";
import { courseStore } from "./courseStore/courseStore";
import { dashboardStore } from "./dashboardStore/dashboardStore";
import { departmentStore } from "./departmentStore/departmentStore";
import { layoutStore } from './layoutStore/LayoutStore';
import { locationStore } from "./locationStore/locationStore";
import { organizationStore } from "./organizationStore/organizationStore";
import { testimonialStore } from "./testimonialStore/testimonialStore";
import { themeStore } from "./themeStore/themeStore";
import { userStore } from "./userStore/userStore";
import { workforcePolicyStore } from "./workforcePolicyStore/workforcePolicyStore";
const stores = {
  auth : authStore,
  dashboardStore : dashboardStore,
  departmentStore : departmentStore,
  userStore : userStore,
  bookingStore : bookingStore,
  batchStore: batchStore,
  themeStore : themeStore,
  layout : layoutStore,
  locationStore : locationStore,
  organizationStore: organizationStore,
  contactStore : contactStore,
  companyStore : CompanyStore,
  testimonialStore : testimonialStore,
  courseStore:courseStore,
  workforcePolicyStore,
};

export default stores;
