import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import stores from "../../../../../store/stores";
import FormModel from "../../../../../component/common/FormModel/FormModel";

const DeleteData = ({ getData, data, isOpen, onClose }: any) => {
  const {
    userStore: { deleteUser },
    auth: { openNotification },
  } = stores;
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const textColor = useColorModeValue("gray.900", "white");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = (status: boolean) => {
    setDeleteLoading(true);
    deleteUser({ _id: data._id, deleted: status })
      .then((data: any) => {
        openNotification({
          title: "Deleted Successfully",
          message: data.message,
        });
        getData();
        onClose();
      })
      .catch((err: any) => {
        openNotification({
          title: "Delete Failed",
          message: err?.message,
          type: "error",
        });
      })
      .finally(() => {
        setDeleteLoading(false);
      });
  };

  return (
    <FormModel
      isCentered
      open={isOpen}
      close={onClose}
      title="Confirm Delete"
      size="md"
    >
      <Box p={5} textAlign="center">
        <Text mb={3} fontSize="md" fontWeight="medium" color={textColor}>
          Are you sure you want to{" "}
          <Text as="span" fontWeight="bold" color={"red.400"}>
            Delete
          </Text>
          ?
        </Text>
        <Text fontSize="xs" color={subtitleColor}>
          This action cannot be undone.
        </Text>
      </Box>

      <Flex
        justify="space-between"
        align="center"
        p={4}
        borderTopWidth="1px"
        borderColor={borderColor}
      >
        <HStack spacing={3}>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={() => {
              handleDelete(true);
            }}
            borderRadius="full"
            fontWeight="medium"
            size="sm"
            px={4}
            isLoading={deleteLoading}
            _hover={{ bg: "red.50" }}
          >
            Delete
          </Button>
        </HStack>
        <Button
          variant="ghost"
          onClick={onClose}
          color={subtitleColor}
          borderRadius="full"
          fontWeight="medium"
          size="sm"
          px={4}
          _hover={{ bg: "gray.100" }}
        >
          Cancel
        </Button>
      </Flex>
    </FormModel>
  );
};

export default DeleteData;
