import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  disabled,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.inputShell}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Type your message..."
          placeholderTextColor="#94a3b8"
          multiline
          textAlignVertical="top"
          style={styles.input}
        />
      </View>

      <Pressable
        onPress={onSend}
        disabled={disabled}
        style={({ pressed }) => [
          styles.sendButton,
          disabled ? styles.sendButtonDisabled : null,
          pressed && !disabled ? styles.sendButtonPressed : null,
        ]}
      >
        <Text style={styles.sendText}>{'>'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },
  inputShell: {
    flex: 1,
    marginRight: 12,
  },
  input: {
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#0f172a',
    fontSize: 16,
    lineHeight: 22,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#138f83',
    shadowColor: '#138f83',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#99d7cd',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  sendText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
});
