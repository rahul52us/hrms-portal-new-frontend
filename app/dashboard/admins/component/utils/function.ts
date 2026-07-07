import { initialValues, titles } from "./constant";

export const generateIntialValues = (initialData: any) => {
  return {
    ...initialValues,
    ...initialData,
    pic: initialData?.pic?.url ? { file: initialData.pic } : { file: [] },
    title:
      titles.find((it: any) => it.label === initialData.title) || titles[0],
  };
};
