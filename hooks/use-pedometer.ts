import { useState, useEffect, useRef } from 'react';
import { Pedometer } from 'expo-sensors';

interface PedometerState {
  steps: number;
  isAvailable: boolean;
  isLoading: boolean;
}

export function usePedometer(): PedometerState {
  const [steps, setSteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const baseStepsRef = useRef(0);

  useEffect(() => {
    let subscription: ReturnType<typeof Pedometer.watchStepCount> | undefined;

    async function init() {
      try {
        const available = await Pedometer.isAvailableAsync();
        setIsAvailable(available);

        if (!available) {
          setIsLoading(false);
          return;
        }

        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

        try {
          const result = await Pedometer.getStepCountAsync(midnight, now);
          baseStepsRef.current = result.steps;
          setSteps(result.steps);
        } catch {}

        subscription = Pedometer.watchStepCount((result) => {
          setSteps(baseStepsRef.current + result.steps);
        });
      } finally {
        setIsLoading(false);
      }
    }

    init();
    return () => subscription?.remove();
  }, []);

  return { steps, isAvailable, isLoading };
}
