import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { updateProfile, getProfile } from "../../lib/authService";

export default function BMICalculatorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isOnboarding = params.onboarding === 'true'; // Check if coming from signup flow
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState("Not calculated");
  const [color, setColor] = useState("#2b7fff");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");

  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const response = await getProfile();
        if (response.user?.height) {
          setHeight(response.user.height.toString());
        }
        if (response.user?.weight) {
          setWeight(response.user.weight.toString());
        }
        if (response.user?.bmi) {
          setBmi(response.user.bmi);
          setCategory(response.user.bmiCategory || "Not calculated");
          // Set color based on category
          if (response.user.bmiCategory) {
            const categoryColor = getBMICategoryColor(response.user.bmiCategory);
            setColor(categoryColor);
          }
        }
      } catch (error) {
        console.warn("Unable to load existing BMI data", error);
      }
    };

    if (!isOnboarding) {
      loadExistingData();
    }
  }, [isOnboarding]);

  const getBMICategoryColor = (cat: string) => {
    if (cat.includes("Underweight")) return "#3B82F6";
    if (cat.includes("Normal")) return "#10B981";
    if (cat.includes("Overweight")) return "#F59E0B";
    if (cat.includes("Obese")) return "#EF4444";
    return "#2b7fff";
  };

  const getBMICategory = (bmiValue: number) => {
    if (bmiValue < 18.5) {
      return { category: "Underweight", color: "#2b7fff" };
    } else if (bmiValue < 25) {
      return { category: "Normal", color: "#00c950" };
    } else if (bmiValue < 30) {
      return { category: "Overweight", color: "#ff6900" };
    } else {
      return { category: "Obese", color: "#fb2c36" };
    }
  };

  const validateNumericInput = (input: string): boolean => {
    // Check if input contains only numbers and optional decimal point
    return /^\d*\.?\d*$/.test(input);
  };

  const handleHeightChange = (text: string) => {
    if (text === "" || validateNumericInput(text)) {
      setHeight(text);
      // Clear BMI when input changes
      if (bmi !== null) {
        setBmi(null);
        setCategory("Not calculated");
        setColor("#2b7fff");
      }
    }
  };

  const handleWeightChange = (text: string) => {
    if (text === "" || validateNumericInput(text)) {
      setWeight(text);
      // Clear BMI when input changes
      if (bmi !== null) {
        setBmi(null);
        setCategory("Not calculated");
        setColor("#2b7fff");
      }
    }
  };

  const handleHeightFeetChange = (text: string) => {
    if (text === "" || validateNumericInput(text)) {
      setHeightFeet(text);
      // Clear BMI when input changes
      if (bmi !== null) {
        setBmi(null);
        setCategory("Not calculated");
        setColor("#2b7fff");
      }
    }
  };

  const handleHeightInchesChange = (text: string) => {
    if (text === "" || validateNumericInput(text)) {
      setHeightInches(text);
      // Clear BMI when input changes
      if (bmi !== null) {
        setBmi(null);
        setCategory("Not calculated");
        setColor("#2b7fff");
      }
    }
  };

  const convertToMetricHeight = (): number | null => {
    if (heightUnit === "cm") {
      const heightNum = parseFloat(height);
      if (isNaN(heightNum) || heightNum <= 0) return null;
      return heightNum;
    } else {
      // Convert feet and inches to cm
      const feet = parseFloat(heightFeet);
      const inches = parseFloat(heightInches);
      if (isNaN(feet) && isNaN(inches)) return null;
      const totalInches = (feet || 0) * 12 + (inches || 0);
      if (totalInches <= 0) return null;
      return totalInches * 2.54; // Convert inches to cm
    }
  };

  const convertToMetricWeight = (): number | null => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) return null;
    
    if (weightUnit === "kg") {
      return weightNum;
    } else {
      // Convert lbs to kg
      return weightNum * 0.453592;
    }
  };

  const handleCalculate = () => {
    // Check if inputs are empty
    if (heightUnit === "cm" && !height.trim()) {
      Alert.alert("Error", "Please enter your height");
      return;
    }

    if (heightUnit === "ft" && !heightFeet.trim() && !heightInches.trim()) {
      Alert.alert("Error", "Please enter your height");
      return;
    }

    if (!weight.trim()) {
      Alert.alert("Error", "Please enter your weight");
      return;
    }

    const heightInCm = convertToMetricHeight();
    const weightInKg = convertToMetricWeight();

    if (!heightInCm) {
      Alert.alert("Error", "Please enter valid height");
      return;
    }

    if (!weightInKg) {
      Alert.alert("Error", "Please enter valid weight");
      return;
    }

    // BMI = weight (kg) / (height (m))^2
    const heightInMeters = heightInCm / 100;
    const calculatedBmi = weightInKg / (heightInMeters * heightInMeters);

    const { category: bmiCategory, color: bmiColor } =
      getBMICategory(calculatedBmi);

    setBmi(calculatedBmi);
    setCategory(bmiCategory);
    setColor(bmiColor);
  };

  const handleSave = async () => {
    if (bmi === null) {
      Alert.alert("Error", "Please calculate your BMI first");
      return;
    }
    
    try {
      // Save BMI data to backend (always in metric)
      const heightInCm = convertToMetricHeight();
      const weightInKg = convertToMetricWeight();
      
      await updateProfile({
        height: heightInCm!,
        weight: weightInKg!,
        bmi: bmi,
        bmiCategory: category
      });
      console.log("BMI saved:", { height: heightInCm, weight: weightInKg, bmi, category });
      
      // If onboarding, go to next step (health goal), otherwise go back to profile
      if (isOnboarding) {
        router.push({ pathname: "/healthGoal", params: { onboarding: 'true' } } as any);
      } else {
        // Show success message and go back to profile
        Alert.alert(
          "Success",
          `BMI saved successfully! Your BMI is ${bmi.toFixed(1)} (${category})`,
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Error saving BMI:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save BMI. Please try again."
      );
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getIndicatorPosition = () => {
    if (bmi === null) return 65.61; // Default position

    const maxWidth = 272.38;
    const segmentWidth = maxWidth / 4;

    if (bmi < 18.5) {
      // Underweight: 0-68.095px
      return Math.min((bmi / 18.5) * segmentWidth, segmentWidth - 2);
    } else if (bmi < 25) {
      // Normal: 68.095-136.19px
      return 68.095 + ((bmi - 18.5) / 6.5) * segmentWidth;
    } else if (bmi < 30) {
      // Overweight: 136.19-204.28px
      return 136.19 + ((bmi - 25) / 5) * segmentWidth;
    } else {
      // Obese: 204.28-272.38px
      return Math.min(
        204.28 + ((bmi - 30) / 10) * segmentWidth,
        maxWidth - 2
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2253" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BMI Calculator</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Input Card */}
        <View style={styles.inputCard}>
          {/* Icon and Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="body-outline" size={20} color="#3C2253" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle}>Calculate Your BMI</Text>
              <Text style={styles.cardSubtitle}>
                Enter your height and weight below
              </Text>
            </View>
          </View>

          {/* Input Fields */}
          <View style={styles.inputsContainer}>
            {/* Height Unit Toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height</Text>
              <View style={styles.unitToggleContainer}>
                <TouchableOpacity
                  style={[styles.unitToggle, heightUnit === "cm" && styles.unitToggleActive]}
                  onPress={() => setHeightUnit("cm")}
                >
                  <Text style={[styles.unitToggleText, heightUnit === "cm" && styles.unitToggleTextActive]}>
                    CM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitToggle, heightUnit === "ft" && styles.unitToggleActive]}
                  onPress={() => setHeightUnit("ft")}
                >
                  <Text style={[styles.unitToggleText, heightUnit === "ft" && styles.unitToggleTextActive]}>
                    FT/IN
                  </Text>
                </TouchableOpacity>
              </View>

              {heightUnit === "cm" ? (
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="170"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    value={height}
                    onChangeText={handleHeightChange}
                  />
                  <Text style={styles.inputUnit}>cm</Text>
                </View>
              ) : (
                <View style={styles.feetInchesContainer}>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="5"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      value={heightFeet}
                      onChangeText={handleHeightFeetChange}
                    />
                    <Text style={styles.inputUnit}>ft</Text>
                  </View>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="7"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      value={heightInches}
                      onChangeText={handleHeightInchesChange}
                    />
                    <Text style={styles.inputUnit}>in</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Weight Unit Toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight</Text>
              <View style={styles.unitToggleContainer}>
                <TouchableOpacity
                  style={[styles.unitToggle, weightUnit === "kg" && styles.unitToggleActive]}
                  onPress={() => setWeightUnit("kg")}
                >
                  <Text style={[styles.unitToggleText, weightUnit === "kg" && styles.unitToggleTextActive]}>
                    KG
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitToggle, weightUnit === "lbs" && styles.unitToggleActive]}
                  onPress={() => setWeightUnit("lbs")}
                >
                  <Text style={[styles.unitToggleText, weightUnit === "lbs" && styles.unitToggleTextActive]}>
                    LBS
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={weightUnit === "kg" ? "65" : "143"}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={handleWeightChange}
                />
                <Text style={styles.inputUnit}>{weightUnit}</Text>
              </View>
            </View>
          </View>

          {/* Calculate Button */}
          <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
            <Text style={styles.calculateButtonText}>Calculate BMI</Text>
          </TouchableOpacity>
        </View>

        {/* Result Card */}
        {bmi !== null && (
          <View style={styles.resultCard}>
            {/* BMI Display */}
            <View style={styles.bmiDisplay}>
              <Text style={styles.bmiLabel}>Your BMI:</Text>
              <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
              <Text style={[styles.bmiCategory, { color }]}>{category}</Text>
            </View>

            {/* BMI Scale */}
            <View style={styles.scaleContainer}>
              <Text style={styles.scaleTitle}>BMI Ranges</Text>
              <View style={styles.scaleBar}>
                {/* Color segments */}
                <View style={[styles.scaleSegment, { backgroundColor: "#2b7fff", width: "25%" }]} />
                <View style={[styles.scaleSegment, { backgroundColor: "#00c950", width: "25%" }]} />
                <View style={[styles.scaleSegment, { backgroundColor: "#ff6900", width: "25%" }]} />
                <View style={[styles.scaleSegment, { backgroundColor: "#fb2c36", width: "25%" }]} />
                
                {/* Indicator */}
                <View
                  style={[
                    styles.indicator,
                    { left: `${(getIndicatorPosition() / 272.38) * 100}%` },
                  ]}
                />
              </View>

              {/* Labels */}
              <View style={styles.scaleLabels}>
                <View style={styles.scaleLabelItem}>
                  <Text style={styles.scaleLabelText}>Underweight</Text>
                  <Text style={styles.scaleLabelRange}>{"<18.5"}</Text>
                </View>
                <View style={styles.scaleLabelItem}>
                  <Text style={styles.scaleLabelText}>Normal</Text>
                  <Text style={styles.scaleLabelRange}>18.5-24.9</Text>
                </View>
                <View style={styles.scaleLabelItem}>
                  <Text style={styles.scaleLabelText}>Overweight</Text>
                  <Text style={styles.scaleLabelRange}>25-29.9</Text>
                </View>
                <View style={styles.scaleLabelItem}>
                  <Text style={styles.scaleLabelText}>Obese</Text>
                  <Text style={styles.scaleLabelRange}>≥30</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save/Continue Button */}
      {bmi !== null && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  header: {
    backgroundColor: "#3C2253",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    height: 116,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "400",
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 100,
    backgroundColor: "#F0EFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "#333333",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#4A5565",
    lineHeight: 20,
  },
  inputsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "400",
    color: "#333333",
  },
  inputWrapper: {
    backgroundColor: "#F5F5F7",
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    fontSize: 16,
    color: "#333333",
    flex: 1,
  },
  inputUnit: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
    marginLeft: 8,
  },
  unitToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F7",
    borderRadius: 14,
    padding: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  unitToggle: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  unitToggleActive: {
    backgroundColor: "#3C2253",
  },
  unitToggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A5565",
  },
  unitToggleTextActive: {
    color: "#FFFFFF",
  },
  feetInchesContainer: {
    flexDirection: "row",
    gap: 12,
  },
  calculateButton: {
    backgroundColor: "#3C2253",
    borderRadius: 100,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: "400",
    color: "#FFFFFF",
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  bmiDisplay: {
    alignItems: "center",
    marginBottom: 24,
  },
  bmiLabel: {
    fontSize: 14,
    color: "#4A5565",
    marginBottom: 4,
  },
  bmiValue: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  bmiCategory: {
    fontSize: 18,
    fontWeight: "400",
  },
  scaleContainer: {
    gap: 12,
  },
  scaleTitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#333333",
  },
  scaleBar: {
    height: 32,
    borderRadius: 100,
    flexDirection: "row",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#E5E7EB",
  },
  scaleSegment: {
    height: "100%",
  },
  indicator: {
    position: "absolute",
    top: 0,
    width: 4,
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "#1E2939",
    transform: [{ translateX: -2 }],
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scaleLabelItem: {
    flex: 1,
    alignItems: "center",
  },
  scaleLabelText: {
    fontSize: 12,
    color: "#4A5565",
    marginBottom: 2,
  },
  scaleLabelRange: {
    fontSize: 12,
    color: "#4A5565",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: "#F5F5F7",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  saveButton: {
    backgroundColor: "#3C2253",
    borderRadius: 100,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "400",
    color: "#FFFFFF",
  },
});

