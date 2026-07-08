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

  // TODO 1: Connect WebSocket on mount
  //
  // Call createMockWebSocket with:
  //   onOpen: set status to 'connected', reset reconnect attempt counter
  //   onMessage: append message to list
  //   onClose(wasClean): if not clean, set status to 'reconnecting' and start backoff
  //
  // Store the result in wsRef.current
  // On unmount: call wsRef.current?.close()

  // TODO 2: Exponential backoff reconnection
  //
  // function scheduleReconnect() {
  //   const delay = Math.min(BASE_RECONNECT_DELAY * 2 ** reconnectAttemptRef.current, MAX_RECONNECT_DELAY)
  //   reconnectAttemptRef.current++
  //   reconnectTimerRef.current = setTimeout(() => {
  //     // reconnect: close old ws, create new one
  //   }, delay)
  // }
  //
  // Call scheduleReconnect() in the onClose handler when wasClean is false
  // Clear the timer on unmount

  // TODO 3: Re-validate on foreground
  //
  // Listen to AppState changes. When the app becomes 'active':
  //   - Re-establish WebSocket if disconnected
  //   - Call fetchMissedMessages(lastConnectedAtRef.current)
  //   - Merge the results into the messages list in chronological order
  //   - Update lastConnectedAtRef.current to now

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

    // TODO 4: Optimistic send
    //
    // 1. Add message to list with status: 'sending'
    // 2. Try wsRef.current?.send(message.content)
    // 3. If send returns true: update message status to 'sent'
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
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
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
  container: { flex: 1, backgroundColor: '#fff' },
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
    borderTopWidth: 1, borderTopColor: '#e5e7eb',
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
