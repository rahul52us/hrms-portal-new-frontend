"use client";

import CustomInput from "../../../../app/component/config/component/customInput/CustomInput";
import {
  Badge,
  Box,
  Flex,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
// import CustomInput from "../../component/config/component/customInput/CustomInput";

const COLORS = ["blue", "purple", "orange", "green", "pink", "cyan"];

type ManagerRow = {
  level: number;
  selectedManager: any | null;
};

type Props = {
  managers: ManagerRow[];
  role: string;
  managerCompanyId: string;
  createCompany: boolean;
  muted: string;
  borderColor: string;
  onChange: (index: number, value: any) => void;
  isDisabled?: boolean;
};

const ManagerHierarchy = ({
  managers,
  role,
  managerCompanyId,
  createCompany,
  muted,
  borderColor,
  onChange,
  isDisabled = false,
}: Props) => {
  const normalizeEmail = (value: any) =>
    String(value || "").trim().toLowerCase();

  if (managers.length === 0) {
    return (
      <Box borderWidth="1px" borderColor={borderColor} p={4} borderRadius="lg">
        <Text fontSize="sm" color={muted}>
          No manager required for this role.
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      {managers.map((manager, index) => {
        const email = normalizeEmail(
          manager.selectedManager?.email ||
            manager.selectedManager?.username
        );

        const isAssigned =
          manager.selectedManager &&
          !String(manager.selectedManager?.value || "").startsWith("pending:");

        return (
          <Box
            key={manager.level}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="xl"
            p={4}
          >
            <Flex justify="space-between" align="center" mb={3}>
              <HStack>
                <Badge colorScheme={COLORS[index % COLORS.length]}>
                  L{manager.level}
                </Badge>
                <Text fontWeight="semibold">
                  L{manager.level} Manager
                </Text>
              </HStack>

              <Badge
                colorScheme={
                  isAssigned ? "green" : email ? "orange" : "gray"
                }
              >
                {isAssigned
                  ? "Assigned"
                  : email
                  ? "Pending"
                  : "Optional"}
              </Badge>
            </Flex>

            <CustomInput
              label={`Search L${manager.level} Manager`}
              type="real-time-user-search"
              name="search"
              value={manager.selectedManager}
              query={
                managerCompanyId ? { companyId: managerCompanyId } : {}
              }
              isSearchable
              isClear
              onChange={(val: any) => onChange(index, val)}
              disabled={isDisabled || (!managerCompanyId && createCompany)}
            />

            {!managerCompanyId && createCompany && (
              <Text fontSize="sm" color={muted} mt={2}>
                Select company first to enable manager search
              </Text>
            )}

            {email && (
              <Text fontSize="sm" color={muted} mt={2}>
                Selected: {email}
              </Text>
            )}
          </Box>
        );
      })}
    </VStack>
  );
};

export default ManagerHierarchy;
