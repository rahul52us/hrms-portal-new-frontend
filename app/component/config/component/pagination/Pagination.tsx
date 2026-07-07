'use client'
import ReactPaginate from "react-paginate";
import { Box, Flex, IconButton, useColorModeValue } from "@chakra-ui/react";
import { MdFirstPage, MdLastPage, MdNavigateBefore, MdNavigateNext } from "react-icons/md";

interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  [key: string]: any; // Accommodates additional layout props
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  ...props
}: PaginationProps) => {
  // Dynamic color variables for elegant Light/Dark mode support
  const hoverBg = useColorModeValue("gray.100", "whiteAlpha.200");
  const activeBg = useColorModeValue("blue.500", "blue.400"); 
  const activeColor = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const disabledColor = useColorModeValue("gray.400", "whiteAlpha.400");

  const handlePageChange = (selectedItem: { selected: number }) => {
    onPageChange(selectedItem.selected + 1);
  };

  // Do not render if there's no need for pagination
  if (!totalPages || totalPages <= 1) return null;

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      mb={4}
      {...props}
    >
      <Flex alignItems="center" gap={2}>
        {/* First Page Button */}
        <IconButton
          aria-label="First page"
          icon={<MdFirstPage size="20px" />}
          onClick={() => onPageChange(1)}
          isDisabled={currentPage === 1}
          variant="ghost"
          size="sm"
          borderRadius="md"
          color={textColor}
          _hover={{ bg: hoverBg }}
        />

        {/* React Paginate Container styled with Chakra's sx */}
        <Box
          sx={{
            ".pagination": {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px", // Even spacing between numbers
              listStyle: "none",
              p: 0,
              m: 0,
            },
            ".pagination li a": {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minW: "32px",
              h: "32px",
              px: 2,
              borderRadius: "md",
              fontSize: "sm",
              fontWeight: "500",
              color: textColor,
              cursor: "pointer",
              transition: "all 0.2s ease",
              _hover: {
                bg: hoverBg,
                color: useColorModeValue("teal.600", "teal.300"), // Accent text color on hover
              },
            },
            ".pagination li.paginationActive a": {
              bg: activeBg,
              color: activeColor,
              _hover: {
                bg: activeBg,
                color: activeColor,
                transform: "translateY(-1px)", // Subtle lift effect
                boxShadow: "sm",
              },
            },
            ".pagination li.paginationDisabled a": {
              color: disabledColor,
              cursor: "not-allowed",
              _hover: {
                bg: "transparent",
                color: disabledColor,
              },
            },
            ".paginationLink": {
              outline: "none", // Removes default focus outlines for a cleaner click
            }
          }}
        >
          <ReactPaginate
            previousLabel={<MdNavigateBefore size="20px" />}
            nextLabel={<MdNavigateNext size="20px" />}
            breakLabel="..."
            pageCount={totalPages}
            forcePage={currentPage - 1}
            onPageChange={handlePageChange}
            containerClassName="pagination"
            disabledClassName="paginationDisabled"
            activeClassName="paginationActive"
            pageRangeDisplayed={3} // Slightly smaller range looks cleaner on mobile devices
            marginPagesDisplayed={1}
          />
        </Box>

        {/* Last Page Button */}
        <IconButton
          aria-label="Last page"
          icon={<MdLastPage size="20px" />}
          onClick={() => onPageChange(totalPages)}
          isDisabled={currentPage === totalPages}
          variant="ghost"
          size="sm"
          borderRadius="md"
          color={textColor}
          _hover={{ bg: hoverBg }}
        />
      </Flex>
    </Flex>
  );
};

export default Pagination;