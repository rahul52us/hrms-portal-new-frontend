import { AddIcon, DeleteIcon, TimeIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Switch,
  Text,
  Tooltip,
  VStack
} from '@chakra-ui/react'

const OperatingHours = ({ schedule, setSchedule }) => {
  const handleToggleDay = (index) => {
    const newSchedule = [...schedule]
    newSchedule[index].isOpen = !newSchedule[index].isOpen
    setSchedule(newSchedule)
  }

  const handleAddSlot = (dayIndex) => {
    const newSchedule = [...schedule]
    newSchedule[dayIndex].slots.push({ start: '', end: '' })
    setSchedule(newSchedule)
  }

  const handleRemoveSlot = (dayIndex, slotIndex) => {
    const newSchedule = [...schedule]
    newSchedule[dayIndex].slots.splice(slotIndex, 1)
    setSchedule(newSchedule)
  }

  const handleTimeChange = (dayIndex, slotIndex, field, value) => {
    const newSchedule = [...schedule]
    newSchedule[dayIndex].slots[slotIndex][field] = value
    setSchedule(newSchedule)
  }

  return (
    <Box w="100%" p={4} bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4} pb={4} borderBottomWidth="1px" borderColor="gray.100">
        <Box>
            <HStack mb={1}>
                <TimeIcon color="blue.500" boxSize={5} />
                <Heading size="md" color="gray.700">Operating Hours</Heading>
            </HStack>
            <Text fontSize="sm" color="gray.500">
                Configure your weekly availability. Toggle days to mark them as closed.
            </Text>
        </Box>
      </Flex>

      {/* Schedule List */}
      <VStack spacing={0} align="stretch" divider={<Divider borderColor="gray.100" />}>
        {schedule.map((dayData, dayIndex) => (
          <Flex 
            key={dayData.day} 
            py={5} 
            direction={{ base: 'column', md: 'row' }} 
            align={{ base: 'flex-start', md: 'flex-start' }}
            bg={dayData.isOpen ? 'transparent' : 'gray.50'}
            _hover={{ bg: dayData.isOpen ? 'gray.50' : 'gray.100' }}
            transition="background 0.2s"
            borderRadius="md"
            px={4}
            mx={-4} // Negative margin to make hover effect full width inside padding
          >
            {/* Left Column: Day Toggle */}
            <Flex width={{ base: '100%', md: '200px' }} align="center" mb={{ base: 3, md: 0 }}>
              <Switch 
                isChecked={dayData.isOpen} 
                onChange={() => handleToggleDay(dayIndex)} 
                colorScheme="green"
                mr={4}
                size="lg"
              />
              <Box>
                <Text fontWeight="bold" color="gray.700">{dayData.day}</Text>
                <Badge 
                    colorScheme={dayData.isOpen ? "green" : "red"} 
                    variant="subtle" 
                    fontSize="0.65rem"
                >
                    {dayData.isOpen ? "OPEN" : "CLOSED"}
                </Badge>
              </Box>
            </Flex>

            {/* Right Column: Time Slots */}
            <Box flex={1} width="100%">
              {dayData.isOpen ? (
                <VStack align="stretch" spacing={3}>
                  {dayData.slots.map((slot, slotIndex) => (
                    <Flex key={slotIndex} gap={3} align="flex-end">
                      <FormControl maxW="150px">
                        {slotIndex === 0 && (
                            <FormLabel fontSize="xs" color="gray.400" mb={1} textTransform="uppercase" fontWeight="bold">
                                Opens at
                            </FormLabel>
                        )}
                        <Input 
                          type="time" 
                          size="sm" 
                          bg="white"
                          value={slot.start} 
                          onChange={(e) => handleTimeChange(dayIndex, slotIndex, 'start', e.target.value)}
                        />
                      </FormControl>
                      
                      <Text pb={1} color="gray.300">—</Text>

                      <FormControl maxW="150px">
                         {slotIndex === 0 && (
                            <FormLabel fontSize="xs" color="gray.400" mb={1} textTransform="uppercase" fontWeight="bold">
                                Closes at
                            </FormLabel>
                        )}
                        <Input 
                          type="time" 
                          size="sm" 
                          bg="white"
                          value={slot.end}
                          onChange={(e) => handleTimeChange(dayIndex, slotIndex, 'end', e.target.value)}
                        />
                      </FormControl>

                      <Tooltip label="Remove this shift" hasArrow>
                        <IconButton
                            aria-label="Remove slot"
                            icon={<DeleteIcon />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            opacity={0.6}
                            _hover={{ opacity: 1, bg: 'red.50' }}
                            mb={1}
                            onClick={() => handleRemoveSlot(dayIndex, slotIndex)}
                            isDisabled={dayData.slots.length === 1 && slotIndex === 0} 
                        />
                      </Tooltip>
                    </Flex>
                  ))}

                  {/* Add Slot Button */}
                  <Button 
                    size="xs" 
                    leftIcon={<AddIcon />} 
                    variant="link" 
                    colorScheme="blue" 
                    alignSelf="flex-start"
                    mt={1}
                    onClick={() => handleAddSlot(dayIndex)}
                  >
                    Add split shift
                  </Button>
                </VStack>
              ) : (
                <Flex h="100%" align="center">
                    <Text fontSize="sm" color="gray.500" fontStyle="italic">
                        Not accepting appointments on this day.
                    </Text>
                </Flex>
              )}
            </Box>
          </Flex>
        ))}
      </VStack>
    </Box>
  )
}

export default OperatingHours