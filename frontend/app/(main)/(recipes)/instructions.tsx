import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from 'expo-speech';
import { MealVista } from "../../../constants/theme";

type CheckedSteps = {
  [key: number]: boolean;
};

const CookingInstructionsScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealTitle = params.mealTitle as string || "Recipe";
  const mealImage = params.mealImage as string || "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800";
  const [checkedSteps, setCheckedSteps] = useState<CheckedSteps>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStepComplete, setIsStepComplete] = useState(false);
  const [allStepsComplete, setAllStepsComplete] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Parse instructions from params (API may send string[] or { id, text }[])
  let instructionsData: any[] = [];
  try {
    const raw = params.instructions ? JSON.parse(params.instructions as string) : [];
    instructionsData = Array.isArray(raw) ? raw : [];
  } catch (e) {
    console.error('Error parsing instructions:', e);
  }

  // Normalize to { id, text } so both string arrays and object arrays work
  const normalizedInstructions = instructionsData.map((item: any, index: number) => {
    if (item && typeof item === 'object' && (item.text != null || item.step != null)) {
      return { id: item.id ?? index + 1, text: item.text ?? item.step ?? '', time: item.time, note: item.note, details: item.details };
    }
    const text = typeof item === 'string' ? item : (item && (item.text ?? item.step)) || String(item ?? '');
    return { id: index + 1, text };
  }).filter((s: { text: string }) => (s.text || '').trim().length > 0);

  // Use instructions from API or fallback
  const instructions = normalizedInstructions.length > 0 ? normalizedInstructions : [
    {
      id: 1,
      text: "Prepare all ingredients as listed",
      time: "5 minutes",
    },
    {
      id: 2,
      text: "Follow the cooking method for this dish",
    },
    {
      id: 3,
      text: "Season to taste and serve hot",
    },
  ];

  useEffect(() => {
    return () => {
      // Stop speech when component unmounts
      Speech.stop();
    };
  }, []);

  const readInstruction = async (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= instructions.length) return;
    
    const instruction = instructions[stepIndex];
    let textToRead = `Step ${instruction.id}. ${instruction.text}`;
    
    if (instruction.time) {
      textToRead += `. Time needed: ${instruction.time}`;
    }
    
    if (instruction.note) {
      textToRead += `. Note: ${instruction.note}`;
    }
    
    if (instruction.details) {
      textToRead += `. Details: ${instruction.details.join('. ')}`;
    }
    
    setIsReading(true);
    setIsPaused(false);
    setIsStepComplete(false);
    setCurrentStep(stepIndex);
    
    await Speech.speak(textToRead, {
      language: 'en',
      pitch: 1.0,
      rate: 0.85,
      onDone: () => {
        // Current instruction finished reading
        setIsReading(false);
        setIsPaused(false);
        setIsStepComplete(true);
        
        // Check if all steps are complete
        if (stepIndex === instructions.length - 1) {
          setAllStepsComplete(true);
        }
      },
      onStopped: () => {
        // Manually paused - keep state for resume
        setIsPaused(true);
        setIsReading(false);
      },
      onError: () => {
        setIsReading(false);
        setIsPaused(false);
      }
    });
  };

  const handleReadInstructions = () => {
    if (isReading) {
      // Currently reading - pause it
      Speech.stop();
      setIsPaused(true);
      setIsReading(false);
    } else if (isPaused) {
      // Was paused - resume from current step
      readInstruction(currentStep);
    } else {
      // Start fresh from current step
      readInstruction(currentStep);
    }
  };

  const handlePause = () => {
    if (isReading) {
      console.log("Pausing at step:", currentStep + 1);
      Speech.stop();
      setIsPaused(true);
      setIsReading(false);
    }
  };

  const handleContinue = () => {
    console.log("Continuing from step:", currentStep + 1);
    if (isPaused) {
      readInstruction(currentStep);
    }
  };

  const handleNextInstruction = () => {
    if (currentStep < instructions.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      setIsStepComplete(false);
      setIsPaused(false);
      
      // Stop current reading if any
      if (isReading) {
        Speech.stop();
      }
      
      // Start reading the next instruction
      readInstruction(newStep);
    }
  };

  const handleStop = () => {
    Speech.stop();
    setIsReading(false);
    setIsPaused(false);
    setIsStepComplete(false);
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      setIsStepComplete(false);
      setAllStepsComplete(false);
      setIsPaused(false);
      
      // Stop current reading if any
      if (isReading) {
        Speech.stop();
      }
      
      // Start reading the previous instruction
      readInstruction(newStep);
    }
  };

  const toggleStep = (stepId: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const handleBack = () => {
    Speech.stop();
    setIsReading(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cooking Instructions</Text>
          <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/home')}>
            <Ionicons name="home" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.recipeCard}>
          <Image
            source={{
              uri: mealImage,
            }}
            style={styles.recipeImage}
          />
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeTitle}>{mealTitle}</Text>
            <Text style={styles.recipeSteps}>
              {isReading 
                ? `Reading Step ${currentStep + 1} of ${instructions.length}` 
                : isPaused 
                ? `Paused at Step ${currentStep + 1} of ${instructions.length}`
                : allStepsComplete
                ? "All Steps Complete!"
                : `${instructions.length} Steps`
              }
            </Text>
          </View>
        </View>
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {instructions.map((instruction, index) => (
            <View key={instruction.id} style={[
              styles.stepContainer,
              isReading && index === currentStep && styles.activeStep
            ]}>
              <TouchableOpacity
                style={[
                  styles.stepNumber,
                  isReading && index === currentStep && styles.activeStepNumber
                ]}
                onPress={() => toggleStep(instruction.id)}
              >
                {checkedSteps[instruction.id] ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text style={styles.stepNumberText}>{instruction.id}</Text>
                )}
              </TouchableOpacity>
              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepText,
                    checkedSteps[instruction.id] && styles.stepTextChecked,
                  ]}
                >
                  {instruction.text}
                </Text>
                {instruction.time && (
                  <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={14} color="#8B7BA8" />
                    <Text style={styles.timeText}>{instruction.time}</Text>
                  </View>
                )}
                {instruction.note && (
                  <Text style={styles.noteText}>{instruction.note}</Text>
                )}
                {instruction.details &&
                  instruction.details.map((detail: string, idx: number) => (
                    <Text key={idx} style={styles.detailText}>
                      • {detail}
                    </Text>
                  ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      
      {/* Bottom Control Buttons */}
      <View style={styles.bottomButtons}>
        {allStepsComplete ? (
          // All steps finished
          <View style={styles.completionContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.completionText}>✔ You finished all steps!</Text>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => router.back()}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : isStepComplete ? (
          // Current step finished, show next instruction prompt
          <>
            <TouchableOpacity 
              style={[
                styles.previousInstructionButton,
                currentStep === 0 && styles.buttonDisabled
              ]}
              onPress={handlePreviousStep}
              disabled={currentStep === 0}
            >
              <Ionicons 
                name="arrow-back" 
                size={20} 
                color={currentStep === 0 ? "#CCC" : "#fff"} 
              />
              <Text style={[
                styles.previousInstructionText,
                currentStep === 0 && styles.buttonTextDisabled
              ]}>Previous</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.nextInstructionButton}
              onPress={handleNextInstruction}
              disabled={currentStep === instructions.length - 1}
            >
              <Text style={styles.nextInstructionText}>Next Instruction</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          // Normal reading controls
          <>
            {!isReading && !isPaused && (
              <TouchableOpacity 
                style={styles.readButton} 
                onPress={handleReadInstructions}
              >
                <Ionicons name="volume-medium" size={20} color="#fff" />
                <Text style={styles.readButtonText}>Read Instruction</Text>
              </TouchableOpacity>
            )}
            
            {isReading && (
              <TouchableOpacity 
                style={styles.pauseButton} 
                onPress={handlePause}
              >
                <Ionicons name="pause" size={20} color="#fff" />
                <Text style={styles.pauseButtonText}>Pause</Text>
              </TouchableOpacity>
            )}
            
            {isPaused && (
              <TouchableOpacity 
                style={styles.continueButton} 
                onPress={handleContinue}
              >
                <Ionicons name="play" size={20} color="#fff" />
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            )}
            
            {(isReading || isPaused) && (
              <>
                <TouchableOpacity 
                  style={[
                    styles.previousButton,
                    currentStep === 0 && styles.buttonDisabled
                  ]}
                  onPress={handlePreviousStep}
                  disabled={currentStep === 0}
                >
                  <Ionicons 
                    name="arrow-back" 
                    size={20} 
                    color={currentStep === 0 ? "#CCC" : "#fff"} 
                  />
                  <Text style={[
                    styles.previousButtonText,
                    currentStep === 0 && styles.buttonTextDisabled
                  ]}>Prev</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.nextButton,
                    currentStep === instructions.length - 1 && styles.buttonDisabled
                  ]}
                  onPress={handleNextInstruction}
                  disabled={currentStep === instructions.length - 1}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Ionicons 
                    name="arrow-forward" 
                    size={20} 
                    color={currentStep === instructions.length - 1 ? "#CCC" : "#fff"} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.stopButton}
                  onPress={handleStop}
                >
                  <Ionicons name="stop" size={20} color="#DC2626" />
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#5A3D7A" },
  scrollView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 8,
    justifyContent: 'space-between',
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 18, color: "#fff", fontWeight: "500", flex: 1, textAlign: 'center' },
  homeButton: { marginLeft: 12 },
  recipeCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeImage: { width: "100%", height: 180 },
  recipeInfo: { padding: 16, alignItems: "center" },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C1A3F",
    marginBottom: 4,
  },
  recipeSteps: { fontSize: 14, color: "#8B7BA8" },
  instructionsSection: {
    backgroundColor: "#F5F3F7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C1A3F",
    marginBottom: 16,
  },
  stepContainer: { flexDirection: "row", marginBottom: 20 },
  activeStep: {
    backgroundColor: "#E8E0F0",
    padding: 12,
    borderRadius: 12,
    marginHorizontal: -12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#5A3D7A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  activeStepNumber: {
    backgroundColor: MealVista.primary,
    transform: [{ scale: 1.1 }],
  },
  stepNumberText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  stepContent: { flex: 1 },
  stepText: { fontSize: 15, color: "#2C1A3F", lineHeight: 22, marginBottom: 8 },
  stepTextChecked: { textDecorationLine: "line-through", color: "#8B7BA8" },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  timeText: { fontSize: 13, color: "#8B7BA8", marginLeft: 6 },
  noteText: {
    fontSize: 13,
    color: "#8B7BA8",
    fontStyle: "italic",
    lineHeight: 18,
  },
  detailText: { fontSize: 14, color: "#6B5B7F", lineHeight: 20, marginTop: 4 },
  bottomButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
    minHeight: 80,
  },
  completionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  completionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10B981",
    marginTop: 12,
    marginBottom: 16,
  },
  doneButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  readButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5A3D7A",
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    minWidth: 150,
  },
  pauseButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F59E0B",
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    minWidth: 120,
  },
  pauseButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  continueButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    minWidth: 120,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  nextInstructionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5A3D7A",
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  nextInstructionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  previousInstructionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6B7280",
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  previousInstructionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  readButtonActive: {
    backgroundColor: "#DC2626",
  },
  readButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  backButtonBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F3F7",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 6,
  },
  backButtonText: { color: "#5A3D7A", fontSize: 14, fontWeight: "600" },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5A3D7A",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 6,
  },
  nextButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  previousButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6B7280",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 6,
  },
  previousButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  stopButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 25,
  },
  micButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  micButtonActive: {
    backgroundColor: "#5A3D7A",
  },
  micButtonDisabled: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#DDD",
    opacity: 0.6,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonTextDisabled: {
    color: "#CCC",
  },
});

export default CookingInstructionsScreen;
