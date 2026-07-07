'use client';

import { Box, Stack, Text, UnorderedList, ListItem, Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel } from '@chakra-ui/react';
import React from 'react';

const conditions = [
  "Depression",
  "Anxiety",
  // "Social Anxiety",
  "ADHD",
  "Bipolar Disorder",
  "OCD",
  // "Sleep Disorder",
  "Trauma",
  // "Post-partum Depression",
  // "Autism",
  // "Eating Disorder",
  // "Personality Disorder"
];

// Function to convert condition names into URL slugs
const formatSlug = (text: string) => {
  return text.toLowerCase().replace(/\s+/g, '-');
};

const Conditions = () => {
  return (
    <Box mb={2}>
      {/* Desktop Version */}
      <Box display={{ base: 'none', md: 'block' }}>
        <Stack align={'flex-start'} mt={2}>
          <Text fontWeight={'400'} fontSize={'lg'} mb={1}>
            Conditions We Treat
          </Text>
          <UnorderedList listStyleType={'none'} ml={0}>
            {conditions.map((condition, index) => {
              const slug = formatSlug(condition);
              return (
                <ListItem
                  fontSize={'sm'}
                  ml={0}
                  display="block"
                  key={index}
                  cursor="pointer"
                  _hover={{ textDecoration: 'underline' }}
                >
                  <a
                    href={`/condition/${slug}`}
                    // No target="_blank", so it will not open in a new tab
                    // User can right-click and choose "Open in new tab"
                    rel="noopener noreferrer" // For security reasons
                  >
                    {condition}
                  </a>
                </ListItem>
              );
            })}
          </UnorderedList>
        </Stack>
      </Box>

      {/* Mobile Version with Accordion */}
      <Box display={{ base: 'block', md: 'none' }} mt={2}>
        <Accordion allowToggle>
          <AccordionItem border="none">
            <AccordionButton _hover={{ bg: 'transparent' }} _expanded={{ bg: 'transparent' }}>
              <Box flex="1" textAlign="left" fontWeight={'400'} fontSize={'lg'}>
                Conditions We Treat
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <UnorderedList listStyleType={'none'} ml={0}>
                {conditions.map((condition, index) => {
                  const slug = formatSlug(condition);
                  return (
                    <ListItem
                      fontSize={'sm'}
                      ml={0}
                      display="block"
                      key={index}
                      cursor="pointer"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      <a
                        href={`/condition/${slug}`}
                        // No target="_blank", so it will not open in a new tab
                        // User can right-click and choose "Open in new tab"
                        rel="noopener noreferrer" // For security reasons
                      >
                        {condition}
                      </a>
                    </ListItem>
                  );
                })}
              </UnorderedList>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>
    </Box>
  );
};

export default Conditions;
