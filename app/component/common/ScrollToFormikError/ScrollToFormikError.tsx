import { useEffect } from "react";
import { useFormikContext } from "formik";

export default function ScrollToFormikError() {
  const { errors, submitCount } = useFormikContext<any>();

  useEffect(() => {
    // run only AFTER submit
    if (submitCount === 0) return;
    if (!errors || !Object.keys(errors).length) return;

    // get first error key (supports nested later)
    const firstErrorKey = Object.keys(errors)[0];

    const element = document.querySelector(
      `[name="${firstErrorKey}"]`
    ) as HTMLElement;

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      element.focus();
    }
  }, [errors, submitCount]);

  return null;
}
