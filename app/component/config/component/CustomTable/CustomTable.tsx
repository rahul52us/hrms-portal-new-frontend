"use client";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBreakpointValue,
  useColorModeValue,
  ScaleFade,
  HStack,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import React from "react";
import { FaEdit, FaEye } from "react-icons/fa";
import { FcClearFilters } from "react-icons/fc";
import { IoMdAdd, IoMdInformationCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { formatDate } from "../../utils/dateUtils";
import Pagination from "../pagination/Pagination";
import TableLoader from "./TableLoader";

const MultiDropdown = dynamic(() => import("../multiDropdown/MultiDropdown"), { ssr: false });
const CustomDateRange = dynamic(() => import("../CustomDateRange/CustomDateRange"), { ssr: false });

interface Column {
  headerName?: string;
  key?: string;
  type?: string;
  function?: any;
  addkey?: any;
  props?: any;
  actions?: any;
  metaData?: { component?: any; function?: any };
}

interface RowData { [key: string]: any; }

interface CustomTableProps {
  title?: string;
  columns: Column[];
  data: RowData[];
  serial?: any;
  loading: boolean;
  totalPages?: number;
  actions?: any;
  cells?: boolean;
  tableProps?: any;
  subTitle?: any;
}

const TableActions: React.FC<any> = ({ actions, column, row }) => {
  const { actionBtn } = actions || {};
  const iconColor = useColorModeValue("gray.600", "gray.300");

  return (
    <Td
      position={column?.props?.isSticky ? "sticky" : "relative"}
      right={column?.props?.isSticky ? "0" : undefined}
      zIndex={column?.props?.isSticky ? 10 : undefined}
      bg={useColorModeValue("white", "gray.900")}
      p={1}
      textAlign="center"
    >
      <HStack gap={1} justify="center">
        {actionBtn?.editKey?.showEditButton && (
          <Tooltip label={actionBtn?.editKey?.title || "Edit"} hasArrow placement="top">
            <IconButton
              aria-label="edit"
              icon={<FaEdit />}
              size="sm"
              variant="ghost"
              color={iconColor}
              _hover={{
                bg: "blue.50",
                color: "blue.600",
                transform: "scale(1.12) rotate(8deg)",
              }}
              transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              onClick={(e) => {
                e.stopPropagation();
                actionBtn?.editKey?.function?.(row);
              }}
            />
          </Tooltip>
        )}

        {actionBtn?.viewKey?.showViewButton && (
          <Tooltip label={actionBtn?.viewKey?.title || "View"} hasArrow placement="top">
            <IconButton
              aria-label="view"
              icon={<FaEye />}
              size="sm"
              variant="ghost"
              color={iconColor}
              _hover={{
                bg: "purple.50",
                color: "purple.600",
                transform: "scale(1.12)",
              }}
              transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              onClick={(e) => {
                e.stopPropagation();
                actionBtn?.viewKey?.function?.(row);
              }}
            />
          </Tooltip>
        )}

        {actionBtn?.deleteKey?.showDeleteButton && (
          <Tooltip label={actionBtn?.deleteKey?.title || "Delete"} hasArrow placement="top">
            <IconButton
              aria-label="delete"
              icon={<MdDelete />}
              size="sm"
              variant="ghost"
              color={useColorModeValue("red.500", "red.400")}
              _hover={{
                bg: "red.50",
                color: "red.600",
                transform: "scale(1.12)",
              }}
              transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              onClick={(e) => {
                e.stopPropagation();
                actionBtn?.deleteKey?.function?.(row);
              }}
            />
          </Tooltip>
        )}
      </HStack>
    </Td>
  );
};

const GenerateRows: React.FC<any> = ({ column, row, action, cells }) => {
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");

  const baseCellProps = {
    py: 3,
    px: 5,
    fontSize: "sm",
    color: textColor,
    borderBottom: `1px solid ${borderColor}`,
    transition: "background 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    _hover: { bg: useColorModeValue("blue.50", "gray.800") },
    whiteSpace: "nowrap" as const,
  };

  switch (column.type) {
    case "date":
      return (
        <Td {...baseCellProps}>
          {row[column.key] ? formatDate(row[column.key]) : "--"}
        </Td>
      );

    case "link":
      return (
        <Td
          {...baseCellProps}
          color="blue.500"
          fontWeight="medium"
          cursor="pointer"
          _hover={{ color: "blue.600", textDecoration: "underline" }}
          onClick={() => column?.function?.(row)}
        >
          {row[column.key] || "--"}
        </Td>
      );

    case "tooltip":
      return (
        <Td {...baseCellProps}>
          <Tooltip label={row[column.key]} hasArrow placement="top">
            <Text isTruncated maxW="180px" fontWeight="medium">
              {typeof row[column.key] === "string" ? row[column.key].substring(0, 28) : "--"}
            </Text>
          </Tooltip>
        </Td>
      );

    case "array":
      return (
        <Td {...baseCellProps} textAlign="center">
          <Tooltip label={JSON.stringify(row[column.key], null, 2)} hasArrow>
            <IconButton
              aria-label="info"
              icon={<IoMdInformationCircle />}
              size="sm"
              variant="ghost"
              color="gray.500"
              _hover={{ color: "blue.500", transform: "rotate(12deg)" }}
              transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
            />
          </Tooltip>
        </Td>
      );

    case "table-actions":
      return <TableActions actions={action} column={column} row={row} />;

    case "component":
      return <Td {...baseCellProps}>{column.metaData?.component ? column.metaData.component(row) : null}</Td>;

    default:
      return (
        <Td {...baseCellProps} isTruncated maxW="220px" fontWeight="medium">
          {row[column.key] || "--"}
        </Td>
      );
  }
};

const CustomTable: React.FC<CustomTableProps> = ({
  title,
  columns,
  data,
  serial,
  loading,
  actions,
  cells = false,
  tableProps = {},
  subTitle,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  const cardBg = useColorModeValue("white", "gray.900");
  const headerBg = useColorModeValue("gray.50", "gray.800");
  const accent = useColorModeValue("blue.600", "blue.400");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const rowHover = useColorModeValue("blue.50", "gray.800");

  return (
    <Box
      bg={cardBg}
      borderRadius="3xl"
      boxShadow="0 10px 40px -15px rgba(0, 0, 0, 0.15)"
      border="1px solid"
      borderColor={borderColor}
      overflow="hidden"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      // _hover={{ boxShadow: "0 25px 50px -15px rgba(0, 0, 0, 0.18)" }}
    >
      {/* HEADER */}
      <Flex
        justify="space-between"
        align="center"
        px={6}
        py={5}
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={borderColor}
      >
        <Flex direction="column" gap={0.5}>
          {title && (
            <Heading
              size="md"
              color={accent}
              fontWeight="600"
              letterSpacing="-0.02em"
            >
              {title}
            </Heading>
          )}
          {subTitle && (
            <Text fontSize="sm" color="gray.500" noOfLines={1}>
              {subTitle}
            </Text>
          )}
        </Flex>

        <Flex align="center" gap={3} ml="auto" flexWrap="wrap">
          {!isMobile && actions?.search?.show && (
            <Input
              placeholder={actions?.search?.placeholder || "Search..."}
              value={actions?.search?.searchValue}
              onChange={actions?.search?.onSearchChange}
              size="md"
              width="260px"
              borderRadius="full"
              bg={useColorModeValue("white", "gray.800")}
              borderColor={borderColor}
              _focus={{
                borderColor: accent,
                boxShadow: "0 0 0 4px rgba(49, 130, 206, 0.15)",
              }}
              transition="all 0.2s ease"
            />
          )}

          {actions?.datePicker?.show && !isMobile && (
            <CustomDateRange
              startDate={actions?.datePicker?.date?.startDate}
              endDate={actions?.datePicker?.date?.endDate}
              onStartDateChange={(e: any) => actions?.datePicker?.onDateChange?.(e, "startDate")}
              onEndDateChange={(e: any) => actions?.datePicker?.onDateChange?.(e, "endDate")}
            />
          )}

          {actions?.multidropdown?.show && <MultiDropdown {...actions?.multidropdown} />}

          {(actions?.actionBtn?.addKey?.showAddButton || actions?.resetData?.show) && (
            <>
              {actions?.actionBtn?.addKey?.showAddButton && actions?.resetData?.show ? (
                <Menu>
                  <MenuButton
                    as={Button}
                    colorScheme="blue"
                    borderRadius="full"
                    leftIcon={<IoMdAdd />}
                    size="md"
                    _hover={{ transform: "translateY(-1px)", shadow: "lg" }}
                    transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  >
                    Actions
                  </MenuButton>
                  <MenuList borderRadius="2xl" py={2} shadow="xl">
                    <MenuItem
                      onClick={() => actions?.actionBtn?.addKey?.function?.("add")}
                      icon={<IoMdAdd />}
                      fontWeight="medium"
                    >
                      Add New
                    </MenuItem>
                    <MenuItem
                      onClick={actions?.resetData?.function}
                      icon={<FcClearFilters />}
                      fontWeight="medium"
                    >
                      {actions?.resetData?.text || "Reset Filters"}
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <>
                  {actions?.actionBtn?.addKey?.showAddButton && (
                    <Button
                      colorScheme="blue"
                      borderRadius="full"
                      leftIcon={<IoMdAdd />}
                      size="md"
                      _hover={{ transform: "translateY(-1px)", shadow: "lg" }}
                      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                      onClick={() => actions?.actionBtn?.addKey?.function?.("add")}
                    >
                      Add New
                    </Button>
                  )}
                  {actions?.resetData?.show && (
                    <Button
                      variant="outline"
                      borderRadius="full"
                      leftIcon={<FcClearFilters />}
                      size="md"
                      onClick={actions?.resetData?.function}
                    >
                      Reset
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </Flex>
      </Flex>

      {/* TABLE */}
      <Box
        overflow="auto"
        maxH="64vh"
        className="customScrollBar"
        px={3}
        py={1}
        {...tableProps.tableBox}
      >
        <ScaleFade in={!loading} initialScale={0.98}>
          <Table
            size="sm"
            variant="simple"
            bg={cardBg}
            {...tableProps.table}
          >
            <Thead bg={headerBg} position="sticky" top={0} zIndex={20}>
              <Tr>
                {serial?.show && (
                  <Th
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    color="gray.500"
                    fontWeight="600"
                    py={4}
                    px={5}
                  >
                    {serial?.text || "#"}
                  </Th>
                )}

                {columns.map((col, idx) => (
                  <Th
                    key={idx}
                    textAlign="left"
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    color="gray.500"
                    fontWeight="600"
                    py={4}
                    px={5}
                    position={col?.props?.isSticky ? "sticky" : undefined}
                    right={col?.props?.isSticky ? 0 : undefined}
                    bg={headerBg}
                    zIndex={col?.props?.isSticky ? 10 : undefined}
                    borderBottom="2px solid"
                    borderColor={useColorModeValue("blue.200", "gray.700")}
                  >
                    {col.headerName}
                  </Th>
                ))}
              </Tr>
            </Thead>

            <TableLoader loader={loading} show={data.length}>
              <Tbody>
                {data.map((row, rowIndex) => (
                  <Tr
                    key={rowIndex}
                    _hover={{
                      bg: rowHover,
                      transform: "scale(1.008)",
                    }}
                    transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                    cursor="pointer"
                  >
                    {serial?.show && (
                      <Td
                        fontWeight="600"
                        color="gray.400"
                        py={3}
                        px={5}
                        fontSize="sm"
                      >
                        {rowIndex + 1}
                      </Td>
                    )}

                    {columns.map((column, colIndex) => (
                      <GenerateRows
                        key={colIndex}
                        column={column}
                        row={row}
                        action={actions}
                        cells={cells}
                      />
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </TableLoader>
          </Table>
        </ScaleFade>
      </Box>

      {/* PAGINATION */}
      {actions?.pagination?.show && (
        <Box
          px={6}
          py={4}
          borderTop="1px solid"
          borderColor={borderColor}
          bg={headerBg}
        >
          <Pagination
            currentPage={actions?.pagination?.currentPage || 1}
            totalPages={actions?.pagination?.totalPages || 1}
            onPageChange={actions?.pagination?.onClick}
          />
        </Box>
      )}
    </Box>
  );
};

export default CustomTable;