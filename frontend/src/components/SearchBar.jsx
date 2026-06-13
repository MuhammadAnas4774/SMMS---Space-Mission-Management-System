import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useEffect, useState } from "react";

/** PRD §7.3 — debounced search */
export default function SearchBar({ placeholder = "Search…", onDebouncedChange, initialValue = "" }) {
  const [value, setValue] = useState(initialValue);
  const debounced = useDebouncedValue(value, 350);

  useEffect(() => {
    onDebouncedChange(debounced);
  }, [debounced, onDebouncedChange]);

  return (
    <input
      className="search-bar"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      aria-label="Search"
    />
  );
}
