import { Box, Flex, IconButton, Image } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { FaLongArrowAltLeft, FaLongArrowAltRight } from "react-icons/fa";

const NewCarousel = ({
  images = ["/images/profile/availImage.png"],
  autoSwipeInterval = 3000, // Default 3 seconds between slides
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const autoSwipeTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle next slide (Moved above resetAutoSwipeTimer to fix dependency issue)
  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  }, [images.length]);

  // Reset auto-swipe timer
  const resetAutoSwipeTimer = useCallback(() => {
    if (autoSwipeTimer.current) {
      clearTimeout(autoSwipeTimer.current);
    }
    autoSwipeTimer.current = setTimeout(handleNext, autoSwipeInterval);
  }, [autoSwipeInterval, handleNext]);

  // Handle previous slide
  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    resetAutoSwipeTimer();
  }, [images.length, resetAutoSwipeTimer]);

  // Setup auto-swipe on component mount
  useEffect(() => {
    autoSwipeTimer.current = setTimeout(handleNext, autoSwipeInterval);

    return () => {
      if (autoSwipeTimer.current) {
        clearTimeout(autoSwipeTimer.current);
      }
    };
  }, [currentIndex, images.length, autoSwipeInterval, handleNext]);

  // Get previous and next images for the side panels
  const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
  const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;

  // Variants for the slide animations
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
      },
    },
    exit: (direction) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.5,
      },
    }),
  };

  return (
    <Box mx={{ lg: 12 }} overflow="hidden">
      <Flex align="center" justify="center" position="relative">
        {/* Left side image (previous) */}
        <Image
          alt="Previous"
          h={["200px", "250px"]}
          rounded="xl"
          w={["200px", "300px"]}
          zIndex={-1}
          src={images[prevIndex]}
          opacity="0.4"
          mr={{ base: "-10rem", lg: "-11rem" }}
        />

        {/* Main center image with animations */}
        <Box position="relative" width={["220px", "290px"]} height={["220px", "280px"]}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
              }}
            >
              <Image
                alt="Current"
                h="100%"
                w="100%"
                rounded="xl"
                src={images[currentIndex]}
                objectFit="cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <IconButton
            ml="-1rem"
            aria-label="Prev"
            isRound
            position="absolute"
            icon={<FaLongArrowAltLeft />}
            top="50%"
            transform="translateY(-50%)"
            left={0}
            zIndex={2}
            bg={'white'}
            _hover={{ bg: "#DF837C", color: 'white' }}
            color={'black'}
            onClick={handlePrev}
          />
          <IconButton
            mr="-1rem"
            aria-label="Next"
            isRound
            _hover={{ bg: "#DF837C", color: 'white' }}
            position="absolute"
            bg={'white'}
            color={'black'}
            icon={<FaLongArrowAltRight />}
            top="50%"
            transform="translateY(-50%)"
            right={0}
            zIndex={2}
            onClick={handleNext}
          />
        </Box>

        {/* Right side image (next) */}
        <Image
          alt="Next"
          h={["200px", "250px"]}
          ml={{ base: "-10rem", lg: "-11rem" }}
          rounded="xl"
          zIndex={-1}
          w={["200px", "300px"]}
          src={images[nextIndex]}
          opacity="0.4"
        />
      </Flex>
    </Box>
  );
};

export default NewCarousel;
