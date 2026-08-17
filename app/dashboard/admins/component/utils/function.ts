import { initialValues } from "./constant";

export const generateIntialValues = (initialData: any) => {
  return {
    ...initialValues,
    ...initialData,
    pic: initialData?.pic?.url ? { file: initialData.pic } : { file: [] },
  };
};
