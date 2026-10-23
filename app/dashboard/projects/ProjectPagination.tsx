import { HStack, IconButton, Text, Tooltip } from "@chakra-ui/react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { emptyPage } from "./projectApi";

export default function ProjectPagination({ value, loading, onPage }: { value: typeof emptyPage; loading: boolean; onPage: (page: number) => void }) {
  return <HStack justify="space-between" p={3} flexWrap="wrap" gap={3}>
    <Text fontSize="sm" color="gray.500">{value.total} {value.total === 1 ? "record" : "records"}</Text>
    <HStack><Tooltip label="Previous page"><IconButton aria-label="Previous page" size="sm" variant="outline" icon={<FiChevronLeft />} isDisabled={loading || value.page <= 1} onClick={() => onPage(value.page - 1)} /></Tooltip>
      <Text fontSize="sm">{value.page} / {value.totalPages}</Text>
      <Tooltip label="Next page"><IconButton aria-label="Next page" size="sm" variant="outline" icon={<FiChevronRight />} isDisabled={loading || value.page >= value.totalPages} onClick={() => onPage(value.page + 1)} /></Tooltip></HStack>
  </HStack>;
}
