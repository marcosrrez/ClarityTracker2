import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  Surface,
  Text,
  Chip,
  Portal,
  Modal,
} from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import Voice from '@react-native-voice/voice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../theme/theme';
import {useAuth} from '../contexts/AuthContext';

interface SessionEntry {
  date: Date;
  hours: number;
  type: string;
  notes: string;
  clientInitials?: string;
  supervisorName?: string;
}

const AddEntryScreen: React.FC = () => {
  const {user} = useAuth();
  const [entry, setEntry] = useState<SessionEntry>({
    date: new Date(),
    hours: 0,
    type: 'individual',
    notes: '',
    clientInitials: '',
    supervisorName: '',
  });
  
  const [isListening, setIsListening] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickHours] = useState([0.5, 1, 1.5, 2, 2.5, 3]);

  useEffect(() => {
    setupVoiceRecognition();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const setupVoiceRecognition = () => {
    Voice.onSpeechStart = () => {
      console.log('Speech started');
      Vibration.vibrate(50);
    };
    
    Voice.onSpeechEnd = () => {
      console.log('Speech ended');
      setIsListening(false);
    };
    
    Voice.onSpeechResults = (event) => {
      if (event.value && event.value[0]) {
        const transcription = event.value[0];
        setEntry(prev => ({
          ...prev,
          notes: prev.notes + (prev.notes ? ' ' : '') + transcription
        }));
      }
    };
    
    Voice.onSpeechError = (error) => {
      console.error('Speech error:', error);
      setIsListening(false);
      Alert.alert('Voice Error', 'Unable to recognize speech. Please try again.');
    };
  };

  const startVoiceRecognition = async () => {
    try {
      setIsListening(true);
      await Voice.start('en-US');
    } catch (error) {
      console.error('Voice start error:', error);
      setIsListening(false);
      Alert.alert('Voice Error', 'Unable to start voice recognition.');
    }
  };

  const stopVoiceRecognition = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Voice stop error:', error);
    }
  };

  const handleQuickHours = (hours: number) => {
    setEntry(prev => ({...prev, hours}));
    Vibration.vibrate(30); // Haptic feedback
  };

  const handleSubmit = async () => {
    if (entry.hours <= 0) {
      Alert.alert('Validation Error', 'Please enter valid hours.');
      return;
    }

    if (!entry.notes.trim()) {
      Alert.alert('Validation Error', 'Please add session notes.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${process.env.API_URL}/api/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          ...entry,
          userId: user?.uid,
          createdAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Success!', 
          `${entry.hours} hours logged successfully.`,
          [
            {
              text: 'Add Another',
              onPress: () => resetForm(),
            },
            {
              text: 'View Dashboard',
              onPress: () => {/* Navigate to Dashboard */},
            },
          ]
        );
        resetForm();
      } else {
        throw new Error('Failed to save entry');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEntry({
      date: new Date(),
      hours: 0,
      type: 'individual',
      notes: '',
      clientInitials: '',
      supervisorName: '',
    });
  };

  const sessionTypes = [
    {label: 'Individual Therapy', value: 'individual'},
    {label: 'Group Therapy', value: 'group'},
    {label: 'Family Therapy', value: 'family'},
    {label: 'Supervision', value: 'supervision'},
    {label: 'Assessment', value: 'assessment'},
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Quick Entry Header */}
        <Surface style={styles.headerCard}>
          <Title style={styles.headerTitle}>Log Session Hours</Title>
          <Text style={styles.headerSubtitle}>
            Quick entry for your supervision hours
          </Text>
        </Surface>

        {/* Date Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.fieldLabel}>Session Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}>
              <Icon name="calendar-today" size={20} color={theme.colors.primary} />
              <Text style={styles.dateText}>
                {entry.date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Quick Hours Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.fieldLabel}>Hours</Text>
            <View style={styles.quickHoursContainer}>
              {quickHours.map((hours) => (
                <Chip
                  key={hours}
                  selected={entry.hours === hours}
                  onPress={() => handleQuickHours(hours)}
                  style={[
                    styles.hourChip,
                    entry.hours === hours && styles.selectedChip
                  ]}>
                  {hours}h
                </Chip>
              ))}
            </View>
            <TextInput
              mode="outlined"
              label="Custom Hours"
              value={entry.hours > 0 ? entry.hours.toString() : ''}
              onChangeText={(text) => {
                const hours = parseFloat(text) || 0;
                setEntry(prev => ({...prev, hours}));
              }}
              keyboardType="numeric"
              style={styles.customHoursInput}
            />
          </Card.Content>
        </Card>

        {/* Session Type */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.fieldLabel}>Session Type</Text>
            <View style={styles.typeChipsContainer}>
              {sessionTypes.map((type) => (
                <Chip
                  key={type.value}
                  selected={entry.type === type.value}
                  onPress={() => setEntry(prev => ({...prev, type: type.value}))}
                  style={[
                    styles.typeChip,
                    entry.type === type.value && styles.selectedChip
                  ]}>
                  {type.label}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Session Notes with Voice */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.notesHeader}>
              <Text style={styles.fieldLabel}>Session Notes</Text>
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  isListening && styles.voiceButtonActive
                ]}
                onPress={isListening ? stopVoiceRecognition : startVoiceRecognition}>
                <Icon 
                  name={isListening ? "mic" : "mic-none"} 
                  size={20} 
                  color={isListening ? "#FFFFFF" : theme.colors.primary} 
                />
              </TouchableOpacity>
            </View>
            
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={6}
              value={entry.notes}
              onChangeText={(text) => setEntry(prev => ({...prev, notes: text}))}
              placeholder="Describe the session... (Tap mic for voice input)"
              style={styles.notesInput}
            />
            
            {isListening && (
              <View style={styles.listeningIndicator}>
                <Icon name="graphic-eq" size={16} color={theme.colors.primary} />
                <Text style={styles.listeningText}>Listening...</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Additional Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.fieldLabel}>Additional Details</Text>
            <TextInput
              mode="outlined"
              label="Client Initials (Optional)"
              value={entry.clientInitials}
              onChangeText={(text) => setEntry(prev => ({...prev, clientInitials: text}))}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Supervisor Name"
              value={entry.supervisorName}
              onChangeText={(text) => setEntry(prev => ({...prev, supervisorName: text}))}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || entry.hours <= 0}
          style={styles.submitButton}>
          {isSubmitting ? 'Saving...' : 'Log Session Hours'}
        </Button>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Date Picker Modal */}
      <Portal>
        <Modal 
          visible={showDatePicker} 
          onDismiss={() => setShowDatePicker(false)}
          contentContainerStyle={styles.modalContainer}>
          <Surface style={styles.datePickerContainer}>
            <Title style={styles.modalTitle}>Select Date</Title>
            <DatePicker
              date={entry.date}
              onDateChange={(date) => setEntry(prev => ({...prev, date}))}
              mode="date"
              maximumDate={new Date()}
            />
            <View style={styles.modalButtons}>
              <Button onPress={() => setShowDatePicker(false)}>
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={() => setShowDatePicker(false)}>
                Confirm
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.colors.text,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.text,
  },
  quickHoursContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  hourChip: {
    margin: 4,
  },
  selectedChip: {
    backgroundColor: theme.colors.primary,
  },
  customHoursInput: {
    marginTop: 8,
  },
  typeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeChip: {
    margin: 4,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  voiceButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  notesInput: {
    minHeight: 120,
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
  },
  listeningText: {
    marginLeft: 8,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  input: {
    marginBottom: 12,
  },
  submitButton: {
    margin: 16,
    padding: 8,
    borderRadius: 12,
  },
  bottomSpacing: {
    height: 60,
  },
  modalContainer: {
    margin: 20,
  },
  datePickerContainer: {
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});

export default AddEntryScreen;