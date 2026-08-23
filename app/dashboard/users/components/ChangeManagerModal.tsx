import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import ManagerHierarchy from "./ManagerHierarchy";
import { observer } from "mobx-react-lite";
import stores from "../../../store/stores";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onRefresh: () => void;
};

const ChangeManagerModal = observer(({ isOpen, onClose, user, onRefresh }: Props) => {
  const { userStore, auth } = stores;
  const [selectedManager, setSelectedManager] = useState<any>(null);
  
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const bg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    if (isOpen && user) {
      if (user.reportingManager) {
        setSelectedManager(
          typeof user.reportingManager === 'object' ? user.reportingManager._id : user.reportingManager
        );
      } else {
        setSelectedManager(null);
      }
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!user?._id) return;
    try {
      const managerId = typeof selectedManager === 'object' ? (selectedManager?.value || selectedManager?._id) : selectedManager;
      await userStore.updateReportingManager(user._id, managerId || null);
      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const getCompanyId = (u: any) => {
    if (!u) return undefined;
    if (u.company && typeof u.company === 'object') return u.company._id || u.company.id;
    if (typeof u.company === 'string') return u.company;
    if (u.companyId && typeof u.companyId === 'object') return u.companyId._id || u.companyId.id;
    if (typeof u.companyId === 'string') return u.companyId;
    
    // Fallback for non-superadmin HRs where the user list might not populate company
    if (auth?.company) return auth.company;
    return undefined;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg={bg} borderRadius="2xl">
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
          Change Reporting Manager
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody py={6}>
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between">
              <Text fontWeight="medium" fontSize="sm">Employee:</Text>
              <Badge colorScheme="blue">{user?.name || user?.username}</Badge>
            </HStack>
            
            <ManagerHierarchy
              selectedManager={selectedManager}
              managerCompanyId={getCompanyId(user)}
              createCompany={false}
              muted={muted}
              borderColor={borderColor}
              onChange={(val) => setSelectedManager(val)}
            />
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={borderColor} gap={3}>
          <Button variant="ghost" onClick={onClose} isDisabled={userStore.submitting}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={userStore.submitting}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

export default ChangeManagerModal;
