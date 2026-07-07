"use client";
import { Box } from "@chakra-ui/react";
import { useState } from "react";
import CustomButton from "../../../../../component/common/CustomButton/CustomButton";
// import AppointmentModal from "../../../../../component/common/AppointmentModal/AppointmentModal";

const HeroNavButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box>
      <CustomButton width={"180px"} size={"lg"} onClick={() => setIsOpen(true)}>
        Book Appointment
      </CustomButton>
      {/* <AppointmentModal isOpen={isOpen} onClose={() => setIsOpen(false)} pageLink="Navbar"/> */}
    </Box>
  );
};

export default HeroNavButton;
