"use client";
import axios from "axios";
import { Button, ButtonProps, useToast } from "@chakra-ui/react";
import { useState } from "react";

export function isPrivateDocumentUrl(url: string) {
  return /^\/leave\/attachments\/[a-f0-9]{24}\/download$/i.test(url) || /^\/user\/updateDocuments\/[a-f0-9]{24}\/files\/[a-f0-9]{24}$/i.test(url);
}
export default function DocumentDownloadButton({ url, name, companyId, children, ...props }: Omit<ButtonProps, "as" | "href" | "onClick"> & { url: string; name: string; companyId?: string }) {
  const toast = useToast(), [loading, setLoading] = useState(false);
  const download = async () => {
    setLoading(true);
    try {
      const response = await axios.get(url, { params: companyId ? { companyId } : undefined, responseType: "blob" });
      const objectUrl = URL.createObjectURL(response.data), link = document.createElement("a");
      link.href = objectUrl; link.download = name; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch { toast({ title: "Unable to download document", description: "Check your access or try again after storage is available.", status: "error", isClosable: true }); }
    finally { setLoading(false); }
  };
  if (isPrivateDocumentUrl(url)) return <Button title={`Download ${name}`} maxW="100%" whiteSpace="normal" height="auto" py={2} {...props} isLoading={loading} onClick={() => void download()}>{children || name}</Button>;
  // Never send our Authorization header to legacy external file hosts.
  if (/^https:\/\//i.test(url)) return <Button maxW="100%" whiteSpace="normal" height="auto" py={2} {...props} as="a" href={url} target="_blank" rel="noopener noreferrer">{children || name}</Button>;
  return <Button {...props} isDisabled>{children || name}</Button>;
}
