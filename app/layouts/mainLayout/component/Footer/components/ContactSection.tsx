import { PhoneIcon } from '@chakra-ui/icons';
import { HStack, Icon, Link, Stack, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { FaLocationDot } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
}

const ContactSection: React.FC<{ contactInfo: ContactInfo }> = ({ contactInfo }) => {
  // Direct Google Maps directions link
  const mapLink = "https://www.google.com/maps/dir//2nd+Floor,+LC+complex+Sector+49,+near+metro+station,+Sector+76,+Noida,+Uttar+Pradesh+201301/@28.5609498,77.2974875,23873m/data=!3m1!1e3!4m8!4m7!1m0!1m5!1m1!1s0x390ce592e19046f1:0x599b3c70b26f832b!2m2!1d77.3798889!2d28.5609747?entry=ttu";

  return (
    <Stack align={'flex-start'} mt={4}>
      <Text fontWeight={'400'} fontSize={'lg'} mb={1}>
        Contact Us
      </Text>
      <VStack align="start" spacing={3} fontSize={'15px'}>
        <HStack>
          <PhoneIcon color={'#DF837C'} />
          <Text>{contactInfo.phone}</Text>
        </HStack>
        <HStack>
          <Icon as={MdEmail} mt={1} color={'#DF837C'} />
          <Text>{contactInfo.email}</Text>
        </HStack>
        <HStack align="flex-start">
          <Icon as={FaLocationDot} mt={1} color={'#DF837C'} />
          <Link href={mapLink} target="_blank" rel="noopener noreferrer" w={'90%'}>
            {contactInfo.address}
          </Link>
        </HStack>
      </VStack>
    </Stack>
  );
};

export default ContactSection;
