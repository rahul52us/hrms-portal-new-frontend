import { motion } from "framer-motion";
import { Download, ExternalLink, FileText, RotateCcw, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LaunchContentKind } from "./sectionTracking";

interface CourseAssetModalProps {
  assetUrl: string;
  assetKind: LaunchContentKind;
  title: string;
  initialTime?: number;
  initialProgress?: number;
  onBack: () => void;
  onOpened?: () => void | Promise<void>;
  onCompleted?: () => void | Promise<void>;
  onProgressUpdate?: (data: { currentTime: number; duration: number; progress: number }) => void;
  onStartOver?: () => void;
}

export default function CourseAssetModal({
  assetUrl,
  assetKind,
  title,
  initialTime = 0,
  initialProgress = 0,
  onBack,
  onOpened,
  onCompleted,
  onProgressUpdate,
  onStartOver,
}: CourseAssetModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastUpdateRef = useRef(0);
  const hasTrackedOpenRef = useRef(false);
  const hasTrackedCompletionRef = useRef(false);
  const [showStartOver, setShowStartOver] = useState(initialProgress >= 100);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    if (!hasTrackedOpenRef.current) {
      hasTrackedOpenRef.current = true;
      void Promise.resolve(onOpened?.()).catch(() => undefined);
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      
      // Save current position on unmount if it's a video
      if (assetKind === "video" && videoRef.current) {
        const video = videoRef.current;
        if (video.currentTime > 0 && !hasTrackedCompletionRef.current) {
          const progress = video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0;
          onProgressUpdate?.({
            currentTime: video.currentTime,
            duration: video.duration,
            progress: Math.min(progress, 99),
          });
        }
      }
    };
  }, [onOpened, assetKind, onProgressUpdate]);

  // Restore initial time when video is ready
  useEffect(() => {
    if (assetKind === "video" && videoRef.current && initialTime > 0) {
      videoRef.current.currentTime = initialTime;
    }
  }, [initialTime, assetKind]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || !onProgressUpdate) return;
    
    const now = Date.now();
    // Throttle updates to every 10 seconds
    if (now - lastUpdateRef.current > 10000) {
      const video = videoRef.current;
      const progress = video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0;
      
      onProgressUpdate({
        currentTime: video.currentTime,
        duration: video.duration,
        progress: Math.min(progress, 99),
      });
      
      lastUpdateRef.current = now;
    }
  };

  const handlePause = () => {
    if (!videoRef.current || !onProgressUpdate) return;
    const video = videoRef.current;
    const progress = video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0;
    
    onProgressUpdate({
      currentTime: video.currentTime,
      duration: video.duration,
      progress: Math.min(progress, 99),
    });
  };

  const handleCompleted = () => {
    if (hasTrackedCompletionRef.current) {
      return;
    }

    hasTrackedCompletionRef.current = true;
    void Promise.resolve(onCompleted?.()).catch(() => undefined);
  };

  const handleStartOver = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
    setShowStartOver(false);
    onStartOver?.();
  };

  const renderContent = () => {
    if (assetKind === "video") {
      return (
        <div className="relative h-full w-full bg-black">
          <video
            ref={videoRef}
            src={assetUrl}
            controls
            autoPlay
            className="h-full w-full"
            onTimeUpdate={handleTimeUpdate}
            onPause={handlePause}
            onEnded={handleCompleted}
          />
          {showStartOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm">
              <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-slate-900/90 p-4 text-center shadow-2xl sm:p-6">
                <p className="text-white font-medium">You've already completed this lesson.</p>
                <div className="flex flex-col justify-center gap-2 sm:flex-row sm:gap-3">
                  <button
                    onClick={() => setShowStartOver(false)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Resume Playing
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (assetKind === "document") {
      return <iframe src={assetUrl} title={title} className="h-full w-full bg-white" />;
    }

    return (
      <div className="flex h-full w-full items-center justify-center bg-white p-8 text-center">
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{title}</p>
            <p className="mt-2 text-sm text-slate-600">
              This lesson opens in a separate tab so the browser can handle the file directly.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={assetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Open File
            </a>
            <a
              href={assetUrl}
              download
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onBack();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2 }}
        onClick={(event) => event.stopPropagation()}
        className="flex h-[100dvh] w-screen max-w-[1600px] flex-col overflow-hidden rounded-none bg-white shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:h-[92dvh] sm:w-[96vw] sm:rounded-2xl lg:h-[88dvh] lg:w-[88vw] xl:w-[78vw]"
      >
        <div className="flex min-h-12 items-center justify-between gap-2 border-b border-slate-200 bg-slate-950 px-2 py-2 sm:gap-3 sm:px-3">
          <div className="flex min-w-0 items-center gap-2 text-slate-200">
            {assetKind === "video" ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            <h2 className="truncate text-sm font-medium">{title}</h2>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
            <a
              href={assetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open</span>
            </a>
            <a
              href={assetUrl}
              download
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-200 transition hover:bg-white/10"
              aria-label="Close asset viewer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 bg-slate-950">{renderContent()}</div>
      </motion.div>
    </div>
  );
}
