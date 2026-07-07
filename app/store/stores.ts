// store/index.ts
import { authStore } from "./authStore/authStore";
import { batchStore } from "./batchStore/batchStore";
import { bookingStore } from "./bookingStore/bookingStore";
import { CompanyStore } from "./companyStore/companyStore";
import { contactStore } from "./contactStore/contactStore";
import { courseStore } from "./courseStore/courseStore";
import { dashboardStore } from "./dashboardStore/dashboardStore";
import { layoutStore } from './layoutStore/LayoutStore';
import { managerStore } from "./managerStore/managerStore";
import { testimonialStore } from "./testimonialStore/testimonialStore";
import { themeStore } from "./themeStore/themeStore";
import { userStore } from "./userStore/userStore";
const stores = {
  auth : authStore,
  dashboardStore : dashboardStore,
  userStore : userStore,
  bookingStore : bookingStore,
  batchStore: batchStore,
  themeStore : themeStore,
  layout : layoutStore,
  managerStore: managerStore,
  contactStore : contactStore,
  companyStore : CompanyStore,
  testimonialStore : testimonialStore,
  courseStore:courseStore,
};

export default stores;
