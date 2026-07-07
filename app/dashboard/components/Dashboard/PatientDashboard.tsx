import {
  Box,
  Heading,
  SimpleGrid,
  Skeleton,
  Text,
  AspectRatio,
  useToken,
  Grid,
} from "@chakra-ui/react";
import { Bar } from "react-chartjs-2";
import { FaClipboardList, FaCalendarCheck, FaPrescriptionBottle } from "react-icons/fa";
import DashboardCard from "../common/DashboardCard/DashboardCard";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import stores from "../../../store/stores";

const PatientDashboard = observer(() => {
  const {
    dashboardStore: { getPatientDashboardCount, patientCount },
  } = stores;


  useEffect(() => {
    getPatientDashboardCount();
  }, [getPatientDashboardCount]);

  // Example patient dashboard data
  const dashboardData = [
    {
      label: "Appointments",
      value: patientCount?.data?.appointments || 0,
      icon: FaCalendarCheck,
      color: "blue",
      href: "/dashboard/appointments",
    },
    {
      label: "Orders",
      value: patientCount?.data?.orders || 0,
      icon: FaClipboardList,
      color: "green",
      href: "/dashboard/orders",
    },
    {
      label: "Prescriptions",
      value: patientCount?.data?.prescriptions || 0,
      icon: FaPrescriptionBottle,
      color: "purple",
      href: "/patient/prescriptions",
    },
  ];

  const [brand500, brand600, brand900] = useToken("colors", ["brand.500", "brand.600", "brand.900"]);

  const userChartData = {
    labels: dashboardData.map((d) => d.label),
    datasets: [
      {
        label: "Patient Activities",
        data: dashboardData.map((d) => d.value),
        backgroundColor: [brand500, brand600, brand900],
        borderColor: [brand600, brand900, brand500],
        borderWidth: 2,
      },
    ],
  };

  const barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { position: "top" }, title: { display: false } },
    scales: { y: { beginAtZero: true }, x: { ticks: { autoSkip: true, maxTicksLimit: 12 } } },
    layout: { padding: 8 },
  };

  return (
    <Box p={5}>
      <Heading mb={5} size={"lg"} color={"brand.600"}>
        Patient Dashboard
      </Heading>

      {/* Cards Section */}
      <Box mb={4}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {dashboardData.map((item, index) => (
            <Skeleton isLoaded={!patientCount?.loading} key={index} borderRadius="lg">
              <DashboardCard
                label={item.label}
                href={item.href}
                value={item.value}
                icon={item.icon}
                color={item.color}
              />
            </Skeleton>
          ))}
        </SimpleGrid>
      </Box>

      {/* Chart Section */}
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
        <Box bg="white" p={5} borderRadius="lg" boxShadow="md" overflow="hidden">
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Activities Overview
          </Text>
          <AspectRatio ratio={16 / 9}>
            <Bar data={userChartData} options={barChartOptions} />
          </AspectRatio>
        </Box>
      </Grid>
    </Box>
  );
});

export default PatientDashboard;
