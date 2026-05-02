import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { JobStatus } from "@workspace/api-client-react";

export interface HistoryJob extends JobStatus {
  timestamp: number;
}

const HISTORY_KEY = "build_history";

export function useHistory() {
  const [history, setHistory] = useState<HistoryJob[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      if (data) setHistory(JSON.parse(data));
    } catch (e) {}
  };

  const addJob = async (job: JobStatus) => {
    try {
      const newJob = { ...job, timestamp: Date.now() };
      const currentData = await AsyncStorage.getItem(HISTORY_KEY);
      const currentHistory = currentData ? JSON.parse(currentData) : [];
      // Remove if exists
      const filtered = currentHistory.filter((j: HistoryJob) => j.jobId !== job.jobId);
      const newHistory = [newJob, ...filtered];
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (e) {}
  };

  const updateJob = async (job: JobStatus) => {
    try {
      const currentData = await AsyncStorage.getItem(HISTORY_KEY);
      if (!currentData) return;
      const currentHistory = JSON.parse(currentData);
      const newHistory = currentHistory.map((j: HistoryJob) => {
        if (j.jobId === job.jobId) {
          return { ...j, ...job };
        }
        return j;
      });
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (e) {}
  };

  return { history, addJob, updateJob, loadHistory };
}
