import { useEffect, useState } from "react";

/** Follows the OS setting, so the editor and the page switch together. */
export function useColorScheme(): "light" | "dark" {
  const [query] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)"),
  );
  const [dark, setDark] = useState(query.matches);
  useEffect(() => {
    const onChange = () => setDark(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [query]);
  return dark ? "dark" : "light";
}
