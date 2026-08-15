"use client";

import { PageBanner } from "../../../component/common/PageBanner/PageBanner";
import { Button, HStack, Icon, useColorModeValue } from "@chakra-ui/react";
import { FiUpload, FiUserPlus, FiUsers } from "react-icons/fi";

type Props = {
  onOpenBulk: () => void;
  onOpenCreate: () => void;
  borderColor: string;
  muted: string;
  canOpenBulk?: boolean;
  canOpenCreate?: boolean;
  totalUsers?: number;
  activeUsers?: number;
};

const UsersHeader = ({
  onOpenBulk,
  onOpenCreate,
  canOpenBulk = true,
  canOpenCreate = true,
  totalUsers = 0,
}: Props) => {
  const outlineButtonHoverBg = useColorModeValue("purple.50", "gray.700");
  const gradientFrom = useColorModeValue("blue.600", "blue.400");
  const gradientTo = useColorModeValue("purple.600", "purple.400");

  return (
    <PageBanner
      titlePrefix="EMPLOYEE"
      titleHighlight="DIRECTORY"
      subtitle="MANAGE EMPLOYEES, REPORTING LINES AND ONBOARDING"
      icon={FiUsers}
      statLabel={`${totalUsers} EMPLOYEES`}
      statIcon={FiUsers}
      showBackButton={false}
      colorScheme="purple"
    >
      <HStack
        spacing={3}
        flexWrap="wrap"
      >
        {canOpenBulk && (
          <Button
            leftIcon={<Icon as={FiUpload} />}
            variant="outline"
            onClick={onOpenBulk}
            size="md"
            borderRadius="full"
            borderWidth="2px"
            borderColor="purple.400"
            color="purple.500"
            _hover={{
              bg: outlineButtonHoverBg,
              borderColor: "purple.500",
              transform: "translateY(-1px)",
              boxShadow: "sm",
            }}
            _active={{ transform: "translateY(0)" }}
            transition="all 0.2s"
          >
            Excel Upload
          </Button>
        )}

        {canOpenCreate && (
          <Button
            leftIcon={<Icon as={FiUserPlus} />}
            onClick={onOpenCreate}
            size="md"
            borderRadius="full"
            bgGradient={`linear(to-r, ${gradientFrom}, ${gradientTo})`}
            color="white"
            _hover={{
              bgGradient: `linear(to-r, blue.500, purple.500)`,
              transform: "translateY(-1px)",
              boxShadow: "md",
            }}
            _active={{ transform: "translateY(0)" }}
            transition="all 0.2s"
          >
            Add Employee
          </Button>
        )}
      </HStack>
    </PageBanner>
  );
};

export default UsersHeader;
