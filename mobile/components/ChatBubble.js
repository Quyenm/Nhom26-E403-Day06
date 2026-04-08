import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

function TypingDot({ delay = 0 }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 280,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [delay, opacity]);

  return <Animated.View style={[styles.typingDot, { opacity }]} />;
}

export default function ChatBubble({
  role,
  text,
  intro,
  question,
  footer,
  chips,
  onChipPress,
  isTyping = false,
}) {
  const isUser = role === 'user';
  const userMonogram = (text || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        styles.wrapper,
        isUser ? styles.userWrapper : styles.botWrapper,
      ]}
    >
      {!isUser ? <View style={styles.botAvatar}><Text style={styles.botAvatarText}>+</Text></View> : null}

      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        {isTyping ? (
          <View style={styles.typingContainer}>
            <TypingDot delay={0} />
            <TypingDot delay={180} />
            <TypingDot delay={360} />
          </View>
        ) : null}

        {!isTyping && isUser ? (
          <Text style={[styles.text, styles.userText]}>{text && text.length <= 2 ? userMonogram.toLowerCase() : text}</Text>
        ) : null}

        {!isTyping && !isUser ? (
          <View>
            {intro ? <Text style={[styles.text, styles.botText]}>{intro}</Text> : null}
            {question ? <Text style={styles.questionText}>{question}</Text> : null}
            {footer ? <Text style={styles.footerText}>{footer}</Text> : null}
            {!intro && !question && !footer && text ? (
              <Text style={[styles.text, styles.botText]}>{text}</Text>
            ) : null}

            {chips?.length ? (
              <View style={styles.chipRow}>
                {chips.map((chip) => (
                  <Pressable
                    key={chip}
                    onPress={() => onChipPress?.(chip)}
                    style={({ pressed }) => [
                      styles.chip,
                      pressed ? styles.chipPressed : null,
                    ]}
                  >
                    <Text style={styles.chipText}>{chip}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  botWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    borderRadius: 22,
  },
  userBubble: {
    maxWidth: '72%',
    minWidth: 58,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#138f83',
    borderTopRightRadius: 12,
    shadowColor: '#138f83',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },
  botBubble: {
    flex: 1,
    maxWidth: '88%',
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
  },
  userText: {
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
  botText: {
    color: '#334155',
  },
  questionText: {
    color: '#1e293b',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '700',
    marginTop: 10,
  },
  footerText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 56,
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 6,
    backgroundColor: '#94a3b8',
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    marginRight: 10,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#138f83',
    shadowColor: '#138f83',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },
  botAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d6dee9',
    backgroundColor: '#ffffff',
    marginRight: 8,
    marginBottom: 8,
  },
  chipPressed: {
    backgroundColor: '#f0fdfa',
    borderColor: '#138f83',
  },
  chipText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
});
