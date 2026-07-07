import {
  Box,
  Flex,
  Heading,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";

interface ScormPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseUrl: string;
  courseTitle: string;
  sectionTitle?: string;
}

export default function ScormPlayerModal({
  isOpen,
  onClose,
  courseUrl,
  courseTitle,
  sectionTitle,
}: ScormPlayerModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const [hasSlowLoad, setHasSlowLoad] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const bgHeader = useColorModeValue("gray.50", "gray.800");

  // SCORM API attachment
  useEffect(() => {
    const scorm12Api = {
      LMSInitialize: () => {
        console.log("SCORM API Initialized");
        return "true";
      },
      LMSFinish: () => "true",
      LMSGetValue: (key: string) => {
        if (key === "cmi.core.lesson_status") return "incomplete";
        if (key === "cmi.core.student_id") return "student-001";
        if (key === "cmi.core.student_name") return "Learner, Awesome";
        return "";
      },
      LMSSetValue: () => "true",
      LMSCommit: () => "true",
      LMSGetLastError: () => "0",
      LMSGetErrorString: () => "No error",
      LMSGetDiagnostic: () => "Diagnostic info",
    };

    const scorm2004State: Record<string, string> = {
      "cmi.completion_status": "incomplete",
      "cmi.success_status": "unknown",
      "cmi.learner_id": "student-001",
      "cmi.learner_name": "Learner, Awesome",
    };

    const scorm2004Api = {
      Initialize: () => "true",
      Terminate: () => "true",
      GetValue: (key: string) => scorm2004State[key] ?? "",
      SetValue: (key: string, value: string) => {
        scorm2004State[key] = value;
        return "true";
      },
      Commit: () => "true",
      GetLastError: () => "0",
      GetErrorString: () => "No error",
      GetDiagnostic: () => "Diagnostic info",
    };

    const attachApis = (targetWindow: Window | null | undefined) => {
      if (!targetWindow) return;
      (targetWindow as any).API = scorm12Api;
      (targetWindow as any).API_1484_11 = scorm2004Api;
    };

    attachApis(window);

    const iframeElement = iframeRef.current;
    const handleLoad = () => {
      try {
        attachApis(iframeElement?.contentWindow);
        const iframeDocument = iframeElement?.contentDocument;
        if (iframeDocument?.contentType?.includes("text/plain")) {
          setPlayerError("The SCORM launch file was returned as plain text instead of a webpage.");
        } else {
          setPlayerError(null);
        }
      } catch (error) {
        console.warn("Unable to attach SCORM API to iframe window.", error);
      } finally {
        setIsFrameLoading(false);
        setHasSlowLoad(false);
      }
    };

    iframeElement?.addEventListener("load", handleLoad);

    return () => {
      delete (window as any).API;
      delete (window as any).API_1484_11;
      iframeElement?.removeEventListener("load", handleLoad);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!contentRef.current) return;
    if (!document.fullscreenElement) {
      await contentRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    setIsFrameLoading(true);
    setHasSlowLoad(false);
    setPlayerError(null);

    const slowLoadTimer = window.setTimeout(() => {
      setHasSlowLoad(true);
    }, 6000);

    return () => window.clearTimeout(slowLoadTimer);
  }, [courseUrl, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      motionPreset="slideInBottom"
      closeOnOverlayClick={false}
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent
        as={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        maxW={{ base: "100vw", sm: "96vw", lg: "90vw" }}
        maxH={{ base: "100dvh", sm: "92dvh", lg: "90vh" }}
        w={{ base: "100vw", sm: "96vw", lg: "90vw" }}
        h={{ base: "100dvh", sm: "92dvh", lg: "90vh" }}
        borderRadius={{ base: "0", sm: "2xl" }}
        overflow="hidden"
        m="auto"
      >
        {/* Header */}
        <ModalHeader
          bg={bgHeader}
          borderBottomWidth="1px"
          py={{ base: 2, md: 3 }}
          px={{ base: 2, md: 4 }}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Flex align="center" gap={2} minW={0} flex="1">
            <ModalCloseButton position="static" top="auto" right="auto" />
            <Heading size="sm" fontSize={{ base: "sm", md: "md" }} fontWeight="medium" color="gray.600" noOfLines={1}>
              {courseTitle}
            </Heading>
            {sectionTitle && (
              <Text fontSize="xs" color="gray.500" ml={2}>
                • {sectionTitle}
              </Text>
            )}
          </Flex>
          <IconButton
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            icon={isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
            onClick={toggleFullscreen}
            variant="ghost"
            size="sm"
          />
        </ModalHeader>

        <ModalBody p={0} flex="1" ref={contentRef} position="relative">
          {isFrameLoading && (
            <Flex
              position="absolute"
              inset={0}
              zIndex={2}
              align="center"
              justify="center"
              direction="column"
              gap={4}
              px={6}
              textAlign="center"
              bg={useColorModeValue("rgba(255,255,255,0.95)", "rgba(17,24,39,0.95)")}
            >
              <Box
                w="58px"
                h="58px"
                borderRadius="18px"
                bg="linear-gradient(135deg, #4F46E5 0%, #0EA5E9 100%)"
                display="grid"
                placeItems="center"
              >
                <Box
                  w="24px"
                  h="24px"
                  borderRadius="full"
                  border="3px solid rgba(255,255,255,0.35)"
                  borderTopColor="white"
                  animation="scorm-modal-spin 0.9s linear infinite"
                />
              </Box>
              <Box maxW="460px">
                <Heading size="sm" mb={2}>Preparing lesson</Heading>
                <Text fontSize="sm" color="gray.500">
                  Loading course assets and connecting the SCORM player.
                </Text>
                {hasSlowLoad && (
                  <Text mt={3} fontSize="sm" color="gray.500">
                    First-time loads can take longer while the package finishes warming up.
                  </Text>
                )}
                {playerError && (
                  <Text mt={3} fontSize="sm" color="red.400">
                    {playerError}
                  </Text>
                )}
              </Box>
            </Flex>
          )}
          <iframe
            key={courseUrl}
            ref={iframeRef}
            src={courseUrl}
            onError={() => {
              setPlayerError("We couldn't load this lesson.");
              setIsFrameLoading(false);
            }}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
            }}
            title={`${courseTitle} - ${sectionTitle || "player"}`}
            allowFullScreen
          />
          <style>{`@keyframes scorm-modal-spin { to { transform: rotate(360deg); } }`}</style>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
