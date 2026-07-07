"use client";
import { Box } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import DashPageHeader from "../../component/common/DashPageHeader/DashPageHeader";
import DashPageTitle from "../../component/common/DashPageTitle/DashPageTitle";
import Contactlist from "./ContactList";

const Testimonial = observer(() => {

  return (
    <Box>
      <Box display="none">
        <DashPageHeader
          breadcrumb={[]}
        />
      </Box>
      <DashPageTitle
        title="Our Contact"
        subTitle="What Other peoples thinks about your Organisations"
      />
      <Box>
        <Contactlist
        />
      </Box>
    </Box>
  );
});

export default Testimonial;
