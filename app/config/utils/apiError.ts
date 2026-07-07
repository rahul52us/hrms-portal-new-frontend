const collectErrorMessages = (value: any, messages: string[]) => {
  if (!value) {
    return;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (trimmedValue) {
      messages.push(trimmedValue);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectErrorMessages(item, messages));
    return;
  }

  if (typeof value === "object") {
    if (typeof value.error === "string") {
      collectErrorMessages(value.error, messages);
    }

    if (typeof value.message === "string") {
      collectErrorMessages(value.message, messages);
    }

    if ("data" in value) {
      collectErrorMessages(value.data, messages);
    }
  }
};

export const getApiErrorMessage = (
  error: any,
  fallback = "Please try again."
) => {
  const messages: string[] = [];
  collectErrorMessages(error, messages);

  const uniqueMessages = Array.from(new Set(messages));
  return uniqueMessages[0] || fallback;
};
