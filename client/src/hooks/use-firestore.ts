import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import {
  getLogEntries,
  getAppSettings,
  getInsightCards,
  getMilestones,
} from "@/lib/firestore";
import type { LogEntry, AppSettings, InsightCard, Milestone } from "@shared/schema";

export const useLogEntries = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const fetchEntries = async () => {
      try {
        setLoading(true);
        const data = await getLogEntries(user.uid);
        setEntries(data);
        setError(null);
      } catch (err) {
        setError("Failed to load log entries");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user]);

  const refetch = async () => {
    if (!user) return;
    try {
      const data = await getLogEntries(user.uid);
      setEntries(data);
    } catch (err) {
      setError("Failed to refresh log entries");
      console.error(err);
    }
  };

  return { entries, loading, error, refetch };
};

export const useAppSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getAppSettings(user.uid);
        setSettings(data);
        setError(null);
      } catch (err) {
        setError("Failed to load settings");
        console.error("Error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const refetch = async () => {
    if (!user) return;
    try {
      const data = await getAppSettings(user.uid);
      setSettings(data);
    } catch (err) {
      setError("Failed to refresh settings");
      console.error(err);
    }
  };

  return { settings, loading, error, refetch };
};

export const useInsightCards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<InsightCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    const fetchCards = async () => {
      try {
        setLoading(true);
        const data = await getInsightCards(user.uid);
        setCards(data);
        setError(null);
      } catch (err) {
        setError("Failed to load insight cards");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [user]);

  const refetch = async () => {
    if (!user) return;
    try {
      const data = await getInsightCards(user.uid);
      setCards(data);
    } catch (err) {
      setError("Failed to refresh insight cards");
      console.error(err);
    }
  };

  return { cards, loading, error, refetch };
};

export const useMilestones = () => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMilestones([]);
      setLoading(false);
      return;
    }

    const fetchMilestones = async () => {
      try {
        setLoading(true);
        const data = await getMilestones(user.uid);
        setMilestones(data);
        setError(null);
      } catch (err) {
        setError("Failed to load milestones");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [user]);

  return { milestones, loading, error };
};
