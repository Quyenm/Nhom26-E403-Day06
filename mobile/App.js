import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { CHAT_ENDPOINT } from '@env';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const LOGO_URI = 'https://placehold.co/220x72/ffffff/0f5ea8/png?text=VINMEC';
const BANNER_URI =
  'https://placehold.co/1200x640/f8dbe6/0f5ea8/png?text=VINMEC+Mother+%26+Baby';

const QUICK_REPLIES = [
  { id: 'appointment', label: 'Đặt lịch khám', tone: 'primary' },
  { id: 'results', label: 'Tra cứu kết quả', tone: 'neutral' },
  { id: 'consulting', label: 'Tư vấn sức khỏe', tone: 'neutral' },
];

const INITIAL_MESSAGES = [
  {
    id: 'welcome-message',
    role: 'assistant',
    text: 'Xin chào! Tôi là trợ lý ảo Vinmec.\nTôi có thể giúp gì cho bạn hôm nay?',
    time: '14:02',
  },
];

function formatTime(date = new Date()) {
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function markdownToPlainText(content = '') {
  return content
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, '').trim())
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '- ')
    .replace(/^\s*\d+\.\s+/gm, '- ')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function GlobeIcon() {
  return (
    <View style={styles.roundIcon}>
      <View style={styles.globeCircle}>
        <View style={styles.globeVertical} />
        <View style={styles.globeHorizontal} />
      </View>
    </View>
  );
}

function MenuIcon() {
  return (
    <View style={styles.roundIcon}>
      <View style={styles.menuIcon}>
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
      </View>
    </View>
  );
}

function PlusButton() {
  return (
    <View style={styles.plusButton}>
      <View style={styles.plusHorizontal} />
      <View style={styles.plusVertical} />
    </View>
  );
}

function ShieldIcon() {
  return (
    <View style={styles.shieldIcon}>
      <View style={styles.shieldBody}>
        <View style={styles.shieldCenter} />
      </View>
    </View>
  );
}

function ChatFabIcon() {
  return (
    <View style={styles.fabIcon}>
      <View style={styles.fabBubble}>
        <View style={styles.fabBubbleTail} />
      </View>
    </View>
  );
}

function MessageBubble({ role, text, time, screenWidth }) {
  const isUser = role === 'user';
  const displayText = isUser ? text : markdownToPlainText(text);

  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          { maxWidth: screenWidth * (isUser ? 0.72 : 0.82) },
        ]}
      >
        {!isUser ? <View style={styles.assistantAccent} /> : null}
        <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.assistantMessageText]}>
          {displayText}
        </Text>
      </View>
      <Text style={[styles.messageTime, isUser ? styles.userTime : styles.assistantTime]}>{time}</Text>
    </View>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const bannerHeight = Math.min(Math.max(width * 0.38, 150), 220);
  const scrollViewRef = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages, loading]);

  const resetConversation = () => {
    setMessage('');
    setReply('');
    setError('');
    setLoading(false);
    setMessages(INITIAL_MESSAGES);
  };

  const toggleChat = () => {
    setIsChatOpen((currentValue) => !currentValue);
  };

  const handleSendMessage = async (overrideText) => {
    const trimmedMessage = (overrideText ?? message).trim();

    if (!trimmedMessage || loading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmedMessage,
      time: formatTime(),
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setMessage('');

    try {
      setLoading(true);
      setError('');

      const response = await axios.post(CHAT_ENDPOINT, {
        message: trimmedMessage,
      });

      const nextReply = markdownToPlainText(
        response.data?.reply || 'Khong co du lieu reply tu server.'
      );

      setReply(nextReply);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: nextReply,
          time: formatTime(),
        },
      ]);
    } catch (apiError) {
      setReply('');
      setError('Khong gui duoc tin nhan. Vui long thu lai.');
      console.error('Chat API error:', apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={styles.screen}>
          <View style={styles.header}>
            <Image
              source={{ uri: LOGO_URI }}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.headerActions}>
              <GlobeIcon />

              <TouchableOpacity style={styles.bookingButton} activeOpacity={0.85}>
                <Text style={styles.bookingButtonText}>Đặt lịch hẹn</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85}>
                <MenuIcon />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.banner, { minHeight: bannerHeight }]}>
            <Image
              source={{ uri: BANNER_URI }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerGlow} />

            <View style={styles.bannerCopy}>
              <Text style={styles.bannerTitle}>QUYỀN</Text>
              <Text style={styles.bannerTitle}>BẢO VỆ SỨC KHỎE</Text>
              <Text style={styles.bannerTitle}>TOÀN DIỆN</Text>
              <Text style={styles.bannerSubtitle}>Ưu tiên thăm khám - Tối ưu chi phí</Text>
            </View>

            <TouchableOpacity style={styles.bannerBadge} activeOpacity={0.88}>
              <Image
                source={{ uri: LOGO_URI }}
                style={styles.bannerBadgeLogo}
                resizeMode="contain"
              />
              <View style={styles.bannerBadgeCopy}>
                <Text style={styles.bannerBadgeText}>Ở cữ An nhiên</Text>
                <Text style={styles.bannerBadgeSubtext}>Mẹ khỏe, bé ngoan</Text>
              </View>
              <Text style={styles.bannerBadgeArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {isChatOpen ? (
            <View style={styles.chatCard}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>⌁</Text>
                  </View>
                  <View style={styles.onlineDot} />
                </View>

                <View style={styles.chatHeaderCopy}>
                  <Text style={styles.chatTitle}>Hỗ trợ khách hàng</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.chatStatus}>ĐANG HOẠT ĐỘNG</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity onPress={toggleChat} activeOpacity={0.75}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }}
            >
              {messages.map((chatMessage, index) => (
                <View key={chatMessage.id}>
                  <MessageBubble
                    role={chatMessage.role}
                    text={chatMessage.text}
                    time={chatMessage.time}
                    screenWidth={width}
                  />

                  {index === 0 ? (
                    <View style={styles.quickReplyWrap}>
                      {QUICK_REPLIES.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={0.85}
                          style={[
                            styles.quickReplyButton,
                            item.tone === 'primary'
                              ? styles.quickReplyPrimary
                              : styles.quickReplyNeutral,
                          ]}
                          onPress={() => handleSendMessage(item.label)}
                          disabled={loading}
                        >
                          <Text
                            style={[
                              styles.quickReplyText,
                              item.tone === 'primary'
                                ? styles.quickReplyPrimaryText
                                : styles.quickReplyNeutralText,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}

              {loading ? (
                <View style={styles.loadingRow}>
                  <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                    <View style={styles.assistantAccent} />
                    <Text style={[styles.messageText, styles.assistantMessageText]}>Vinmec đang phản hồi...</Text>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.inputWrap}>
              <View style={styles.inputRow}>
                <TouchableOpacity activeOpacity={0.8}>
                  <PlusButton />
                </TouchableOpacity>

                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Nhập tin nhắn..."
                  placeholderTextColor="#9ca8ba"
                  style={styles.input}
                  editable={!loading}
                  returnKeyType="send"
                  onSubmitEditing={() => handleSendMessage()}
                />

                <TouchableOpacity
                  onPress={() => handleSendMessage()}
                  activeOpacity={0.88}
                  style={[
                    styles.sendButton,
                    !message.trim() || loading ? styles.sendButtonDisabled : null,
                  ]}
                  disabled={!message.trim() || loading}
                >
                  <Text style={styles.sendButtonText}>➤</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
            </View>
          ) : (
            <View style={styles.chatClosedSpacer} />
          )}

          <View style={styles.footer}>
            <ShieldIcon />

            <View style={styles.footerCopy}>
              <Text style={styles.footerTitle}>Chất lượng quốc tế</Text>
              <Text style={styles.footerText}>
                Hệ thống Y tế Vinmec được quản lý và vận hành theo tiêu chuẩn dịch vụ
                an toàn, đồng bộ và thân thiện cho khách hàng.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.fabButton, isChatOpen ? null : styles.fabButtonCollapsed]}
            activeOpacity={0.88}
            onPress={toggleChat}
          >
            <ChatFabIcon />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef4fb',
  },
  keyboardWrapper: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#eef4fb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  logo: {
    width: 108,
    height: 34,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  roundIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  globeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#5f7186',
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeVertical: {
    position: 'absolute',
    width: 1.5,
    height: 18,
    backgroundColor: '#5f7186',
  },
  globeHorizontal: {
    position: 'absolute',
    width: 18,
    height: 1.5,
    backgroundColor: '#5f7186',
  },
  menuIcon: {
    width: 18,
    justifyContent: 'space-between',
    height: 14,
  },
  menuLine: {
    height: 2,
    borderRadius: 999,
    backgroundColor: '#334155',
  },
  bookingButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#0d87d8',
    minWidth: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  banner: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#f8dfe8',
    marginBottom: -28,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 245, 248, 0.64)',
  },
  bannerGlow: {
    position: 'absolute',
    right: -30,
    top: 10,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  bannerCopy: {
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 60,
    maxWidth: '74%',
  },
  bannerTitle: {
    color: '#1066a8',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  bannerSubtitle: {
    marginTop: 8,
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
  },
  bannerBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '56%',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  bannerBadgeLogo: {
    width: 38,
    height: 18,
    marginRight: 8,
  },
  bannerBadgeCopy: {
    flex: 1,
  },
  bannerBadgeText: {
    color: '#b03072',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerBadgeSubtext: {
    color: '#667085',
    fontSize: 10,
    marginTop: 2,
  },
  bannerBadgeArrow: {
    color: '#1066a8',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  chatCard: {
    flex: 1,
    marginHorizontal: 2,
    paddingTop: 22,
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    shadowColor: '#8aa1c4',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 8,
  },
  chatClosedSpacer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e7eef6',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e7f3ff',
  },
  avatarText: {
    color: '#1066a8',
    fontSize: 18,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 999,
    backgroundColor: '#18a46c',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatHeaderCopy: {
    flexShrink: 1,
  },
  chatTitle: {
    color: '#183b68',
    fontSize: 16,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    marginRight: 6,
    backgroundColor: '#18a46c',
  },
  chatStatus: {
    color: '#14855c',
    fontSize: 12,
    fontWeight: '800',
  },
  closeButton: {
    color: '#b6c1d0',
    fontSize: 30,
    lineHeight: 30,
    paddingHorizontal: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 18,
    paddingBottom: 18,
  },
  messageRow: {
    marginBottom: 14,
  },
  assistantRow: {
    alignItems: 'flex-start',
  },
  userRow: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    position: 'relative',
    borderRadius: 22,
    overflow: 'hidden',
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#edf2f7',
    paddingLeft: 18,
    paddingRight: 16,
    paddingVertical: 16,
  },
  assistantAccent: {
    position: 'absolute',
    top: 12,
    bottom: 12,
    left: 0,
    width: 4,
    borderRadius: 999,
    backgroundColor: '#0d87d8',
  },
  userBubble: {
    backgroundColor: '#035f9b',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopRightRadius: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  assistantMessageText: {
    color: '#324b63',
    fontWeight: '500',
  },
  userMessageText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  messageTime: {
    marginTop: 6,
    fontSize: 12,
    color: '#a0aec0',
  },
  assistantTime: {
    marginLeft: 6,
  },
  userTime: {
    marginRight: 6,
  },
  quickReplyWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
    marginBottom: 12,
  },
  quickReplyButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  quickReplyPrimary: {
    backgroundColor: '#7df1c2',
  },
  quickReplyNeutral: {
    backgroundColor: '#edf1f6',
  },
  quickReplyText: {
    fontSize: 14,
    fontWeight: '700',
  },
  quickReplyPrimaryText: {
    color: '#11684a',
  },
  quickReplyNeutralText: {
    color: '#4f6072',
  },
  loadingRow: {
    alignItems: 'flex-start',
    paddingTop: 6,
  },
  loadingBubble: {
    maxWidth: '70%',
  },
  inputWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#edf2f7',
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f8fd',
  },
  plusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#b9c6d8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  plusHorizontal: {
    width: 12,
    height: 1.8,
    borderRadius: 999,
    backgroundColor: '#8fa0b6',
    position: 'absolute',
  },
  plusVertical: {
    width: 1.8,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#8fa0b6',
    position: 'absolute',
  },
  input: {
    flex: 1,
    minHeight: 42,
    marginHorizontal: 12,
    color: '#23384f',
    fontSize: 16,
    paddingVertical: 0,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d87d8',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ec7e6',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 2,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 6,
    paddingRight: 76,
  },
  shieldIcon: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
    marginRight: 8,
  },
  shieldBody: {
    width: 22,
    height: 26,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 2,
    borderColor: '#0d87d8',
    transform: [{ rotate: '0deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldCenter: {
    width: 6,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#0d87d8',
  },
  footerCopy: {
    flex: 1,
  },
  footerTitle: {
    color: '#0e5ea8',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  footerText: {
    color: '#5e7085',
    fontSize: 13,
    lineHeight: 18,
  },
  fabButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d87d8',
    shadowColor: '#0d87d8',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 8,
  },
  fabButtonCollapsed: {
    bottom: 24,
  },
  fabIcon: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBubble: {
    width: 24,
    height: 18,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  fabBubbleTail: {
    position: 'absolute',
    left: 5,
    bottom: -5,
    width: 8,
    height: 8,
    backgroundColor: '#0d87d8',
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
  },
});
