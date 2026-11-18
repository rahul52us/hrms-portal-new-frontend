"use client";
import { Alert, AlertIcon, Button, FormControl, FormHelperText, FormLabel, Input, Stack } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { FiSearch } from "react-icons/fi";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { assetFailure } from "./assetApi";

export default function AssetScanDrawer({ onClose, onOpen }: { onClose: () => void; onOpen: (id: string) => void }) {
  const [code, setCode] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  const lookup = async () => {
    if (busy || !code.trim()) return;
    const controller = new AbortController(); request.current = controller; setBusy(true); setError("");
    try { const result = await axios.post("/assets/inventory/lookup", { code: code.trim() }, { signal: controller.signal }); if (!controller.signal.aborted) onOpen(result.data.data._id); }
    catch (err) { if (!controller.signal.aborted) setError(assetFailure(err)); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  };
  return <DashboardDrawer isOpen onClose={() => { if (!busy) onClose(); }} titlePrefix="Scan asset" maxW={{ base: "100%", md: "620px" }}>
    <Stack as="form" spacing={5} onSubmit={(event) => { event.preventDefault(); void lookup(); }}>
      {error && <Alert status="error"><AlertIcon />{error}</Alert>}
      <FormControl isRequired><FormLabel htmlFor="asset-scan-code">QR code or exact asset tag</FormLabel><Input id="asset-scan-code" autoFocus autoComplete="off" maxLength={120} value={code} isDisabled={busy} onChange={(event) => { setCode(event.target.value); setError(""); }} /><FormHelperText>Use a USB/Bluetooth QR scanner, paste its result, or enter the asset tag.</FormHelperText></FormControl>
      <Button type="submit" colorScheme="blue" alignSelf="start" leftIcon={<FiSearch />} isLoading={busy} isDisabled={!code.trim()}>Open asset</Button>
    </Stack>
  </DashboardDrawer>;
}
