export const handleFormikSubmitError = (
  errors: any,
  toast: any,
  options?: {
    scroll?: boolean;
    maxMessages?: number;
  }
) => {
  if (!errors || !Object.keys(errors).length) return;

  const messages: string[] = [];

  const collectErrors = (obj: any) => {
    Object.values(obj).forEach((val) => {
      if (typeof val === "string") {
        messages.push(val);
      } else if (typeof val === "object") {
        collectErrors(val);
      }
    });
  };

  collectErrors(errors);

  // 🔝 Scroll to top
  if (options?.scroll !== false) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 🔔 Toast
  toast({
    title: "Please fix the following",
    description: messages.slice(0, options?.maxMessages || 3).join(", "),
    status: "error",
    duration: 4000,
    isClosable: true,
  });
};
