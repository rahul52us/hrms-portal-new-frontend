"use client";

import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Switch,
  Tag,
  TagCloseButton,
  TagLabel,
  Textarea,
  useColorMode,
  useColorModeValue,
  useTheme,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import debounce from "lodash/debounce";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Select from "react-select";
import CreatableSelect from 'react-select/creatable';
import stores from "../../../../store/stores";

interface CustomInputProps {
  type?:
  | "editor"
  | "password"
  | "number"
  | "text"
  | "radio"
  | "file"
  | "switch"
  | "textarea"
  | "select"
  | "creatable-select"
  | "date"
  | "time"
  | "checkbox"
  | "url"
  | "phone"
  | "dateAndTime"
  | "file-drag"
  | "tags"
  | "real-time-user-search"
  | "real-time-search"
  | "timeOnly";
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  maxDate?: string; // Date string type
  minDate?: string; // Date string type
  disabledDates?: string[]; // Array of date strings
  name: string;
  isClear?: boolean;
  onChange?: any;
  onBlur?: any;
  value?: any;
  w?: string;
  options?: { label: string; value: string }[]; // Options for select dropdown
  isSearchable?: boolean;
  isMulti?: boolean;
  getOptionLabel?: any;
  getOptionValue?: any;
  rows?: number;
  disabled?: boolean;
  showError?: boolean;
  style?: React.CSSProperties;
  phone?: string;
  accept?: string; // File accept type (string)
  readOnly?: boolean;
  labelcolor?: string;
  isPortal?: boolean;
  params?: any;
  query?: any;
  parentStyle?: any;
  shouldUpdateSelectWithValue?: any
  colorScheme?: any;
  id?: string;
  onKeyDown?: any;
}

const CustomInput: React.FC<CustomInputProps> = ({
  type,
  label,
  placeholder,
  error,
  name,
  value,
  onChange,
  required,
  isClear = false,
  options,
  isSearchable,
  isMulti,
  getOptionLabel,
  getOptionValue,
  disabled,
  rows,
  style,
  showError,
  accept,
  readOnly,
  labelcolor,
  isPortal,
  minDate,
  maxDate,
  params,
  colorScheme,
  query = {},
  parentStyle = {},
  shouldUpdateSelectWithValue = false,
  ...rest
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const theme = useTheme();
  const isMounted = useRef(false);
  const { colorMode } = useColorMode();
  const [userOptions, setUserOptions] = useState(options || []);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState("");

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };


  useEffect(() => {
    if (shouldUpdateSelectWithValue) {
      setUserOptions(options)
    }
  }, [options])


  // console.log('options are', options)

  const fetchSearchUsers = useCallback(
    async (searchValue: string) => {
      if (searchValue?.trim() === "") {
        return;
      }

      try {
        if (type === "real-time-user-search") {
          const response: any = await stores.auth.getCompanyUsers({
            page: 1,
            searchValue: searchValue,
            ...query,
          });

          setUserOptions(
            response.map((it: any) => ({
              label: `${it.user.name || it.user.email || it.user.username} (${it.user.email || it.user.username})`,
              value: it.user._id,
              name: it.user.name,
              email: it.user.email || it.user.username,
              username: it.user.username,
              code: it.user.code,
              role: it.user.role || it.user.userType,
              company: it.user.company,
              createdBy: it.user.createdBy,
            }))
          );
        } else if (type === "real-time-search") {
          const { entityName, functionName, key } = params || {};

          if (!entityName || !stores[entityName]) {
            throw new Error(`Invalid entityName: ${entityName}`);
          }

          // check function
          const entityStore = stores[entityName];
          if (
            !functionName ||
            typeof entityStore[functionName] !== "function"
          ) {
            throw new Error(
              `Invalid functionName: ${functionName} for entity: ${entityName}`
            );
          }

          // call the store function dynamically
          const response: any = await entityStore[functionName]({
            page: 1,
            searchValue: searchValue,
            ...query,
          });

          if (Array.isArray(response?.data)) {
            return setUserOptions(
              response.data.map((item: any) => ({
                label: item[key] || "Unknown",
                value: item._id,
              }))
            );
          }
          // map using provided key
        }
      } catch (err: any) {
        alert(err?.message);
      }
    },
    [type, params, query]
  );

  const debouncedFetchSearchUserResults = useMemo(
    () => debounce(fetchSearchUsers, 800),
    [fetchSearchUsers]
  );

  // const handleSelectChange = (selectedOption: any) => {
  //   if (onChange) {
  //     onChange(selectedOption ? selectedOption.value : "");
  //   }
  //   setSearchInput(selectedOption ? selectedOption.label : "");
  // };

  useEffect(() => {
    if (isMounted?.current && searchInput?.trim() !== "") {
      debouncedFetchSearchUserResults(searchInput);
    } else {
      isMounted.current = true;
    }
  }, [searchInput, debouncedFetchSearchUserResults]);

  const handleFileDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const files = event.dataTransfer.files;
      if (onChange) {
        onChange({ target: { name, files } });
      }
    },
    [name, onChange]
  );

  const handleTagAdd = (
    e?:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLButtonElement>
  ) => {
    if ((e && "key" in e && e.key !== "Enter") || !inputValue.trim()) {
      return;
    }

    const newTags = [...(value || []), inputValue.trim()];
    if (onChange) {
      onChange(newTags);
    }
    setInputValue(""); // Clear input
  };

  const handleTagRemove = (tagToRemove: string) => {
    const newTags = (value || []).filter((tag: string) => tag !== tagToRemove);
    if (onChange) {
      onChange(newTags);
    }
  };

  const inputBg = useColorModeValue("white", "darkBrand.50");
  const subtleBg = useColorModeValue("brand.50", "darkBrand.100");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const focusBorderColor = "brand.500";
  const hoverBorderColor = useColorModeValue("brand.300", "brand.400");
  const placeholderColor = useColorModeValue("gray.400", "whiteAlpha.500");
  const textColor = useColorModeValue("gray.800", "whiteAlpha.900");
  const mutedTextColor = useColorModeValue("gray.500", "whiteAlpha.700");
  const focusRing = useColorModeValue(
    "0 0 0 4px rgba(98, 105, 255, 0.16)",
    "0 0 0 4px rgba(98, 105, 255, 0.24)"
  );

  const fieldStyles = {
    bg: inputBg,
    color: textColor,
    borderColor,
    borderRadius: "xl",
    minH: "48px",
    px: 4,
    fontSize: "sm",
    fontWeight: "500",
    boxShadow: useColorModeValue("sm", "none"),
    transition: "all 0.2s ease",
    _placeholder: {
      color: placeholderColor,
      fontSize: "sm",
      fontWeight: "400",
    },
    _hover: {
      borderColor: hoverBorderColor,
      boxShadow: useColorModeValue("md", "0 0 0 1px rgba(255,255,255,0.04)"),
    },
    _focus: {
      borderColor: focusBorderColor,
      boxShadow: focusRing,
      transform: "translateY(-1px)",
    },
    _focusVisible: {
      borderColor: focusBorderColor,
      boxShadow: focusRing,
      transform: "translateY(-1px)",
    },
    _disabled: {
      bg: subtleBg,
      color: mutedTextColor,
      cursor: "not-allowed",
      opacity: 1,
    },
    _readOnly: {
      bg: subtleBg,
    },
  } as const;

  const getSelectStyles = () => ({
    control: (baseStyles: any, state: any) => ({
      ...baseStyles,
      minHeight: "48px",
      borderRadius: "16px",
      paddingLeft: "4px",
      paddingRight: "4px",
      borderColor: state.isFocused ? theme.colors.brand[500] : borderColor,
      backgroundColor: inputBg,
      color: textColor,
      fontSize: "14px",
      fontWeight: 500,
      boxShadow: state.isFocused ? focusRing : colorMode === "light" ? "0 1px 2px rgba(15, 23, 42, 0.06)" : "none",
      transition: "all 0.2s ease",
      ":hover": {
        borderColor: hoverBorderColor,
      },
    }),
    valueContainer: (styles: any) => ({
      ...styles,
      padding: "2px 8px",
    }),
    placeholder: (styles: any) => ({
      ...styles,
      color: placeholderColor,
      fontWeight: 400,
    }),
    option: (styles: any, { isSelected, isFocused }: any) => ({
      ...styles,
      backgroundColor:
        colorMode === "light"
          ? isSelected
            ? theme.colors.brand[500]
            : isFocused
              ? theme.colors.brand[50]
              : "white"
          : isSelected
            ? theme.colors.brand[500]
            : isFocused
              ? theme.colors.darkBrand[100]
              : theme.colors.darkBrand[50],
      color: isSelected ? "white" : colorMode === "light" ? textColor : "white",
      padding: "10px 12px",
      cursor: "pointer",
      fontSize: "14px",
      ":hover": {
        backgroundColor:
          colorMode === "light" ? theme.colors.brand[50] : theme.colors.darkBrand[100],
      },
    }),
    menu: (baseStyles: any) => ({
      ...baseStyles,
      backgroundColor: inputBg,
      border: `1px solid ${borderColor}`,
      borderRadius: "18px",
      boxShadow: useColorModeValue(
        "0 20px 45px rgba(15, 23, 42, 0.14)",
        "0 20px 45px rgba(0, 0, 0, 0.32)"
      ),
      overflow: "hidden",
      zIndex: 9999,
    }),
    menuList: (styles: any) => ({
      ...styles,
      padding: "8px",
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    multiValue: (styles: any) => ({
      ...styles,
      backgroundColor: colorMode === "light" ? theme.colors.brand[50] : theme.colors.darkBrand[100],
      borderRadius: "999px",
      paddingLeft: "4px",
    }),
    multiValueLabel: (styles: any) => ({
      ...styles,
      color: colorMode === "light" ? theme.colors.brand[700] : "white",
      fontWeight: 600,
    }),
    multiValueRemove: (styles: any) => ({
      ...styles,
      borderRadius: "999px",
      color: colorMode === "light" ? theme.colors.brand[700] : "white",
      ":hover": {
        backgroundColor: theme.colors.brand[500],
        color: "white",
      },
    }),
    singleValue: (styles: any) => ({
      ...styles,
      color: colorMode === "light" ? textColor : "white",
      fontWeight: 500,
    }),
    input: (styles: any) => ({
      ...styles,
      color: colorMode === "light" ? textColor : "white",
    }),
    clearIndicator: (styles: any) => ({
      ...styles,
      color: mutedTextColor,
      ":hover": {
        color: theme.colors.brand[500],
      },
    }),
    dropdownIndicator: (styles: any) => ({
      ...styles,
      color: mutedTextColor,
      ":hover": {
        color: theme.colors.brand[500],
      },
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
  });

  const renderInputComponent = () => {
    switch (type) {
      case "password":
        return (
          <InputGroup>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              name={name}
              isRequired={required}
              disabled={disabled}
              pr="3.25rem"
              {...fieldStyles}
              {...rest}
            />
            <InputRightElement
              h="full"
              pr={2}
              color={mutedTextColor}
              cursor="pointer"
              onClick={handleTogglePassword}
            >
              {showPassword ? (
                <RiEyeOffLine size={18} />
              ) : (
                <RiEyeLine size={18} />
              )}
            </InputRightElement>
          </InputGroup>
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            name={name}
            disabled={disabled}
            {...fieldStyles}
            {...rest}
          />
        );

      case "textarea":
        return (
          <Textarea
            rows={rows || 3}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            name={name}
            disabled={disabled}
            resize="vertical"
            minH="120px"
            py={3}
            {...fieldStyles}
            {...rest}
          />
        );

      case "switch":
        return (
          <Switch name={name} onChange={onChange} isChecked={value} colorScheme="brand" {...rest} />
        );

      case "checkbox":
        return (
          <Checkbox
            name={name}
            onChange={onChange}
            isChecked={value}
            colorScheme="brand"
            {...rest}
          />
        );

      case "phone":
        return (
          <PhoneInput
            country="in"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            inputStyle={{
              backgroundColor: colorMode === "light" ? "white" : "#1b1f2d",
              borderColor: colorMode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.16)",
              color: colorMode === "light" ? "#1f2937" : "white",
              width: "100%",
              height: "48px",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: 500,
              boxShadow:
                colorMode === "light"
                  ? "0 1px 2px rgba(15, 23, 42, 0.06)"
                  : "none",
            }}
            buttonStyle={{
              backgroundColor: colorMode === "light" ? "#f5f7ff" : "#2f3342",
              borderColor: colorMode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.16)",
              borderTopLeftRadius: "16px",
              borderBottomLeftRadius: "16px",
            }}
            dropdownStyle={{
              backgroundColor: colorMode === "light" ? "white" : "#2f3342",
              color: colorMode === "light" ? "black" : "white",
              borderRadius: "16px",
              boxShadow:
                colorMode === "light"
                  ? "0 20px 45px rgba(15, 23, 42, 0.14)"
                  : "0 20px 45px rgba(0, 0, 0, 0.32)",
            }}
          />
        );
      case "dateAndTime":
        return (
          <Input
            readOnly={readOnly}
            style={style}
            bg={inputBg}
            type="datetime-local"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            name={name}
            disabled={disabled}
            {...fieldStyles}
            {...rest}
          />
        );
      case "tags":
        return (
          <Box>
            <HStack align="start" spacing={3}>
              <Input
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                name={name}
                disabled={disabled}
                onKeyDown={handleTagAdd}
                {...fieldStyles}
              />
              <Button
                onClick={handleTagAdd}
                colorScheme="brand"
                minW="92px"
                h="48px"
                borderRadius="xl"
              >
                Add
              </Button>
            </HStack>
            <Wrap mt={3} spacing={2}>
              {value?.map((tag: string, index: number) => (
                <WrapItem key={index}>
                  <Tag
                    size="md"
                    borderRadius="full"
                    colorScheme="brand"
                    px={3}
                    py={1}
                    boxShadow="sm"
                  >
                    <TagLabel>{tag}</TagLabel>
                    <TagCloseButton onClick={() => handleTagRemove(tag)} />
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        );

      case "file-drag":
        return (
          <div
            style={{
              border: `1.5px dashed ${colorMode === "light" ? "#a4a9ff" : "#78829c"}`,
              borderRadius: "20px",
              padding: "1.25rem",
              textAlign: "center",
              backgroundColor: colorMode === "light" ? "#f8faff" : "#2f3342",
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <Flex direction="column" align="center" gap={3}>
              <Box
                px={3}
                py={1}
                borderRadius="full"
                bg={colorMode === "light" ? "white" : "#1b1f2d"}
                color={mutedTextColor}
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
              >
                File Upload
              </Box>
              <Box color={textColor} fontSize="md" fontWeight="600">
                Drag and drop files here or browse from your device
              </Box>
            </Flex>
            <input
              type="file"
              name={name}
              multiple={isMulti}
              onChange={onChange}
              style={{ display: "none" }}
              id={`multiple-file-upload-with-draggable-${name}`}
              accept={accept}
            />
            <Button
              colorScheme="brand"
              mt={4}
              h="46px"
              px={6}
              borderRadius="xl"
              onClick={() =>
                (
                  document.getElementById(
                    `multiple-file-upload-with-draggable-${name}`
                  ) as unknown as HTMLInputElement
                )?.click()
              }
            >
              Browse
            </Button>
          </div>
        );
      case "url":
        return (
          <Input
            readOnly={readOnly}
            style={style}
            type="url"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            name={name}
            disabled={disabled}
            {...fieldStyles}
            {...rest}
          />
        );

      case "file":
        return (
          <Input
            readOnly={readOnly}
            style={style}
            type="file"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            name={name}
            disabled={disabled}
            py={2.5}
            {...fieldStyles}
            {...rest}
          />
        );
      case "date":
        return (
          <Input
            readOnly={readOnly}
            style={style}
            bg={inputBg}
            type="date"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            name={name}
            disabled={disabled}
            min={minDate}
            max={maxDate}
            {...fieldStyles}
            {...rest}
          />
        );

      case "select":
        return (
          <Select
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            isClearable={isClear ? true : undefined}
            className={`chakra-select ${theme ? theme.components.Select.baseStyle : ""
              }`}
            isMulti={isMulti}
            isSearchable={isSearchable}
            getOptionLabel={getOptionLabel}
            getOptionValue={getOptionValue}
            isDisabled={disabled}
            styles={getSelectStyles()}
            components={{
              IndicatorSeparator: null,
              DropdownIndicator: () => (
                <div className="chakra-select__dropdown-indicator" />
              ),
            }}
            menuPosition={isPortal ? "fixed" : undefined}
            menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
          />
        );

      case "creatable-select":
        return (
          <CreatableSelect
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            isClearable={isClear ? true : undefined}
            className={`chakra-select ${theme ? theme.components.Select.baseStyle : ""
              }`}
            isMulti={isMulti}
            isDisabled={disabled}
            styles={getSelectStyles()}
            components={{
              IndicatorSeparator: null,
              DropdownIndicator: () => (
                <div className="chakra-select__dropdown-indicator" />
              ),
            }}
            menuPosition={isPortal ? "fixed" : undefined}
            menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
          />
        );

      case "timeOnly":
        return (
          <Input
            readOnly={readOnly}
            style={style}
            bg={inputBg}
            type="time"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            name={name}
            disabled={disabled}
            {...fieldStyles}
            {...rest}
          />
        );

      case "real-time-user-search":
      case "real-time-search":
        return isMulti ? (
          <Select
            key={name}
            name={name}
            options={userOptions}
            value={
              isMulti
                ? Array.isArray(value)
                  ? value
                  : [] // Ensure value is always an array for multi-select
                : userOptions.find((opt: any) => opt?.value === value?.value) ||
                value ||
                null
            }
            onChange={(selectedOption: any) => {
              if (isMulti) {
                // Always store an array of objects [{label, value}]
                if (onChange) {
                  onChange(selectedOption || []);
                }
              } else {
                // Store a single selected object or null
                if (onChange) {
                  onChange(selectedOption || null);
                }
              }
            }}
            inputValue={searchInput}
            onInputChange={(input, { action }) => {
              if (action === "input-change") setSearchInput(input);
            }}
            placeholder={placeholder}
            isClearable={!!isClear}
            isMulti={isMulti}
            isSearchable={isSearchable}
            getOptionLabel={getOptionLabel}
            getOptionValue={getOptionValue}
            isDisabled={disabled}
            styles={getSelectStyles()}
            components={{
              IndicatorSeparator: null,
              DropdownIndicator: () => (
                <div className="chakra-select__dropdown-indicator" />
              ),
            }}
            menuPosition={isPortal ? "fixed" : undefined}
          />
        ) : (
          <Select
            key={name}
            name={name}
            options={userOptions}
            value={
              isMulti
                ? Array.isArray(value)
                  ? value?.length > 0
                    ? value
                    : null
                  : null
                : userOptions.find((opt: any) => opt?.value === value?.value) || value || null
            }
            onChange={(selectedOption: any) => {
              if (isMulti) {
                if (onChange) {
                  onChange(selectedOption.map((opt: any) => opt));
                }
                setSearchInput(selectedOption ? selectedOption.label : "");
              } else {
                if (onChange) {
                  onChange(selectedOption ? selectedOption : "");
                }
              }
            }}
            inputValue={searchInput}
            onInputChange={(input) => setSearchInput(input)}
            placeholder={placeholder}
            isClearable={isClear ? true : undefined}
            isMulti={isMulti}
            isSearchable={isSearchable}
            getOptionLabel={getOptionLabel}
            getOptionValue={getOptionValue}
            isDisabled={disabled}
            styles={getSelectStyles()}
            components={{
              IndicatorSeparator: null,
              DropdownIndicator: () => (
                <div className="chakra-select__dropdown-indicator" />
              ),
            }}
            menuPosition={isPortal ? "fixed" : undefined}
          />
        );

      default:
        return (
          <Input
            type="text"
            placeholder={placeholder}
            value={value}
            isDisabled={disabled}
            onChange={onChange}
            name={name}
            {...fieldStyles}
            {...rest}
          />
        );
    }
  };

  return (
    <FormControl id={name} isInvalid={!!error && showError} style={parentStyle}>
      <FormLabel
        color={labelcolor || mutedTextColor}
        mb={2}
        fontSize="xs"
        fontWeight="700"
        letterSpacing="0.08em"
        textTransform="uppercase"
      >
        {label} {required && <span style={{ color: "red" }}>*</span>}
      </FormLabel>
      {renderInputComponent()}
      {showError && error && (
        <FormErrorMessage mt={2} fontSize="xs" fontWeight="600">
          {error}
        </FormErrorMessage>
      )}
    </FormControl>
  );
};

export default CustomInput;
