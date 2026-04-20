import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

export default function App() {
  const [text, setText] = React.useState('');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TrainerOS Mobile</Text>
      <Text style={styles.subtitle}>Simple Test Version</Text>
      
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Test input"
        placeholderTextColor="#999"
      />
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => alert('Button works!')}
      >
        <Text style={styles.buttonText}>Test Button</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
