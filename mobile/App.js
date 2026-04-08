import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ChatBubble from './components/ChatBubble';
import ChatInput from './components/ChatInput';

const DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'Neurology',
];

const INITIAL_MESSAGES = [
  {
    id: 'welcome-message',
    role: 'bot',
    intro: "Hello! I'm MediCare, your scheduling assistant. I'll help you book an appointment quickly.",
    question: "What's your full name?",
  },
];

const FOLLOW_UP_REPLIES = [
  'I can help you choose a doctor, time slot, or prepare the next step for booking.',
  'If you want, I can also summarize your request before we confirm the appointment.',
  'Everything looks good so far. Tell me more and I will keep the flow moving.',
];

export default function App() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [pendingReplies, setPendingReplies] = useState(0);
  const [profileName, setProfileName] = useState('');
  const scrollViewRef = useRef(null);
  const timeoutsRef = useRef([]);

  const isTyping = pendingReplies > 0;

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const queueBotReply = (buildReply) => {
    setPendingReplies((count) => count + 1);

    const timeoutId = setTimeout(() => {
      setMessages((currentMessages) => [...currentMessages, buildReply()]);
      setPendingReplies((count) => Math.max(0, count - 1));
      timeoutsRef.current = timeoutsRef.current.filter((id) => id !== timeoutId);
    }, 1000 + Math.floor(Math.random() * 900));

    timeoutsRef.current.push(timeoutId);
  };

  const createDepartmentReply = (name) => ({
    id: `bot-${Date.now()}`,
    role: 'bot',
    intro: `Nice to meet you, ${name}.`,
    question: 'Which department would you like to visit?',
    chips: DEPARTMENTS,
  });

  const createFollowUpReply = (selectedDepartment) => {
    const randomReply =
      FOLLOW_UP_REPLIES[Math.floor(Math.random() * FOLLOW_UP_REPLIES.length)];

    if (selectedDepartment) {
      return {
        id: `bot-${Date.now()}`,
        role: 'bot',
        intro: `Perfect. ${selectedDepartment} has been selected for your visit.`,
        question: 'Would you like me to continue with doctor suggestions or available time slots?',
        footer: randomReply,
      };
    }

    return {
      id: `bot-${Date.now()}`,
      role: 'bot',
      intro: `Thanks, ${profileName || 'there'}.`,
      question: randomReply,
    };
  };

  const handleSend = () => {
    const trimmedMessage = inputValue.trim();

    if (!trimmedMessage) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmedMessage,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);

    setInputValue('');

    if (!profileName) {
      setProfileName(trimmedMessage);
      queueBotReply(() => createDepartmentReply(trimmedMessage));
      return;
    }

    queueBotReply(() => createFollowUpReply());
  };

  const handleChipPress = (chip) => {
    const userMessage = {
      id: `user-chip-${Date.now()}`,
      role: 'user',
      text: chip,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    queueBotReply(() => createFollowUpReply(chip));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#138f83" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <View style={styles.headerBadge}>
              <View style={styles.headerCrossHorizontal} />
              <View style={styles.headerCrossVertical} />
            </View>

            <View>
              <Text style={styles.headerTitle}>MediCare Assistant</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.headerSubtitle}>Online - Ready to help you schedule</Text>
              </View>
            </View>
          </View>

          <View style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>R</Text>
          </View>
        </View>

        <View style={styles.chatShell}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
          >
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                role={message.role}
                text={message.text}
                intro={message.intro}
                question={message.question}
                footer={message.footer}
                chips={message.chips}
                onChipPress={handleChipPress}
              />
            ))}

            {isTyping ? <ChatBubble role="bot" isTyping /> : null}
          </ScrollView>

          <ChatInput
            value={inputValue}
            onChangeText={setInputValue}
            onSend={handleSend}
            disabled={!inputValue.trim()}
          />

          <Text style={styles.disclaimer}>
            This is a scheduling assistant - Not for emergencies
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#edf7f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#edf7f5',
  },
  heroGlowOne: {
    position: 'absolute',
    top: 88,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#d5f4eb',
    opacity: 0.75,
  },
  heroGlowTwo: {
    position: 'absolute',
    right: -70,
    bottom: 140,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#e8f7ee',
    opacity: 0.85,
  },
  header: {
    backgroundColor: '#138f83',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0c5f59',
    shadowOpacity: 0.26,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 10,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  headerBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    marginRight: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerCrossHorizontal: {
    width: 22,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    position: 'absolute',
  },
  headerCrossVertical: {
    width: 3,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    position: 'absolute',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: '#9cf9d7',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerSubtitle: {
    color: '#e6fffb',
    fontSize: 13,
    fontWeight: '500',
  },
  refreshButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  chatShell: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    paddingBottom: 20,
  },
  disclaimer: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 2,
  },
});
