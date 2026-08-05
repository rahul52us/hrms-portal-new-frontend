"use client";

import CustomInput from "../../../../app/component/config/component/customInput/CustomInput";
import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";

type Props = {
  selectedManager: any | null;
  managerCompanyId: string;
  currentUserId?: string;
  createCompany: boolean;
  muted: string;
  borderColor: string;
  onChange: (_value: any) => void;
  isDisabled?: boolean;
};

const ManagerHierarchy = ({
  selectedManager,
  managerCompanyId,
  currentUserId,
  createCompany,
  muted,
  borderColor,
  onChange,
  isDisabled = false,
}: Props) => {
  const email = String(
    selectedManager?.email || selectedManager?.username || ""
  ).trim();
  const isAssigned = Boolean(selectedManager);

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={4}>
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Text fontWeight="semibold">Direct Reporting Manager</Text>
          <Badge colorScheme={isAssigned ? "green" : "gray"}>
            {isAssigned ? "Assigned" : "Optional"}
          </Badge>
        </HStack>

        <CustomInput
          label="Search Reporting Manager"
          type="real-time-user-search"
          name="reportingManager"
          value={selectedManager}
          query={
            managerCompanyId
              ? {
                  companyId: managerCompanyId,
                  purpose: "reporting-manager",
                  excludeUserId: currentUserId || undefined,
                }
              : {}
          }
          isSearchable
          isClear
          placeholder="Search by employee name or email"
          loadOptionsOnMenuOpen
          excludeOptionValues={currentUserId ? [currentUserId] : []}
          excludeUserRoles={["admin", "superadmin"]}
          excludeDisabledUsers
          emptyOptionsMessage="No eligible employees found"
          onChange={(val: any) => onChange(val)}
          disabled={isDisabled || (!managerCompanyId && createCompany)}
        />

        {!managerCompanyId && createCompany ? (
          <Text fontSize="sm" color={muted}>
            Select company first to enable manager search.
          </Text>
        ) : null}

        <Text fontSize="sm" color={muted}>
          Any employee can be selected. They become a manager when someone reports to them.
        </Text>

        {email ? (
          <Text fontSize="sm" color={muted}>
            Selected: {email}
          </Text>
        ) : (
          <Text fontSize="sm" color={muted}>
            Leave empty for a top-level employee.
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default ManagerHierarchy;
