"use client";

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from "@chakra-ui/react";
import axios from "axios";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { memo, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiMaximize2, FiMinimize2, FiRefreshCw, FiX } from "react-icons/fi";
import { ScormAnswerSectionRecord } from "./quizReviewTypes";
import { buildScorm12InitialState, createScorm12Api, ScormTrackingPayload } from "./scorm12";
import { preloadCourseAsset } from "./sectionTracking";

const ScormQuizReviewContent = dynamic(() => import("./ScormQuizReviewContent"), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-500">Loading quiz review...</p>,
});

interface CoursePlayerProps {
  courseUrl: string;
  courseTitle: string;
  onBack: () => void;
  courseId?: string;
  moduleId?: string;
  sectionId?: string;
  userId?: string;
  learnerName?: string;
  initialProgress?: any;
  answerSections?: ScormAnswerSectionRecord[];
  isAnswerSectionsLoading?: boolean;
  onRefreshAnswerSections?: () => void | Promise<void>;
  onRefreshProgress?: () => void | Promise<void>;
  onProgressSynced?: (
    persistedProgress: any,
    payload: ScormTrackingPayload,
    mode: "commit" | "finish"
  ) => void | Promise<void>;
}

const HEADER_H = 48;

const StableScormIframe = memo(function StableScormIframe({
  iframeRef,
  src,
  title,
  onError,
}: {
  iframeRef: RefObject<HTMLIFrameElement>;
  src: string;
  title: string;
  onError: () => void;
}) {
  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      className="w-full h-full bg-white"
      allowFullScreen
      loading="eager"
      onError={onError}
    />
  );
});

export default function CoursePlayer({
  courseUrl,
  courseTitle,
  onBack,
  courseId,
  moduleId,
  sectionId,
  userId,
  learnerName,
  initialProgress,
  answerSections = [],
  isAnswerSectionsLoading = false,
  onRefreshAnswerSections,
  onRefreshProgress,
  onProgressSynced,
}: CoursePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialConfigRef = useRef({
    courseUrl,
    courseId,
    moduleId,
    sectionId,
    userId,
    learnerName,
    initialProgress,
  });
  const iframeSrcRef = useRef("about:blank");
  const hasAttachedIframeSrcRef = useRef(false);
  const apiRef = useRef<ReturnType<typeof createScorm12Api> | null>(null);
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());
  const trackingEnabledRef = useRef(false);
  const refreshTimerRef = useRef<number | null>(null);
  const hasPersistedOnExitRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const [hasSlowLoad, setHasSlowLoad] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isQuizReviewOpen, setIsQuizReviewOpen] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const visibleAnswerSections = useMemo(() => {
    if (!sectionId) {
      return answerSections;
    }

    const matchingSections = answerSections.filter((entry) => entry.sectionId === sectionId);
    return matchingSections.length ? matchingSections : answerSections;
  }, [answerSections, sectionId]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const attachApiToWindow = (targetWindow: Window | null | undefined) => {
    if (!targetWindow || !apiRef.current) {
      return;
    }

    (targetWindow as any).API = apiRef.current.api;
    (targetWindow as any).API_1484_11 = apiRef.current.api2004;
    (targetWindow as any).__SCORM_CONTEXT__ = apiRef.current.context;
  };

  const detachApiFromWindow = (targetWindow: Window | null | undefined) => {
    if (!targetWindow) {
      return;
    }

    delete (targetWindow as any).API;
    delete (targetWindow as any).API_1484_11;
    delete (targetWindow as any).__SCORM_CONTEXT__;
  };

  const scheduleUiRefresh = (payload: ScormTrackingPayload, mode: "commit" | "finish") => {
    const shouldRefreshAnswers = Boolean(onRefreshAnswerSections && (isQuizReviewOpen || mode === "finish"));
    const shouldRefreshProgress = Boolean(onRefreshProgress);

    if (!shouldRefreshAnswers && !shouldRefreshProgress) {
      return;
    }

    if (!payload.interactions.length && !payload.suspend_data && mode !== "finish") {
      return;
    }

    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(() => {
      if (shouldRefreshAnswers) {
        Promise.resolve(onRefreshAnswerSections?.()).catch(() => undefined);
      }

      if (shouldRefreshProgress) {
        Promise.resolve(onRefreshProgress?.()).catch(() => undefined);
      }
    }, mode === "finish" ? 150 : 450);
  };

  const sendKeepaliveTracking = (mode: "commit" | "finish", payload: ScormTrackingPayload) => {
    const endpoint = mode === "finish" ? "/scorm/finish" : "/scorm/commit";

    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        if (navigator.sendBeacon(endpoint, blob)) {
          scheduleUiRefresh(payload, mode);
          return true;
        }
      }

      if (typeof fetch === "function") {
        void fetch(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          keepalive: true,
        }).catch(() => undefined);

        scheduleUiRefresh(payload, mode);
        return true;
      }
    } catch (error) {
      console.warn(`SCORM ${mode} keepalive sync failed`, error);
    }

    return false;
  };

  const queueTrackingSync = (
    mode: "commit" | "finish",
    payload: ScormTrackingPayload,
    options?: { preferKeepalive?: boolean }
  ) => {
    if (!trackingEnabledRef.current) {
      return Promise.resolve();
    }

    const endpoint = mode === "finish" ? "/scorm/finish" : "/scorm/commit";

    if (options?.preferKeepalive && sendKeepaliveTracking(mode, payload)) {
      return Promise.resolve();
    }

    syncQueueRef.current = syncQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const response = await axios.post(endpoint, payload);
        const persistedProgress = response?.data?.data;

        if (persistedProgress && apiRef.current) {
          apiRef.current.mergeState(
            buildScorm12InitialState({
              context: apiRef.current.context,
              progress: {
                lessonStatus: persistedProgress.lessonStatus || payload.lesson_status,
                completionStatus: persistedProgress.completionStatus || payload.completion_status,
                successStatus: persistedProgress.successStatus || payload.success_status,
                progress: persistedProgress.progress,
                progressMeasure: payload.progress_measure,
                score:
                  persistedProgress.score === null || persistedProgress.score === undefined
                    ? payload.score
                    : persistedProgress.score,
                lessonLocation: persistedProgress.lessonLocation || payload.lesson_location,
                suspendData: persistedProgress.suspendData || payload.suspend_data,
                totalTime: persistedProgress.totalTime || payload.total_time,
              },
              includeSessionTime: false,
            })
          );
        }

        Promise.resolve(onProgressSynced?.(persistedProgress, payload, mode)).catch(() => undefined);
        setSyncError((currentValue) => (currentValue ? null : currentValue));
        scheduleUiRefresh(payload, mode);
      })
      .catch((error) => {
        console.error(`SCORM ${mode} sync failed`, error);
        setSyncError("Progress sync is temporarily unavailable. Your latest activity may not be saved.");
      });

    return syncQueueRef.current;
  };

  const persistLatestProgress = useCallback((options?: { preferKeepalive?: boolean }) => {
    if (hasPersistedOnExitRef.current) {
      return Promise.resolve();
    }

    const currentRuntime = apiRef.current;
    if (!currentRuntime?.isInitialized()) {
      return Promise.resolve();
    }

    const payload = currentRuntime.buildTrackingPayload();
    if (!payload) {
      return Promise.resolve();
    }

    hasPersistedOnExitRef.current = true;
    return queueTrackingSync("finish", payload, { preferKeepalive: options?.preferKeepalive ?? true });
  }, []);

  useEffect(() => {
    let isActive = true;

    const bootstrapPlayer = async () => {
      setIsBootstrapping(true);
      setIsFrameLoading(true);
      setHasSlowLoad(false);
      setPlayerError(null);
      setSyncError(null);
      hasPersistedOnExitRef.current = false;
      const initialConfig = initialConfigRef.current;
      const trackingEnabled = Boolean(initialConfig.userId && initialConfig.courseId);
      trackingEnabledRef.current = trackingEnabled;
      void preloadCourseAsset(initialConfig.courseUrl).catch(() => undefined);

      try {
        let runtime: ReturnType<typeof createScorm12Api> | null = null;
        let initializeError: any = null;

        const launchPlayer = (progress: any) => {
          if (!isActive || runtime) {
            return;
          }

          runtime = createScorm12Api({
            context: {
              userId: initialConfig.userId,
              courseId: initialConfig.courseId,
              moduleId: initialConfig.moduleId,
              sectionId: initialConfig.sectionId,
              learnerName: initialConfig.learnerName,
            },
            initialState: buildScorm12InitialState({
              context: {
                userId: initialConfig.userId,
                courseId: initialConfig.courseId,
                moduleId: initialConfig.moduleId,
                sectionId: initialConfig.sectionId,
                learnerName: initialConfig.learnerName,
              },
              progress,
            }),
            onCommit: (payload) => queueTrackingSync("commit", payload),
            onFinish: (payload) => queueTrackingSync("finish", payload),
          });

          apiRef.current = runtime;
          attachApiToWindow(window);
          iframeSrcRef.current = initialConfig.courseUrl;
          hasAttachedIframeSrcRef.current = true;
          if (iframeRef.current) {
            iframeRef.current.src = iframeSrcRef.current;
          }
          setIsBootstrapping(false);
        };

        const initializePromise = trackingEnabled
          ? axios.post(
            "/scorm/initialize",
            {
              userId: initialConfig.userId,
              courseId: initialConfig.courseId,
              moduleId: initialConfig.moduleId,
              sectionId: initialConfig.sectionId,
            },
            { timeout: 15000 }
          )
          : Promise.resolve(null);

        if (trackingEnabled) {
          syncQueueRef.current = initializePromise.then(
            () => undefined,
            () => undefined
          );
        }

        if (initialConfig.initialProgress) {
          launchPlayer(initialConfig.initialProgress);
        }

        let initializedProgress = null;
        if (trackingEnabled) {
          try {
            const response = await initializePromise;
            initializedProgress = response?.data?.data || null;
          } catch (error: any) {
            initializeError = error;
            console.error("SCORM initialize failed", error);
          }
        }

        if (!runtime) {
          launchPlayer(initializedProgress);
        } else if (initializedProgress) {
          runtime.mergeState(
            buildScorm12InitialState({
              context: {
                userId: initialConfig.userId,
                courseId: initialConfig.courseId,
                moduleId: initialConfig.moduleId,
                sectionId: initialConfig.sectionId,
                learnerName: initialConfig.learnerName,
              },
              progress: initializedProgress,
              includeSessionTime: false,
            })
          );
        }

        if (!isActive) {
          return;
        }

        if (initializeError) {
          setSyncError(
            initializeError?.response?.data?.message ||
            initializeError?.response?.data?.error ||
            "SCORM tracking could not be initialized. The lesson is loading without saved progress sync."
          );
        }
      } catch (error: any) {
        console.error("SCORM player bootstrap failed", error);
        if (isActive) {
          setPlayerError(
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "We couldn't initialize this SCORM course."
          );
        }
      } finally {
        if (isActive) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrapPlayer();

    return () => {
      isActive = false;

      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }

      apiRef.current = null;

      detachApiFromWindow(iframeRef.current?.contentWindow);
      detachApiFromWindow(window);
    };
  }, []);

  useEffect(() => {
    const handlePageHide = () => {
      void persistLatestProgress({ preferKeepalive: true });
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [persistLatestProgress]);

  useEffect(() => {
    const iframeElement = iframeRef.current;
    if (!iframeElement) {
      return;
    }

    const handleLoad = () => {
      if (!hasAttachedIframeSrcRef.current) {
        return;
      }

      try {
        attachApiToWindow(window);
        attachApiToWindow(iframeElement.contentWindow);

        if (iframeElement.contentDocument?.contentType?.includes("text/plain")) {
          setPlayerError("The SCORM launch file was returned as plain text.");
        } else {
          setPlayerError(null);
        }
      } catch (error) {
        console.warn("Unable to attach the SCORM API to the iframe window.", error);
      } finally {
        setIsFrameLoading(false);
        setHasSlowLoad(false);
      }
    };

    iframeElement.addEventListener("load", handleLoad);

    return () => {
      iframeElement.removeEventListener("load", handleLoad);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if ((!isBootstrapping && !isFrameLoading) || playerError) {
      return;
    }

    const slowLoadTimer = window.setTimeout(() => {
      setHasSlowLoad(true);
    }, 6000);
    const failedLoadTimer = window.setTimeout(() => {
      setPlayerError("This lesson is taking too long to respond. Please retry the launch.");
      setIsBootstrapping(false);
      setIsFrameLoading(false);
    }, 30000);

    return () => {
      window.clearTimeout(slowLoadTimer);
      window.clearTimeout(failedLoadTimer);
    };
  }, [isBootstrapping, isFrameLoading, loadAttempt, playerError]);

  const handleIframeError = useCallback(() => {
    setPlayerError("We couldn't load this SCORM package.");
    setIsFrameLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    const iframeElement = iframeRef.current;
    if (!iframeElement || !apiRef.current) {
      setPlayerError("Close this player and reopen the lesson to retry initialization.");
      return;
    }

    setPlayerError(null);
    setSyncError(null);
    setHasSlowLoad(false);
    setIsFrameLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
    void preloadCourseAsset(courseUrl, { force: true }).catch(() => undefined);

    const separator = courseUrl.includes("?") ? "&" : "?";
    iframeSrcRef.current = `${courseUrl}${separator}scorm_retry=${Date.now()}`;
    hasAttachedIframeSrcRef.current = true;
    attachApiToWindow(window);
    iframeElement.src = iframeSrcRef.current;
  }, [courseUrl]);

  const handleClosePlayer = useCallback(() => {
    setIsQuizReviewOpen(false);
    persistLatestProgress({ preferKeepalive: false })
      .catch(() => undefined)
      .then(() => Promise.resolve(onRefreshProgress?.()).catch(() => undefined))
      .finally(() => {
        onBack();
      });
  }, [onBack, onRefreshProgress, persistLatestProgress]);

  const toggleFullscreen = async () => {
    if (!modalRef.current) {
      return;
    }

    if (!document.fullscreenElement) {
      await modalRef.current.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  const showOverlay = isBootstrapping || isFrameLoading || Boolean(playerError);

  return (
    <>
      <style>{`
        body, html { overflow: hidden !important; }
        @keyframes scorm-spin { to { transform: rotate(360deg); } }
        .scorm-spinner { animation: scorm-spin 0.9s linear infinite; }
      `}</style>

      <div
        className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            handleClosePlayer();
          }
        }}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.2 }}
          onClick={(event) => event.stopPropagation()}
          className={`
            flex flex-col overflow-hidden bg-white dark:bg-[#0F0F0F]
            shadow-[0_24px_80px_rgba(0,0,0,0.5)]
            ${isFullscreen ? "w-screen h-screen rounded-none" : "h-[100dvh] w-screen rounded-none sm:h-[92dvh] sm:w-[96vw] sm:rounded-2xl lg:h-[88dvh] lg:w-[88vw] xl:w-[78vw] max-w-[1600px]"}
          `}
        >
          <div
            className="flex min-h-12 flex-shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-black px-2 py-2 dark:border-white/10 dark:bg-[#0F0F0F] sm:gap-3 sm:px-3"
            style={{ minHeight: HEADER_H }}
          >
            <h2 className="ml-1 min-w-0 flex-1 truncate text-xs font-medium text-gray-100 select-none dark:text-gray-400 sm:text-sm">
              {courseTitle}
            </h2>

            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
              <Button
                size="sm"
                colorScheme="teal"
                variant="outline"
                onClick={() => setIsQuizReviewOpen(true)}
                isDisabled={isBootstrapping}
                h={{ base: "32px", sm: "36px" }}
                px={{ base: 2, sm: 3 }}
                fontSize={{ base: "11px", sm: "sm" }}
              >
                Quiz Review
              </Button>
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-200 transition hover:bg-white/10"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClosePlayer();
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-200 transition hover:bg-white/10"
                aria-label="Close player"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          <div className="relative flex-1 bg-[#0B0B0B]">
            {showOverlay ? (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#0B0B0B] px-6 text-center text-white"
                role="status"
                aria-live="polite"
              >
                {playerError ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
                      <FiRefreshCw size={22} />
                    </div>
                    <div className="max-w-md">
                      <p className="text-sm font-semibold">Lesson launch interrupted</p>
                      <p className="mt-2 text-xs leading-5 text-white/70">{playerError}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
                      >
                        Retry lesson
                      </button>
                      <button
                        type="button"
                        onClick={handleClosePlayer}
                        className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        Close
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="scorm-spinner h-9 w-9 rounded-full border-[3px] border-white/20 border-t-white" />
                    <div className="max-w-md">
                      <p className="text-sm font-semibold">
                        {isBootstrapping ? "Restoring your lesson progress..." : "Starting the lesson..."}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/60">
                        Course assets are being prepared in the background.
                      </p>
                    </div>
                    <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-2/3 animate-pulse rounded-full bg-cyan-400/80" />
                    </div>
                    {hasSlowLoad ? (
                      <p className="text-xs text-white/70">
                        This package is larger than usual, but it is still loading.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}

            <StableScormIframe
              iframeRef={iframeRef}
              src={iframeSrcRef.current}
              title={courseTitle}
              onError={handleIframeError}
            />
          </div>

          {syncError ? (
            <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
              {syncError}
            </div>
          ) : null}
        </motion.div>
      </div>

      <Drawer isOpen={isQuizReviewOpen} placement="right" onClose={() => setIsQuizReviewOpen(false)} size="lg">
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Quiz Review</DrawerHeader>
          <DrawerBody py={6}>
            {isQuizReviewOpen ? (
              <ScormQuizReviewContent
                sections={visibleAnswerSections}
                isLoading={isAnswerSectionsLoading}
                emptyState="Answers will appear here after the SCORM package commits quiz data or when the lesson is completed."
              />
            ) : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
