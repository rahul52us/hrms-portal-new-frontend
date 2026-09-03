"use client";

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  FormControl,
  FormLabel,
  Textarea,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

export default function ArchiveLeaveDialog({
  isOpen,
  onClose,
  title,
  description,
  submitting,
  onConfirm,
  reasonLabel = "Archive reason",
  confirmLabel = "Archive",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  submitting: boolean;
  onConfirm: (reason: string) => Promise<void>;
  reasonLabel?: string;
  confirmLabel?: string;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="800">{title}</AlertDialogHeader>
          <AlertDialogBody>
            {description}
            <FormControl mt={4} isRequired>
              <FormLabel fontSize="sm">{reasonLabel}</FormLabel>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
            </FormControl>
          </AlertDialogBody>
          <AlertDialogFooter gap={3}>
            <Button ref={cancelRef} variant="ghost" onClick={onClose}>Cancel</Button>
            <Button colorScheme="red" onClick={() => onConfirm(reason.trim())} isLoading={submitting} isDisabled={reason.trim().length < 3}>{confirmLabel}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
