"use client";

import { Box } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import HeroSection from "../../component/common/HeroSection/HeroSection";

const Home = observer(() => {
  return (
    <Box>
      <HeroSection />
    </Box>
  );
});

export default Home;
