import { initialValues, titles } from "./constant";

export const generateIntialValues = (initialData: any) => {
  return {
    ...initialValues,
    ...initialData,
    pic: initialData?.pic?.url ? { file: initialData.pic } : { file: [] },
    aboutMe: initialData.aboutMe || initialValues.aboutMe,
    affiliations: initialData.affiliations || initialValues.affiliations,
    services: initialData.services || initialValues.services,
    conditions: initialData.conditions || initialValues.conditions,
    stats: initialData.stats || initialValues.stats,
    availability: initialData.availability || [],
    title:
      titles.find((it: any) => it.label === initialData.title) || titles[0],
  };
};
