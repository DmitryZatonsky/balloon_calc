import { useCallback, useMemo, useState } from "react";
import type { SavedCalculation } from "../types";
import { writeToStorage } from "../utils";

const CALCULATIONS_KEY = "balloon_calc_calculations";

export function useArchive() {
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);

  const sortedArchive = useMemo(
    () =>
      [...savedCalculations].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [savedCalculations],
  );

  const replaceArchive = useCallback((data: SavedCalculation[]): void => {
    setSavedCalculations(data);
  }, []);

  const saveRecord = useCallback((record: SavedCalculation): void => {
    setSavedCalculations((prev) => {
      const next = [record, ...prev];
      writeToStorage(CALCULATIONS_KEY, next);
      return next;
    });
  }, []);

  const deleteRecord = useCallback((id: string): void => {
    setSavedCalculations((prev) => {
      const next = prev.filter((item) => item.id !== id);
      writeToStorage(CALCULATIONS_KEY, next);
      return next;
    });

    setExpandedArchiveId((prev) => (prev === id ? null : prev));
  }, []);

  return {
    savedCalculations,
    sortedArchive,
    expandedArchiveId,
    setExpandedArchiveId,
    replaceArchive,
    saveRecord,
    deleteRecord,
  };
}
