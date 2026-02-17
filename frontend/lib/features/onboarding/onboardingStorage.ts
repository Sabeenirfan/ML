import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = 'mealvista:onboardingComplete';

/** Onboarding order: dietaryPreference -> bmiCalculator -> healthGoal (then done). */
export const ONBOARDING_ROUTES = [
  '/onboarding/dietaryPreference',
  '/onboarding/bmiCalculator',
  '/onboarding/healthGoal',
] as const;

export type OnboardingRoute = (typeof ONBOARDING_ROUTES)[number];

/** Infer next onboarding step from profile so user can resume where they left off. */
export function getNextOnboardingRoute(profile: {
  user?: {
    dietaryPreferences?: string[];
    height?: number;
    weight?: number;
    bmi?: number;
    healthGoal?: string;
  };
}): OnboardingRoute | null {
  const u = profile?.user;
  if (!u) return ONBOARDING_ROUTES[0];
  if (u.healthGoal) return null; // completed
  if (u.height != null || u.weight != null || u.bmi != null) return '/onboarding/healthGoal';
  if (u.dietaryPreferences && u.dietaryPreferences.length > 0) return '/onboarding/bmiCalculator';
  return '/onboarding/dietaryPreference';
}

export const getOnboardingStatus = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch (error) {
    console.warn('Failed to read onboarding status from storage', error);
    return false;
  }
};

export const setOnboardingComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  } catch (error) {
    console.warn('Failed to store onboarding status', error);
  }
};

export const clearOnboardingStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  } catch (error) {
    console.warn('Failed to clear onboarding status', error);
  }
};
