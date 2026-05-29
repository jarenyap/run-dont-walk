import {useState} from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router }  from 'expo-router';
import { RunType, NewRun } from '../../types/index';
import { logRun } from '../../services/runService';
import { useAuth } from '../../context/Auth';

const WORKOUT_TYPES: { label: string; value: RunType }[] = [
    { label: 'Easy', value: 'easy' },
    { label: 'Tempo', value: 'tempo' },
    { label: 'Long', value: 'long' },
    { label: 'Race', value: 'race' },
];

export default function LogRun() {
    const [title, setTitle] = useState('');
    const [distance, setDistance] = useState('');
    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const [seconds, setSeconds] = useState('');
    const [selectedType, setSelectedType] = useState<RunType>('easy');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const isValid = 
        title.trim() !== '' && 
        distance.trim() !== '' && 
        !isNaN(Number(distance)) && 
        Number(distance) > 0;

    const handleSubmit = async () => {
        if (!isValid) {
            Alert.alert('Invalid Input', 'Please enter a valid distance in kilometers.');
            return;
        }
        setLoading(true);
        try {
            const newRun: NewRun = {
                userId: user!.uid,
                title: title.trim(),
                distance: Number(distance),
                duration: `${hours || '0'}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`,
                type: selectedType,
                notes: notes.trim(),
            };
            await logRun(newRun);
            router.back();
        } catch (e) {
            Alert.alert('Error', 'Could not save run. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* Title */}
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Morning Run"
                    placeholderTextColor='#999'
                    returnKeyType="next"
                />

                {/* Distance */}
                <Text style={styles.label}>Distance (km)</Text>
                <View style={styles.distanceRow}>
                    <TextInput
                        style={[styles.input, styles.distanceInput]}
                        value={distance}
                        onChangeText={(text) => {
                            // only allow numbers and 2 decimal plces
                            const sanitised = text.match(/^\d*\.?\d{0,2}/)?.[0] ?? '';
                            setDistance(sanitised);
                        }}
                        placeholder="e.g. 5.67"
                        placeholderTextColor="#999"
                        keyboardType="decimal-pad"
                        returnKeyType="next"
                    />
                    <Text style={styles.kmLabel}>km</Text>
                </View>
                
                {/* Duration */}
                <Text style={styles.label}>Duration</Text>
                <View style={styles.durationRow}>
                    <TextInput
                        style={[styles.input, styles.durationInput]}
                        value={hours}
                        onChangeText={setHours}
                        placeholder="Hours"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        maxLength={2}
                    />
                    <Text style={styles.durationSeparator}>:</Text>
                    <TextInput
                        style={[styles.input, styles.durationInput]}
                        value={minutes}
                        onChangeText={setMinutes}
                        placeholder="Mins"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        maxLength={2}
                    />
                    <Text style={styles.durationSeparator}>:</Text>
                    <TextInput
                        style={[styles.input, styles.durationInput]}
                        value={seconds}
                        onChangeText={setSeconds}
                        placeholder="Secs"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        maxLength={2}
                    />
                </View>

                {/* Run Type */}
                <Text style={styles.label}>Run Type</Text>
                <View style={styles.typeRow}>
                    {WORKOUT_TYPES.map((type) => (
                        <Pressable
                            key={type.value}
                            style={[
                                styles.typeChip,
                                selectedType === type.value && styles.typeChipSelected
                            ]}
                            onPress={() => setSelectedType(type.value)}
                        >
                            <Text style={[
                                styles.typeChipText,
                                selectedType === type.value && styles.typeChipTextSelected
                            ]}>
                                {type.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Notes */}
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Text here ..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />

                {/* Save Button */}
                <Pressable
                    style={[
                        styles.button,
                        (!isValid || loading) && styles.buttonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={!isValid || loading}
                >
                    {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.buttonText}>Save Run</Text>
                    }
                </Pressable>
                
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    content: {
        padding: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: '#000000',
        marginBottom: 8,
        marginTop: 24,
    },
    input: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        padding:12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#2C2C2C',
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
    },
    distanceInput: {
        flex: 1,
    },
    kmLabel: {
        fontSize: 18,
        color: '#000000',
    },
    durationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    durationInput: {
        flex: 1,
        textAlign: 'center',
    },
    durationSeparator: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
    },
    typeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typeChip: {
        marginTop: 5,
        marginBottom: 5,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        backgroundColor: '#2C2C2C50',
    },
    typeChipSelected: {
        borderColor: '#f9f9f9',
        backgroundColor: '#FF8538',
        borderWidth: 1.5,
    },
    typeChipText: {
        fontSize: 18,
        fontStyle: 'italic',
        fontWeight: '500',
        color: '#000000',
    },
    typeChipTextSelected: {
        color: '#000000',
    },
    notesInput: {
        height: 120,
    },
    button: {
        marginTop: 32,
        padding: 14,
        backgroundColor: '#FF8538',
        borderRadius: 20,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#2C2C2C50',
    },
    buttonText: {
        color: '#f9f9f9',
        fontSize: 18,
        fontWeight: '600',
    },
});