"use client";
import { Alert, AlertIcon, Box, Button, FormControl, FormHelperText, FormLabel, HStack, Select, Stack, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FiDownload } from "react-icons/fi";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { assetFailure, assetLabelPdf, AssetLabelSelection } from "./assetApi";

export default function AssetLabelsDrawer({ assets, onClose }: { assets: AssetLabelSelection[]; onClose: () => void }) {
  const [layout, setLayout] = useState<"a4" | "single">(assets.length === 1 ? "single" : "a4"), [start, setStart] = useState(1), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  const download = async () => {
    if (busy) return;
    const controller = new AbortController(); request.current = controller; setBusy(true); setError("");
    try {
      const bytes = await assetLabelPdf(assets.map(asset => asset._id), layout, start, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(bytes), link = document.createElement("a"); link.href = url; link.download = "asset-labels.pdf"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { if (!controller.signal.aborted) setError(assetFailure(err)); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  };
  const pages = layout === "single" ? 1 : Math.ceil((assets.length + start - 1) / 12);
  return <DashboardDrawer isOpen onClose={() => { if (!busy) onClose(); }} titlePrefix="Asset labels" maxW={{ base: "100%", md: "620px" }} footerContent={<HStack justify="end" w="100%"><Button variant="ghost" isDisabled={busy} onClick={onClose}>Close</Button><Button colorScheme="blue" leftIcon={<FiDownload />} isLoading={busy} onClick={() => void download()}>Download PDF</Button></HStack>}>
    <Stack spacing={5}>
      {error && <Alert status="error"><AlertIcon />{error}</Alert>}
      <FormControl><FormLabel htmlFor="asset-label-layout">Print layout</FormLabel><Select id="asset-label-layout" value={layout} isDisabled={busy} onChange={(event) => { setLayout(event.target.value as "a4" | "single"); setStart(1); }}><option value="a4">A4 sheet - 12 labels</option>{assets.length === 1 && <option value="single">Single label - 90 x 42 mm</option>}</Select><FormHelperText>{layout === "a4" ? "90 x 42 mm labels, 2 columns and 6 rows. Print at actual size (100%)." : "90 x 42 mm page. Print at actual size (100%)."}</FormHelperText></FormControl>
      {layout === "a4" && <FormControl><FormLabel htmlFor="asset-label-first-position">First unused position</FormLabel><Select id="asset-label-first-position" value={start} isDisabled={busy} onChange={(event) => setStart(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index} value={index + 1}>{index + 1} - Row {Math.floor(index / 2) + 1}, {index % 2 === 0 ? "left" : "right"}</option>)}</Select><FormHelperText>Earlier positions on the first sheet stay blank.</FormHelperText></FormControl>}
      <Text fontSize="sm">{assets.length} labels | {pages} {pages === 1 ? "page" : "pages"}</Text>
      <Stack spacing={0}>{assets.map(asset => <Box key={asset._id} borderBottomWidth="1px" py={3}><Text fontWeight="600" fontSize="sm" overflowWrap="anywhere">{asset.tag}</Text><Text fontSize="sm" overflowWrap="anywhere">{asset.name}</Text></Box>)}</Stack>
    </Stack>
  </DashboardDrawer>;
}
