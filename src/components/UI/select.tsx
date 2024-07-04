import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";
import { Option } from "../../types/Option";

interface MultiSelectProps {
  options: Option[];
  isMultiple?: boolean;
  onChange: (selected: Option | Option[]) => void;
  portal?: boolean;
  renderOption?: (option: Option, isSelected: boolean) => React.ReactNode;
  searchable?: boolean;
  zIndex?: number;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  isMultiple = true,
  onChange,
  portal = false,
  renderOption,
  searchable = true,
  zIndex = 50,
}) => {
  const [isOpen, setIsOpen] = useState(false); // State to track if the dropdown is open
  const [searchTerm, setSearchTerm] = useState(""); // State to track the search input
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]); // State to track selected options
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null); // State to track the highlighted option index
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the dropdown container
  const dropdownMenuRef = useRef<HTMLDivElement>(null); // Ref for the dropdown menu

  // Function to handle the selection and deselection of options
  const handleOptionClick = (option: Option) => {
    if (isMultiple) {
      const isSelected = selectedOptions.some(
        (selected) => selected.value === option.value
      );
      const newSelectedOptions = isSelected
        ? selectedOptions.filter((selected) => selected.value !== option.value)
        : [...selectedOptions, option];
      setSelectedOptions(newSelectedOptions);
      onChange(newSelectedOptions);
    } else {
      setSelectedOptions([option]);
      onChange(option);
      setIsOpen(false); // Close the dropdown if single select
    }
  };

  // Function to handle the removal of selected options
  const handleRemoveOption = (option: Option) => {
    const newSelectedOptions = selectedOptions.filter(
      (selected) => selected.value !== option.value
    );
    setSelectedOptions(newSelectedOptions);
    onChange(newSelectedOptions);
  };

  // Default function to render an option with search term highlighting
  const renderDefaultOption = (option: Option, isSelected: boolean) => {
    const matchStartIndex = option.label
      .toLowerCase()
      .indexOf(searchTerm.toLowerCase());
    const matchEndIndex = matchStartIndex + searchTerm.length;

    return (
      <div
        key={option.value}
        className={classNames("cursor-pointer px-4 py-2", {
          "bg-blue-500 text-white": isSelected,
          "bg-white text-black": !isSelected,
          "bg-yellow-100":
            // @ts-ignore
            highlightedIndex !== null && highlightedIndex === option.value,
        })}
        onClick={() => handleOptionClick(option)}
      >
        {matchStartIndex > -1 ? (
          <>
            {option.label.slice(0, matchStartIndex)}
            <span className="text-red-500">
              {option.label.slice(matchStartIndex, matchEndIndex)}
            </span>
            {option.label.slice(matchEndIndex)}
          </>
        ) : (
          option.label
        )}
      </div>
    );
  };

  // Function to handle changes in the search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Function to toggle the dropdown open or closed
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Function to close the dropdown when clicking outside of it
  const handleClickOutside = (e: MouseEvent) => {
    if (
      dropdownRef.current &&
      dropdownMenuRef.current &&
      !dropdownRef.current.contains(e.target as Node) &&
      !dropdownMenuRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  // Adding event listener for clicks outside the dropdown
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Ensuring the highlighted option is in view when navigating with keyboard
  useEffect(() => {
    if (highlightedIndex !== null && options.length > 0) {
      const optionElement = document.getElementById(
        `option-${highlightedIndex}`
      );
      if (optionElement) {
        optionElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, options]);

  // Function to handle keyboard navigation in the dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev === null || prev === options.length - 1 ? 0 : prev + 1
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev === null || prev === 0 ? options.length - 1 : prev - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex !== null) {
          handleOptionClick(options[highlightedIndex]);
        }
        break;
      default:
        break;
    }
  };

  // Dropdown menu element, rendered either directly or via a portal
  const dropdownMenu = (
    <div
      className={classNames(
        "absolute w-full bg-white border border-gray-300 rounded shadow-lg ml-4",
        { "z-50": zIndex === 50, "z-100": zIndex === 100 }
      )}
      style={{ zIndex, width: dropdownRef.current?.offsetWidth }} // Set the width dynamically
      ref={dropdownMenuRef}
    >
      {searchable && (
        <input
          type="text"
          className="w-full px-4 py-2 border-b border-gray-300"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
        />
      )}
      <div className="max-h-60 overflow-y-auto">
        {options.map((option, index) =>
          renderOption
            ? renderOption(
                option,
                selectedOptions.some(
                  (selected) => selected.value === option.value
                )
              )
            : renderDefaultOption(
                option,
                selectedOptions.some(
                  (selected) => selected.value === option.value
                )
              )
        )}
      </div>
    </div>
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="border border-gray-300 rounded px-4 py-2 cursor-pointer"
        onClick={handleToggle}
      >
        {selectedOptions.length === 0
          ? "Select..."
          : selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-block bg-gray-200 rounded-full px-2 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2 cursor-pointer"
                onClick={() => handleRemoveOption(opt)}
              >
                {opt.label}
              </span>
            ))}
      </div>
      {isOpen &&
        (portal
          ? ReactDOM.createPortal(dropdownMenu, document.body)
          : dropdownMenu)}
    </div>
  );
};

export default MultiSelect;
