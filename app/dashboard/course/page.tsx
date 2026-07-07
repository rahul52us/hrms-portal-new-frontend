"use client";

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useBreakpointValue, useColorModeValue } from "@chakra-ui/react";
import {
  FiBookOpen,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiEdit3,
  FiEye,
  FiFilter,
  FiGlobe,
  FiGrid,
  FiLoader,
  FiLock,
  FiPlus,
  FiSearch,
  FiSettings,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import CourseList from "./CourseList";
import CourseDetails from "./CourseDetails";
import AssignCourseModal from "./components/AssignCourseModal";
import CourseUsersModal from "./components/CourseUsersModal";
import CoursePlayer from "./scorm/CoursePlayer";
import CourseAssetModal from "./scorm/CourseAssetModal";
import {
  buildCourseAssetUrl,
  CourseLaunchSection,
  getCourseSectionProgress,
  isScormLaunchSection,
} from "./scorm/sectionTracking";
import { courseStore, CourseListItem } from "@/app/store/courseStore/courseStore";
import stores from "@/app/store/stores";
import { isLearnerRole } from "@/app/config/utils/roleAccess";
import PermissionGate from "@/app/component/common/PermissionGate";
import {
  PERMISSION_KEYS,
  hasAnyCourseViewPermission,
  hasPermission,
} from "@/app/config/utils/permissions";

const MotionButton = motion.button;

type CatalogSort = "latest" | "popularity" | "price_asc" | "price_desc" | "title_az";

function formatCurrency(value?: number | null) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function StatCard({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string | number;
  helper: string;
  accent: string;
}) {
  const isCompact = useBreakpointValue({ base: true, md: false }) ?? false;
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(148, 163, 184, 0.18)",
        padding: isCompact ? "14px 14px 12px" : "18px 18px 16px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 100%)",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
      }}
    >
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#64748B", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ margin: "8px 0 4px", fontSize: isCompact ? 22 : 28, fontWeight: 800, color: accent }}>{value}</p>
      <p style={{ margin: 0, fontSize: 13, color: "#64748B", lineHeight: 1.5, display: isCompact ? "none" : "block" }}>{helper}</p>
    </div>
  );
}

function CoursePage() {
  const isCompact = useBreakpointValue({ base: true, xl: false }) ?? false;
  const [view, setView] = useState<"gallery" | "create" | "edit" | "details">("gallery");
  const [activeCourse, setActiveCourse] = useState<CourseListItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [playerSection, setPlayerSection] = useState<CourseLaunchSection | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [courseUsersModal, setCourseUsersModal] = useState<{ courseId: string; courseTitle: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "private" | "public">("all");
  const [pricingFilter, setPricingFilter] = useState<"all" | "free" | "paid">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [courseTypeFilter, setCourseTypeFilter] = useState<"all" | "standard" | "scorm">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [sortBy, setSortBy] = useState<CatalogSort>("latest");

  const pageBg = useColorModeValue("#F8FAFC", "#0F172A");
  const cardBg = useColorModeValue("#FFFFFF", "#111827");
  const surfaceBg = useColorModeValue("#FFFFFF", "#111827");
  const borderColor = useColorModeValue("#E2E8F0", "#334155");
  const titleColor = useColorModeValue("#0F172A", "#F8FAFC");
  const textColor = useColorModeValue("#475569", "#CBD5E1");
  const mutedTextColor = useColorModeValue("#64748B", "#94A3B8");
  const tableHeaderBg = useColorModeValue("#F8FAFC", "#172033");
  const filterSurface = useColorModeValue("rgba(255,255,255,0.92)", "rgba(15,23,42,0.78)");
  const rowHoverBg = useColorModeValue("#F8FAFC", "#172033");

  const router = useRouter();
  const role = String(stores.auth.userType || stores.auth.user?.role || "").toLowerCase();
  const isLearner = isLearnerRole(role);
  const canViewCourses = hasAnyCourseViewPermission(stores.auth.user);
  const canCreateCourses = hasPermission(stores.auth.user, PERMISSION_KEYS.CREATE_COURSES);
  const canEditCourses = role === "superadmin" && hasPermission(stores.auth.user, PERMISSION_KEYS.EDIT_COURSES);
  const canDeleteCourses = hasPermission(stores.auth.user, PERMISSION_KEYS.DELETE_COURSES);
  const canAssignCourses = hasPermission(stores.auth.user, PERMISSION_KEYS.ASSIGN_COURSES);
  const canViewUsers = hasPermission(stores.auth.user, PERMISSION_KEYS.VIEW_USERS) && (role === "admin" || role === "superadmin");
  const compactActionWidth = isCompact ? (canCreateCourses ? "calc(50% - 6px)" : "100%") : "auto";
  const scopeBadgeLabel =
    role === "superadmin"
      ? "Platform Course Library"
      : role === "admin"
        ? "Company Course Library"
        : role === "departmenthead"
          ? "Department Course Library"
          : "Course Library";
  const scopeDescription =
    role === "superadmin"
      ? "Review and manage the full platform catalog, including global, assigned, and company-created courses."
      : role === "admin"
        ? "Review and manage the course catalog available to your company, including assigned and company-created courses."
        : "Review the courses available to your department and manage the items your role is allowed to maintain.";

  useEffect(() => {
    if (isLearner) {
      router.replace("/course");
      return;
    }

    if (canViewCourses) {
      courseStore.fetchCourses().catch(() => undefined);
    }
  }, [canViewCourses, isLearner, router]);

  const handleCreateSuccess = () => {
    courseStore.fetchCourses().catch(() => undefined);
    setView("gallery");
  };

  const handleOpenDetails = (course: CourseListItem) => {
    setActiveCourse(course);
    setView("details");
  };

  const handleOpenEdit = (course: CourseListItem) => {
    setActiveCourse(course);
    setView("edit");
  };

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    courseStore.courses.forEach((course) => {
      (course.taxonomy?.categories || []).forEach((category) => {
        if (category) categories.add(category);
      });
    });
    return ["all", ...Array.from(categories).sort((left, right) => left.localeCompare(right))];
  }, [courseStore.courses]);

  const availableLanguages = useMemo(() => {
    const languages = new Set<string>();
    courseStore.courses.forEach((course) => {
      (course.taxonomy?.languages || []).forEach((language) => {
        if (language) languages.add(language);
      });
    });
    return ["all", ...Array.from(languages).sort((left, right) => left.localeCompare(right))];
  }, [courseStore.courses]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const nextCourses = courseStore.courses.filter((course) => {
      const visibilityType = course.visibility?.type || "private";
      const pricingModel = course.commerce?.pricingModel || "free";
      const courseType = course.courseType || (course.scormFilePath ? "scorm" : "standard");
      const categories = course.taxonomy?.categories || [];
      const languages = course.taxonomy?.languages || [];
      const searchableText = [
        course.title,
        course.slug,
        course.taxonomy?.level,
        visibilityType,
        pricingModel,
        courseType,
        ...categories,
        ...languages,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !searchableText.includes(query)) {
        return false;
      }

      if (visibilityFilter !== "all" && visibilityType !== visibilityFilter) {
        return false;
      }

      if (pricingFilter !== "all" && pricingModel !== pricingFilter) {
        return false;
      }

      if (statusFilter !== "all" && course.status !== statusFilter) {
        return false;
      }

      if (courseTypeFilter !== "all" && courseType !== courseTypeFilter) {
        return false;
      }

      if (categoryFilter !== "all" && !categories.includes(categoryFilter)) {
        return false;
      }

      if (languageFilter !== "all" && !languages.includes(languageFilter)) {
        return false;
      }

      return true;
    });

    nextCourses.sort((left, right) => {
      if (sortBy === "popularity") {
        return (right.metrics?.popularityScore || 0) - (left.metrics?.popularityScore || 0);
      }

      if (sortBy === "price_asc") {
        return Number(left.commerce?.amountInRupees || 0) - Number(right.commerce?.amountInRupees || 0);
      }

      if (sortBy === "price_desc") {
        return Number(right.commerce?.amountInRupees || 0) - Number(left.commerce?.amountInRupees || 0);
      }

      if (sortBy === "title_az") {
        return String(left.title || "").localeCompare(String(right.title || ""));
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    return nextCourses;
  }, [
    categoryFilter,
    courseStore.courses,
    courseTypeFilter,
    languageFilter,
    pricingFilter,
    searchQuery,
    sortBy,
    statusFilter,
    visibilityFilter,
  ]);

  const summary = useMemo(() => {
    const allCourses = courseStore.courses || [];
    const published = allCourses.filter((course) => course.status === "published").length;
    const privateCount = allCourses.filter((course) => (course.visibility?.type || "private") === "private").length;
    const publicCount = allCourses.filter((course) => course.visibility?.type === "public").length;
    const paidCount = allCourses.filter((course) => course.commerce?.pricingModel === "paid").length;

    return {
      total: allCourses.length,
      published,
      privateCount,
      publicCount,
      paidCount,
    };
  }, [courseStore.courses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchQuery, visibilityFilter, pricingFilter, statusFilter, courseTypeFilter, categoryFilter, languageFilter, sortBy]);

  const totalCourses = filteredCourses.length;
  const totalPages = Math.max(1, Math.ceil(totalCourses / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCourses = filteredCourses.slice(startIndex, endIndex);
  const initialScormProgress = getCourseSectionProgress(activeCourse, playerSection?.sectionId);

  if (isLearner) {
    return null;
  }

  if (view === "create") {
    return <CourseList onSuccess={handleCreateSuccess} onCancel={() => setView("gallery")} />;
  }

  if (view === "edit" && activeCourse) {
    return (
      <CourseList
        mode="edit"
        courseId={activeCourse._id}
        initialCourse={activeCourse}
        onSuccess={handleCreateSuccess}
        onCancel={() => setView("gallery")}
      />
    );
  }

  if (view === "details" && activeCourse) {
    return (
      <>
        <CourseDetails
          course={activeCourse}
          onBack={() => setView("gallery")}
          onLaunchSection={(launchSection) => setPlayerSection(launchSection)}
          onAssignCourse={canAssignCourses ? () => setIsAssignModalOpen(true) : undefined}
        />

        <AnimatePresence>
          {playerSection && isScormLaunchSection(playerSection) ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ position: "fixed", inset: 0, zIndex: 1400 }}
            >
              <CoursePlayer
                courseId={activeCourse._id}
                userId={stores.auth.user?._id}
                learnerName={stores.auth.user?.name || stores.auth.user?.username || "Learner"}
                courseTitle={activeCourse.title}
                courseUrl={buildCourseAssetUrl(playerSection.assetPath)}
                moduleId={playerSection.moduleId}
                sectionId={playerSection.sectionId}
                initialProgress={initialScormProgress}
                onBack={() => setPlayerSection(null)}
              />
            </motion.div>
          ) : playerSection ? (
            <CourseAssetModal
              assetKind={playerSection.contentKind}
              assetUrl={buildCourseAssetUrl(playerSection.assetPath)}
              title={playerSection.sectionTitle || activeCourse.title}
              onBack={() => setPlayerSection(null)}
            />
          ) : null}
        </AnimatePresence>

        <AssignCourseModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          defaultCourseId={activeCourse._id}
          onAssigned={async () => {
            await courseStore.fetchAssignedCourseAccesses({
              companyId: stores.companyStore.getActiveCompanyId() || undefined,
            });
          }}
        />
      </>
    );
  }

  return (
    <PermissionGate
      allowed={canViewCourses}
      title="Courses module is disabled"
      description="This account does not currently have access to the course workspace."
      fallbackHref="/dashboard/profile"
    >
      <div style={{ minHeight: "100vh", background: pageBg, padding: isCompact ? "0" : "24px" }}>
        <div style={{ maxWidth: 1480, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: isCompact ? 22 : 30,
              padding: isCompact ? "18px 16px 16px" : "30px 30px 26px",
              background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 55%, #0EA5E9 100%)",
              color: "#FFFFFF",
              boxShadow: "0 30px 80px rgba(15, 23, 42, 0.28)",
              marginBottom: isCompact ? 16 : 26,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: isCompact ? 14 : 18, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ maxWidth: 760 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: isCompact ? "7px 12px" : "8px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.14)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  <FiFilter />
                  {scopeBadgeLabel}
                </div>
                <h1 style={{ margin: isCompact ? "12px 0 6px" : "16px 0 10px", fontSize: isCompact ? 24 : 34, lineHeight: 1.08, fontWeight: 800 }}>
                  Search, filter, and manage courses within your scope
                </h1>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.84)", display: isCompact ? "none" : "block" }}>
                  {scopeDescription} Use the filters below to isolate visibility, pricing, delivery type, language,
                  category, and publishing status in seconds.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", width: isCompact ? "100%" : "auto" }}>
                <MotionButton
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    router.push(
                      role === "superadmin" ? "/dashboard/course/assigned" : "/dashboard/course/access-management"
                    )
                  }
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.08)",
                    color: "#FFFFFF",
                    padding: isCompact ? "10px 14px" : "12px 18px",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    width: compactActionWidth,
                    justifyContent: "center",
                  }}
                >
                  <FiUsers size={16} />
                  {role === "superadmin" ? "Assigned Courses" : "Assign Courses"}
                </MotionButton>

                {canCreateCourses ? (
                  <MotionButton
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView("create")}
                    style={{
                      borderRadius: 16,
                      border: "none",
                      background: "#FFFFFF",
                      color: "#0F172A",
                      padding: isCompact ? "10px 14px" : "12px 18px",
                      fontSize: 14,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      boxShadow: "0 14px 35px rgba(15, 23, 42, 0.18)",
                      width: compactActionWidth,
                      justifyContent: "center",
                    }}
                  >
                    <FiPlus size={16} />
                    Add New Course
                  </MotionButton>
                ) : null}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isCompact ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(200px, 1fr))",
              gap: isCompact ? 10 : 16,
              marginBottom: isCompact ? 16 : 22,
            }}
          >
            <StatCard label="Total Courses" value={summary.total} helper="Every course in your current scope." accent="#2563EB" />
            <StatCard label="Published" value={summary.published} helper="Ready for assignment or public discovery." accent="#0F766E" />
            <StatCard label="Private" value={summary.privateCount} helper="Restricted and assignable through the access flow." accent="#1D4ED8" />
            <StatCard label="Public" value={summary.publicCount} helper="Visible without login for self-serve learners." accent="#059669" />
            <StatCard label="Paid" value={summary.paidCount} helper="Commercial catalog with direct pricing enabled." accent="#C2410C" />
          </div>

          <div
            style={{
              borderRadius: isCompact ? 18 : 24,
              border: `1px solid ${borderColor}`,
              background: filterSurface,
              backdropFilter: "blur(14px)",
              padding: isCompact ? 12 : 18,
              boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isCompact ? "1fr" : "minmax(240px, 2fr) repeat(6, minmax(140px, 1fr))",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderRadius: 14,
                  border: `1px solid ${borderColor}`,
                  background: surfaceBg,
                  padding: "0 14px",
                  height: isCompact ? 42 : 46,
                }}
              >
                <FiSearch style={{ color: mutedTextColor }} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title, slug, category, level, language, or visibility"
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    width: "100%",
                    color: titleColor,
                    fontSize: 14,
                  }}
                />
              </div>

              {[
                {
                  value: visibilityFilter,
                  onChange: setVisibilityFilter,
                  options: [
                    ["all", "All visibility"],
                    ["private", "Private"],
                    ["public", "Public"],
                  ],
                },
                {
                  value: pricingFilter,
                  onChange: setPricingFilter,
                  options: [
                    ["all", "All pricing"],
                    ["free", "Free"],
                    ["paid", "Paid"],
                  ],
                },
                {
                  value: courseTypeFilter,
                  onChange: setCourseTypeFilter,
                  options: [
                    ["all", "All types"],
                    ["standard", "Standard"],
                    ["scorm", "SCORM"],
                  ],
                },
                {
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: [
                    ["all", "All status"],
                    ["published", "Published"],
                    ["draft", "Draft"],
                  ],
                },
                {
                  value: categoryFilter,
                  onChange: setCategoryFilter,
                  options: availableCategories.map((category) => [category, category === "all" ? "All categories" : category]),
                },
                {
                  value: languageFilter,
                  onChange: setLanguageFilter,
                  options: availableLanguages.map((language) => [language, language === "all" ? "All languages" : language]),
                },
              ].map((config, index) => (
                <select
                  key={`${index}-${config.value}`}
                  value={config.value}
                  onChange={(event) => config.onChange(event.target.value as never)}
                  style={{
                    height: isCompact ? 42 : 46,
                    borderRadius: isCompact ? 12 : 14,
                    border: `1px solid ${borderColor}`,
                    background: surfaceBg,
                    color: titleColor,
                    fontSize: 13,
                    padding: "0 12px",
                    outline: "none",
                  }}
                >
                  {config.options.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  ["latest", "Latest"],
                  ["popularity", "Popularity"],
                  ["price_asc", "Price low-high"],
                  ["price_desc", "Price high-low"],
                  ["title_az", "Title A-Z"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSortBy(value as CatalogSort)}
                    style={{
                      padding: isCompact ? "8px 12px" : "10px 14px",
                      borderRadius: 12,
                      border: sortBy === value ? "none" : `1px solid ${borderColor}`,
                      background: sortBy === value ? "#2563EB" : surfaceBg,
                      color: sortBy === value ? "#FFFFFF" : titleColor,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, width: isCompact ? "100%" : "auto", justifyContent: isCompact ? "space-between" : "flex-start" }}>
                <span style={{ fontSize: 13, color: textColor }}>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(event) => setItemsPerPage(Number(event.target.value))}
                  style={{
                    height: 38,
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    background: surfaceBg,
                    color: titleColor,
                    fontSize: 13,
                    padding: "0 12px",
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {courseStore.error && !courseStore.isLoading ? (
            <div
              style={{
                marginBottom: 18,
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px solid #FECACA",
                background: "#FEF2F2",
                color: "#991B1B",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {courseStore.error}
            </div>
          ) : null}

          {courseStore.isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 90, gap: 14 }}>
              <FiLoader size={42} style={{ color: "#2563EB", animation: "spin 0.8s linear infinite" }} />
              <p style={{ margin: 0, color: textColor }}>Loading courses...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "90px 24px",
                background: surfaceBg,
                borderRadius: 24,
                border: `1px solid ${borderColor}`,
                boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
              }}
            >
              <FiBookOpen size={44} style={{ color: mutedTextColor, margin: "0 auto 14px" }} />
              <p style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: titleColor }}>No courses match these filters</p>
              <p style={{ margin: 0, fontSize: 14, color: textColor }}>
                Try clearing one or two filters, or create a new course to expand the catalog.
              </p>
            </div>
          ) : (
            <>
              {isCompact ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {currentCourses.map((course) => {
                    const visibilityType = course.visibility?.type || "private";
                    const courseType = course.courseType || (course.scormFilePath ? "scorm" : "standard");
                    const assessment = course.assessment;

                    return (
                      <div
                        key={course._id}
                        style={{
                          borderRadius: 18,
                          border: `1px solid ${borderColor}`,
                          background: surfaceBg,
                          padding: 14,
                          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
                        }}
                      >
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 14,
                              background: "linear-gradient(135deg, #DBEAFE 0%, #ECFEFF 100%)",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {course.thumbnailUrl ? (
                              <img src={course.thumbnailUrl} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <FiBookOpen size={22} style={{ color: "#2563EB" }} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: titleColor }}>{course.title}</div>
                            <div style={{ marginTop: 4, fontSize: 12, color: mutedTextColor }}>
                              {course.courseCode || "No course code"}
                            </div>
                            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: visibilityType === "public" ? "#ECFDF5" : "#EFF6FF", color: visibilityType === "public" ? "#047857" : "#1D4ED8", fontSize: 11, fontWeight: 700 }}>
                                {visibilityType === "public" ? <FiGlobe size={11} /> : <FiLock size={11} />}
                                {visibilityType === "public" ? "Public" : "Private"}
                              </span>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: course.status === "published" ? "#DCFCE7" : "#FEF3C7", color: course.status === "published" ? "#166534" : "#92400E", fontSize: 11, fontWeight: 700 }}>
                                {course.status === "published" ? "Published" : "Draft"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
                          <div>
                            <div style={{ fontSize: 10, textTransform: "uppercase", color: mutedTextColor }}>Type</div>
                            <div style={{ marginTop: 2, fontSize: 12, fontWeight: 600, color: titleColor }}>{courseType === "scorm" ? "SCORM" : "Standard"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, textTransform: "uppercase", color: mutedTextColor }}>Price</div>
                            <div style={{ marginTop: 2, fontSize: 12, fontWeight: 600, color: titleColor }}>{formatCurrency(course.commerce?.amountInRupees)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, textTransform: "uppercase", color: mutedTextColor }}>Assessment</div>
                            <div style={{ marginTop: 2, fontSize: 12, fontWeight: 600, color: titleColor }}>{assessment?.totalMarks ? `${assessment.totalMarks} marks` : "Not set"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, textTransform: "uppercase", color: mutedTextColor }}>Popularity</div>
                            <div style={{ marginTop: 2, fontSize: 12, fontWeight: 600, color: titleColor }}>{course.metrics?.popularityScore || course.enrollmentCount || 0}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                          <MotionButton
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleOpenDetails(course)}
                            style={{ borderRadius: 12, border: `1px solid ${borderColor}`, background: surfaceBg, color: titleColor, padding: "8px 12px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                          >
                            <FiEye size={12} />
                            View
                          </MotionButton>
                          {canEditCourses ? (
                            <MotionButton
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleOpenEdit(course)}
                              style={{ borderRadius: 12, border: `1px solid ${borderColor}`, background: surfaceBg, color: "#1D4ED8", padding: "8px 12px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                            >
                              <FiEdit3 size={12} />
                              Edit
                            </MotionButton>
                          ) : null}
                          {canDeleteCourses ? (
                            <MotionButton
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={async () => {
                                if (confirm("Delete this course?")) {
                                  await courseStore.deleteCourse(course._id);
                                }
                              }}
                              style={{ borderRadius: 12, border: `1px solid ${borderColor}`, background: surfaceBg, color: "#DC2626", padding: "8px 12px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                            >
                              <FiTrash2 size={12} />
                              Delete
                            </MotionButton>
                          ) : null}
                          {canViewUsers ? (
                            <MotionButton
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setCourseUsersModal({ courseId: course._id, courseTitle: course.title })}
                              style={{ borderRadius: 12, border: `1px solid ${borderColor}`, background: surfaceBg, color: "#7C3AED", padding: "8px 12px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                            >
                              <FiUsers size={12} />
                              View Users
                            </MotionButton>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    borderRadius: 24,
                    border: `1px solid ${borderColor}`,
                    background: surfaceBg,
                    overflow: "hidden",
                    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
                  }}
                >
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1160 }}>
                    <thead>
                      <tr style={{ background: tableHeaderBg, borderBottom: `1px solid ${borderColor}` }}>
                        {["Course","ID", "Visibility", "Type", "Status", "Assessment", "Price", "Popularity", "Actions"].map((label) => (
                          <th
                            key={label}
                            style={{
                              textAlign: label === "Actions" ? "center" : "left",
                              padding: "16px 18px",
                              fontSize: 12,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: mutedTextColor,
                            }}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentCourses.map((course, index) => {
                        const visibilityType = course.visibility?.type || "private";
                        const courseType = course.courseType || (course.scormFilePath ? "scorm" : "standard");
                        const assessment = course.assessment;

                        return (
                          <tr
                            key={course._id}
                            style={{
                              borderBottom: `1px solid ${borderColor}`,
                              transition: "background 0.2s ease",
                            }}
                            onMouseEnter={(event) => {
                              event.currentTarget.style.background = rowHoverBg;
                            }}
                            onMouseLeave={(event) => {
                              event.currentTarget.style.background = "transparent";
                            }}
                          >
                            <td style={{ padding: "16px 18px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div
                                  style={{
                                    width: 54,
                                    height: 54,
                                    borderRadius: 16,
                                    background: "linear-gradient(135deg, #DBEAFE 0%, #ECFEFF 100%)",
                                    overflow: "hidden",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  {course.thumbnailUrl ? (
                                    <img src={course.thumbnailUrl} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  ) : (
                                    <FiBookOpen size={24} style={{ color: "#2563EB" }} />
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: titleColor }}>{course.title}</div>
                                  <div style={{ marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: mutedTextColor }}>
                                    <span>{course.taxonomy?.level || "Beginner"}</span>
                                    {(course.taxonomy?.categories || []).slice(0, 2).map((category) => (
                                      <span key={`${course._id}-${category}`}>{category}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                                 <div style={{ marginTop: 4, fontSize: 12, color: mutedTextColor }}>
                                {course.courseCode || (course.taxonomy?.languages || []).slice(0, 2).join(", ") || "No language tags"}
                              </div>
                            </td>
                            <td style={{ padding: "16px 18px" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "7px 12px",
                                  borderRadius: 999,
                                  background: visibilityType === "public" ? "#ECFDF5" : "#EFF6FF",
                                  color: visibilityType === "public" ? "#047857" : "#1D4ED8",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {visibilityType === "public" ? <FiGlobe size={12} /> : <FiLock size={12} />}
                                {visibilityType === "public" ? "Public" : "Private"}
                              </span>
                            </td>
                            <td style={{ padding: "16px 18px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: titleColor, fontSize: 13, fontWeight: 600 }}>
                                {courseType === "scorm" ? <FiSettings size={14} color="#2563EB" /> : <FiGrid size={14} color="#059669" />}
                                {courseType === "scorm" ? "SCORM" : "Standard"}
                              </span>
                            </td>
                            <td style={{ padding: "16px 18px" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "7px 12px",
                                  borderRadius: 999,
                                  background: course.status === "published" ? "#DCFCE7" : "#FEF3C7",
                                  color: course.status === "published" ? "#166534" : "#92400E",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {course.status === "published" ? "Published" : "Draft"}
                              </span>
                            </td>
                            <td style={{ padding: "16px 18px" }}>
                              <div style={{ fontSize: 13, color: titleColor, fontWeight: 600 }}>
                                {assessment?.totalMarks
                                  ? `${assessment.totalMarks} total marks`
                                  : "Not configured"}
                              </div>
                           
                            </td>
                            <td style={{ padding: "16px 18px" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: titleColor }}>
                                <FiDollarSign size={14} color="#0F766E" />
                                {formatCurrency(course.commerce?.amountInRupees)}
                              </div>
                              <div style={{ marginTop: 4, fontSize: 12, color: mutedTextColor }}>
                                {course.commerce?.pricingModel === "paid" ? "Paid course" : "Free course"}
                              </div>
                            </td>
                            <td style={{ padding: "16px 18px" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: titleColor }}>
                                <FiTrendingUp size={14} color="#7C3AED" />
                                {course.metrics?.popularityScore || course.enrollmentCount || 0}
                              </div>
                              <div style={{ marginTop: 4, fontSize: 12, color: mutedTextColor }}>
                                {course.metrics?.averageRating ? `${course.metrics.averageRating.toFixed(1)} rated` : "Awaiting ratings"}
                              </div>
                            </td>
                            <td style={{ padding: "14px 18px", textAlign: "center" }}>
                              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                                <MotionButton
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleOpenDetails(course)}
                                  style={{
                                    borderRadius: 12,
                                    border: `1px solid ${borderColor}`,
                                    background: surfaceBg,
                                    color: titleColor,
                                    padding: "8px 12px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    cursor: "pointer",
                                  }}
                                >
                                  <FiEye size={12} />
                                  View
                                </MotionButton>

                                {canEditCourses ? (
                                  <MotionButton
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleOpenEdit(course)}
                                    style={{
                                      borderRadius: 12,
                                      border: `1px solid ${borderColor}`,
                                      background: surfaceBg,
                                      color: "#1D4ED8",
                                      padding: "8px 12px",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <FiEdit3 size={12} />
                                    Edit
                                  </MotionButton>
                                ) : null}

                                {canDeleteCourses ? (
                                  <MotionButton
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={async () => {
                                      if (confirm("Delete this course?")) {
                                        await courseStore.deleteCourse(course._id);
                                      }
                                    }}
                                    style={{
                                      borderRadius: 12,
                                      border: `1px solid ${borderColor}`,
                                      background: surfaceBg,
                                      color: "#DC2626",
                                      padding: "8px 12px",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <FiTrash2 size={12} />
                                    Delete
                                  </MotionButton>
                                ) : null}
                                {canViewUsers ? (
                                  <MotionButton
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setCourseUsersModal({ courseId: course._id, courseTitle: course.title })}
                                    style={{
                                      borderRadius: 12,
                                      border: `1px solid ${borderColor}`,
                                      background: surfaceBg,
                                      color: "#7C3AED",
                                      padding: "8px 12px",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <FiUsers size={12} />
                                    View Users
                                  </MotionButton>
                                ) : null}

                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center", marginTop: 18 }}>
                <p style={{ margin: 0, color: textColor, fontSize: 13 }}>
                  Showing <strong style={{ color: titleColor }}>{totalCourses === 0 ? 0 : startIndex + 1}</strong> to{" "}
                  <strong style={{ color: titleColor }}>{Math.min(endIndex, totalCourses)}</strong> of{" "}
                  <strong style={{ color: titleColor }}>{totalCourses}</strong> filtered courses
                </p>

                <div style={{ display: "flex", gap: 8, alignItems: "center", width: isCompact ? "100%" : "auto", justifyContent: isCompact ? "space-between" : "flex-start" }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${borderColor}`,
                      background: surfaceBg,
                      color: currentPage === 1 ? mutedTextColor : titleColor,
                      padding: isCompact ? "9px 10px" : "9px 12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      opacity: currentPage === 1 ? 0.55 : 1,
                    }}
                  >
                    <FiChevronLeft size={14} />
                    Prev
                  </button>

                  <div style={{ display: "flex", gap: 6 }}>
                    {Array.from({ length: totalPages }, (_, index) => index + 1)
                      .slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5)
                      .map((pageNumber) => (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setCurrentPage(pageNumber)}
                          style={{
                            minWidth: 36,
                            padding: isCompact ? "8px 10px" : "9px 12px",
                            borderRadius: 12,
                            border: currentPage === pageNumber ? "none" : `1px solid ${borderColor}`,
                            background: currentPage === pageNumber ? "#2563EB" : surfaceBg,
                            color: currentPage === pageNumber ? "#FFFFFF" : titleColor,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {pageNumber}
                        </button>
                      ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${borderColor}`,
                      background: surfaceBg,
                      color: currentPage === totalPages ? mutedTextColor : titleColor,
                      padding: isCompact ? "9px 10px" : "9px 12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      opacity: currentPage === totalPages ? 0.55 : 1,
                    }}
                  >
                    Next
                    <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {courseUsersModal && (
        <CourseUsersModal
          isOpen={!!courseUsersModal}
          onClose={() => setCourseUsersModal(null)}
          courseId={courseUsersModal.courseId}
          courseTitle={courseUsersModal.courseTitle}
        />
      )}
    </PermissionGate>
  );
}

export default observer(CoursePage);
