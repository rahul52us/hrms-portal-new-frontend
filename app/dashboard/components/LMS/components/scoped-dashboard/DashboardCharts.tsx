"use client";

import {
  Box,
  Grid,
  Heading,
  HStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { FiBarChart2 } from "react-icons/fi";
import { DashboardChartEntry, ScopedDashboardSummary } from "./types";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
);

const COLORS = ["#7C3AED", "#2563EB", "#0D9488", "#EA580C", "#DB2777", "#64748B"];

function ChartCard({
  title,
  subtitle,
  entries,
  children,
}: {
  title: string;
  subtitle: string;
  entries: DashboardChartEntry[];
  children: React.ReactNode;
}) {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={{ base: 4, md: 5 }}
      boxShadow="sm"
      minW={0}
    >
      <HStack align="flex-start" mb={4}>
        <Box color="purple.500" pt={1}>
          <FiBarChart2 />
        </Box>
        <Box minW={0}>
          <Heading size="sm">{title}</Heading>
          <Text mt={1} fontSize="xs" color="gray.500" noOfLines={1}>
            {subtitle}
          </Text>
        </Box>
      </HStack>
      {entries.some((entry) => entry.value > 0) ? (
        <Box h={{ base: "220px", md: "245px" }} minW={0}>
          {children}
        </Box>
      ) : (
        <Box
          h={{ base: "180px", md: "245px" }}
          display="grid"
          placeItems="center"
          borderRadius="lg"
          bg={useColorModeValue("gray.50", "gray.900")}
        >
          <Text fontSize="sm" color="gray.500">
            No data for the selected filters.
          </Text>
        </Box>
      )}
    </Box>
  );
}

function labels(entries: DashboardChartEntry[]) {
  return entries.map((entry) => entry.label);
}

function values(entries: DashboardChartEntry[]) {
  return entries.map((entry) => entry.value);
}

export function DashboardCharts({
  role,
  charts,
}: {
  role: "admin" | "departmenthead";
  charts: ScopedDashboardSummary["charts"];
}) {
  const textColor = useColorModeValue("#475569", "#CBD5E1");
  const gridColor = useColorModeValue("rgba(148,163,184,.16)", "rgba(148,163,184,.12)");
  const completion = charts?.enrollmentsByStatus || [];
  const progress = charts?.progressDistribution || [];
  const completionTrend = charts?.completionTrend || [];
  const roleOrDepartment =
    role === "admin" && charts?.departmentProgress?.length
      ? charts.departmentProgress
      : charts?.usersByRole || [];
  const quiz = charts?.quizPerformance || [];

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: textColor, usePointStyle: true, boxWidth: 8, padding: 14 },
      },
    },
  };

  const axisOptions = {
    ...baseOptions,
    plugins: { ...baseOptions.plugins, legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor } },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textColor, precision: 0 },
      },
    },
  };

  return (
    <Grid templateColumns={{ base: "1fr", xl: "repeat(2, minmax(0, 1fr))" }} gap={4}>
      <ChartCard
        title="Course completion"
        subtitle="Completed, in-progress, and not-started enrollments"
        entries={completion}
      >
        <Doughnut
          data={{
            labels: labels(completion),
            datasets: [
              {
                data: values(completion),
                backgroundColor: ["#0D9488", "#7C3AED", "#CBD5E1"],
                borderWidth: 0,
                hoverOffset: 6,
              },
            ],
          }}
          options={{ ...baseOptions, cutout: "68%" } as any}
        />
      </ChartCard>

      <ChartCard
        title="Learner progress"
        subtitle="Distribution of progress across assigned learning"
        entries={progress}
      >
        <Bar
          data={{
            labels: labels(progress),
            datasets: [
              {
                data: values(progress),
                backgroundColor: "#7C3AED",
                borderRadius: 8,
                maxBarThickness: 42,
              },
            ],
          }}
          options={axisOptions as any}
        />
      </ChartCard>

      <ChartCard
        title="Completion trend"
        subtitle="Course completions recorded over the last six months"
        entries={completionTrend}
      >
        <Line
          data={{
            labels: labels(completionTrend),
            datasets: [
              {
                data: values(completionTrend),
                borderColor: "#2563EB",
                backgroundColor: "rgba(37,99,235,.12)",
                fill: true,
                tension: 0.35,
                pointRadius: 3,
                pointBackgroundColor: "#2563EB",
              },
            ],
          }}
          options={axisOptions as any}
        />
      </ChartCard>

      <ChartCard
        title={role === "admin" && charts?.departmentProgress?.length ? "Department progress" : "User roles"}
        subtitle={
          role === "admin" && charts?.departmentProgress?.length
            ? "Average learning progress by department"
            : "People distribution within the current scope"
        }
        entries={roleOrDepartment}
      >
        <Bar
          data={{
            labels: labels(roleOrDepartment),
            datasets: [
              {
                data: values(roleOrDepartment),
                backgroundColor: roleOrDepartment.map(
                  (_, index) => COLORS[index % COLORS.length]
                ),
                borderRadius: 8,
                maxBarThickness: 42,
              },
            ],
          }}
          options={{
            ...axisOptions,
            indexAxis: "y",
            scales: {
              x: {
                beginAtZero: true,
                grid: { color: gridColor },
                ticks: { color: textColor, precision: 0 },
              },
              y: { grid: { display: false }, ticks: { color: textColor } },
            },
          } as any}
        />
      </ChartCard>

      {quiz.some((entry) => entry.value > 0) ? (
        <ChartCard
          title="Assessment performance"
          subtitle="Quiz attempts grouped into score bands"
          entries={quiz}
        >
          <Bar
            data={{
              labels: labels(quiz),
              datasets: [
                {
                  data: values(quiz),
                  backgroundColor: ["#0D9488", "#EA580C", "#DC2626"],
                  borderRadius: 8,
                  maxBarThickness: 56,
                },
              ],
            }}
            options={axisOptions as any}
          />
        </ChartCard>
      ) : null}
    </Grid>
  );
}
