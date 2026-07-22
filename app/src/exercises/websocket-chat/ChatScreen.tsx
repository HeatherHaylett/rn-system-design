/**
 * STARTER FILE — UI shell is complete, WebSocket logic is yours to build.
 *
 * The UI renders correctly given the right state. Your job is to:
 *   1. Connect the WebSocket on mount
 *   2. Append incoming messages to the list
 *   3. Send messages optimistically
 *   4. Implement exponential backoff reconnection
 *   5. Re-fetch missed messages on foreground
 *
 * Work through the TODOs in order — each one builds on the previous.
 * See README.md for full acceptance criteria and edge cases.
 */

import { AppState } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { createMockWebSocket, fetchMissedMessages } from './mockWebSocket'
import { ConnectionStatus, Message } from './types'

const CURRENT_USER_ID = 'me'
const BASE_RECONNECT_DELAY = 1000
const MAX_RECONNECT_DELAY = 30_000

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('reconnecting')

  const wsRef = useRef<ReturnType<typeof createMockWebSocket> | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastConnectedAtRef = useRef<string>(new Date().toISOString())

  function openWS() {
    setConnectionStatus("connected");
    reconnectTimerRef.current = null;
    reconnectAttemptRef.current = 0;
    lastConnectedAtRef.current = new Date().toISOString();
  }

  function appendNewMessage(message: Message) {
    setMessages(curr => [...curr, message])
  }

  function retry() {
    // Attempt max of 3 retries
    if (reconnectAttemptRef.current === 3) {
      setConnectionStatus("offline");
      return;
    };
    // Don't attempt to reconnect if current retry
    if (reconnectTimerRef.current) return;
    reconnectAttemptRef.current++;
    const delay = Math.min(BASE_RECONNECT_DELAY * 2 ** reconnectAttemptRef.current, MAX_RECONNECT_DELAY)
    console.log(`[ws] reconnect attempt ${reconnectAttemptRef.current} — delay ${delay}ms`)
    reconnectTimerRef.current = setTimeout(() => {
      connectWS();
    }, delay);
  }

  function closeWS(wasClean: boolean) {
    if (!wasClean) {
      setConnectionStatus("reconnecting");
      retry();
    }
  }

  function connectWS() {
    wsRef.current = createMockWebSocket({
      onOpen: () => openWS(),
      onMessage: (m) => appendNewMessage(m),
      onClose: (wasClean) => closeWS(wasClean)
    });
  }

  useEffect(() => {
    connectWS();
    return () => wsRef.current?.close();
  }, [])

  function updateStatus(message: Message) {
    if (wsRef.current?.send(message.content)) {
      const updatedStatus: Message = { ...message, status: "sent" }
      setMessages((prevState) =>
        prevState.map((m) => {
          if (m.id === message.id) {
            return updatedStatus;
          } else {
            return m;
          }
        })
      )
    } else {
      const updatedStatus: Message = { ...message, status: "failed" }
      setMessages((prevState) =>
        prevState.map((m) => {
          if (m.id === message.id) {
            return updatedStatus;
          } else {
            return m;
          }
        })
      )
    }
  }

  function handleSend() {
    if (!inputText.trim()) return

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: CURRENT_USER_ID,
      content: inputText.trim(),
      sentAt: new Date().toISOString(),
      status: 'sending',
      isOptimistic: true,
    }
    setMessages(curr => [...curr, message])
    updateStatus(message)
    // TODO 4: Optimistic send

    // 4. If send returns false (disconnected): update message status to 'failed'
    //    and queue it to retry when reconnected

    setInputText('')
  }

  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true })
    }
  }, [messages.length])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Connection status banner */}
      {connectionStatus !== 'connected' && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>
            {connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => {
          const isMe = item.senderId === CURRENT_USER_ID
          return (
            <View style={[styles.bubble, isMe && styles.bubbleMe]}>
              <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                {item.content}
              </Text>
              {item.status === 'sending' && (
                <Text style={styles.statusHint}>sending...</Text>
              )}
              {item.status === 'failed' && (
                <Text style={styles.errorHint}>failed to send</Text>
              )}
            </View>
          )
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message..."
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignSelf: 'stretch', paddingTop: 20 },
  statusBanner: { backgroundColor: '#f59e0b', padding: 8, alignItems: 'center' },
  statusText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  messageList: { padding: 16, gap: 8, paddingBottom: 24 },
  bubble: {
    maxWidth: '75%', padding: 12, borderRadius: 16,
    backgroundColor: '#f3f4f6', alignSelf: 'flex-start',
  },
  bubbleMe: { backgroundColor: '#2563eb', alignSelf: 'flex-end' },
  bubbleText: { fontSize: 15, color: '#111827' },
  bubbleTextMe: { color: '#fff' },
  statusHint: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  errorHint: { fontSize: 11, color: '#fca5a5', marginTop: 2 },
  inputRow: {
    flexDirection: 'row', padding: 12, gap: 8,
    borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingBottom: 50
  },
  input: {
    flex: 1, backgroundColor: '#f3f4f6',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#2563eb', borderRadius: 20,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#9ca3af' },
  sendButtonText: { color: '#fff', fontWeight: '600' },
})
