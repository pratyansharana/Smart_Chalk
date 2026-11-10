import React, { useState, useRef } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    TextInput, 
    Pressable, 
    ScrollView, 
    KeyboardAvoidingView, 
    Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendAIChatMessage } from '../services/aichatService';
import type { MainTabScreenProps } from '../navigation/types';

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: string;
}

export default function AIChatScreen({ navigation }: MainTabScreenProps<'HomeTab'>) {
    const insets = useSafeAreaInsets();
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Gen Z thinking rotation states
    const [thinkingPhraseIndex, setThinkingPhraseIndex] = useState(0);
    const thinkingPhrases = [
        "cooking up some knowledge...",
        "letting him cook...",
        "maintaining absolute focus...",
        "consulting the brain cells...",
        "vibing through the algorithm..."
    ];

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'ai',
            text: "Yo! SmartChalk AI here. ⚡ What are we locked in on today? Drop a concept and let's get this bread.",
            timestamp: 'Just now'
        }
    ]);

    const handleSend = async () => {
        const trimmed = inputText.trim();
        if (!trimmed || isThinking) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: trimmed,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInputText('');
        setIsThinking(true);

        // Cycle funky gen z phrases while "thinking"
        const phraseInterval = setInterval(() => {
            setThinkingPhraseIndex((prev) => (prev + 1) % thinkingPhrases.length);
        }, 1200);

        try {
            // Convert existing message history format for the service
            const historyForService = messages.map(m => ({ sender: m.sender, text: m.text }));
            const aiResponseText = await sendAIChatMessage(trimmed, historyForService);

            clearInterval(phraseInterval);
            setIsThinking(false);

            setMessages([
                ...updatedMessages,
                {
                    id: (Date.now() + 1).toString(),
                    sender: 'ai',
                    text: aiResponseText,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } catch (error) {
            clearInterval(phraseInterval);
            setIsThinking(false);
            setMessages([
                ...updatedMessages,
                {
                    id: (Date.now() + 1).toString(),
                    sender: 'ai',
                    text: "My bad, connection dropped or something went wrong. Let's run it back! 🧠",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        }
    };

    return (
        <View style={styles.mainContainer}>
            <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 8) }]}>
                
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={18} color="#2563EB" />
                        <Text style={styles.backText}>Back</Text>
                    </Pressable>
                    <View style={styles.headerTitleGroup}>
                        <Text style={styles.title}>AI Study Companion</Text>
                        <Text style={styles.subtitle}>Always locked in ⚡</Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.chatContainer}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                >
                    {/* Message List */}
                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.scrollContent}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={false}
                    >
                        {messages.map((msg) => {
                            const isUser = msg.sender === 'user';
                            return (
                                <View
                                    key={msg.id}
                                    style={[styles.messageBubbleRow, isUser ? styles.rowUser : styles.rowAi]}
                                >
                                    {!isUser && (
                                        <View style={styles.aiAvatar}>
                                            <MaterialCommunityIcons name="creation" size={16} color="#FFFFFF" />
                                        </View>
                                    )}
                                    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
                                        <Text style={[styles.bubbleText, isUser ? styles.textUser : styles.textAi]}>
                                            {msg.text}
                                        </Text>
                                        <Text style={[styles.timestamp, isUser ? styles.timeUser : styles.timeAi]}>
                                            {msg.timestamp}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}

                        {/* Gen Z Thinking Indicator Bubble */}
                        {isThinking && (
                            <View style={[styles.messageBubbleRow, styles.rowAi]}>
                                <View style={styles.aiAvatar}>
                                    <MaterialCommunityIcons name="creation" size={16} color="#FFFFFF" />
                                </View>
                                <View style={[styles.bubble, styles.bubbleAi, styles.thinkingBubble]}>
                                    <View style={styles.thinkingRow}>
                                        <View style={styles.pulseDot} />
                                        <Text style={styles.thinkingText}>
                                            {thinkingPhrases[thinkingPhraseIndex]}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Chat Input Bar */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Ask anything... (no cap) ✍️"
                            placeholderTextColor="#94A3B8"
                            style={styles.textInput}
                            multiline
                        />
                        <Pressable
                            disabled={!inputText.trim() || isThinking}
                            onPress={handleSend}
                            style={[styles.sendButton, (!inputText.trim() || isThinking) && styles.sendButtonDisabled]}
                        >
                            <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        marginRight: 14,
    },
    backText: {
        color: '#2563EB',
        fontSize: 12,
        fontWeight: '700',
    },
    headerTitleGroup: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    chatContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 14,
    },
    messageBubbleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        maxWidth: '85%',
    },
    rowUser: {
        alignSelf: 'flex-end',
    },
    rowAi: {
        alignSelf: 'flex-start',
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    bubble: {
        padding: 14,
        borderRadius: 18,
        gap: 6,
    },
    bubbleUser: {
        backgroundColor: '#2563EB',
        borderBottomRightRadius: 4,
    },
    bubbleAi: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    thinkingBubble: {
        backgroundColor: '#F1F5F9',
        borderColor: '#CBD5E1',
    },
    thinkingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2563EB',
    },
    thinkingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
        fontStyle: 'italic',
    },
    bubbleText: {
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '500',
    },
    textUser: {
        color: '#FFFFFF',
    },
    textAi: {
        color: '#0F172A',
    },
    timestamp: {
        fontSize: 9,
        fontWeight: '600',
        alignSelf: 'flex-end',
    },
    timeUser: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    timeAi: {
        color: '#94A3B8',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 10,
    },
    textInput: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 13,
        color: '#0F172A',
        fontWeight: '500',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
});