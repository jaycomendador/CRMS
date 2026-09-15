import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io } from "socket.io-client/dist/socket.io.js";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 0;
import { useAuth } from "../context/AuthContext";
import { fetchMessages, sendMessage, markRead, Message } from "../api/messages";
import { API_BASE } from "../config";
import { playNotificationSound } from "../utils/sound";

const PURPLE = "#6C47FF";
const DARK_BG = "#0d0f1c";
const CARD_BG = "#161929";
const ADMIN_BUBBLE = "#1e2a45";
const FACULTY_BUBBLE = PURPLE;
const AI_BUBBLE = "#12312a";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function MessageBubble({ msg, myId }: { msg: Message; myId: string }) {
  const isMe = msg.sender === "faculty";
  const isAI = msg.sender === "ai";

  const bubbleStyle = isMe
    ? styles.bubbleMe
    : isAI
    ? styles.bubbleAI
    : styles.bubbleAdmin;

  const textColor = isMe || isAI ? "#fff" : "#ddeeff";

  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      {!isMe && (
        <View style={[styles.avatar, isAI && styles.avatarAI]}>
          <Text style={styles.avatarText}>{isAI ? "🤖" : "👤"}</Text>
        </View>
      )}
      <View style={styles.bubbleCol}>
        {!isMe && (
          <Text style={styles.senderLabel}>
            {isAI ? "CRMS AI" : msg.senderName || "Admin"}
          </Text>
        )}
        <View style={[styles.bubble, bubbleStyle]}>
          <Text style={[styles.bubbleText, { color: textColor }]}>{msg.text}</Text>
        </View>
        <Text style={[styles.timeText, isMe && styles.timeTextMe]}>
          {formatTime(msg.createdAt)}
          {msg.emailDispatched && "  📧 emailed"}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const flatRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    if (!user) return;
    const dept = user.department || "General";
    try {
      const msgs = await fetchMessages(dept);
      setMessages(msgs);
      await markRead(dept);
      if (loading) {
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
    } catch {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();

    if (!user) return;
    const socket = io(API_BASE, { transports: ["websocket", "polling"] });

    if (user.department) {
      socket.emit("join_department", user.department);
    }
    if (user.id) {
      socket.emit("join_faculty", user.id);
    }

    socket.on("new_message", (newMsg: Message) => {
      // Check if message belongs to user's department or facultyId
      const userDept = (user.department || "General").toLowerCase().trim();
      const msgDept = (newMsg.department || "").toLowerCase().trim();

      if (msgDept === userDept || newMsg.facultyId === user.id) {
        if (newMsg.sender !== "faculty") {
          playNotificationSound();
        }
        load();
      }
    });

    const interval = setInterval(load, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [load, user]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    const text = input.trim();
    const dept = user.department || "General";
    setInput("");
    setSending(true);
    setError("");
    try {
      const msg = await sendMessage(user.id, dept, text, user.name, user.email);
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      setError(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const showDate =
      index === 0 ||
      formatDate(item.createdAt) !== formatDate(messages[index - 1].createdAt);
    return (
      <>
        {showDate && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <MessageBubble msg={item} myId={user?.id || ""} />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      {/* Full screen container */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Top Navbar (floating card) ── */}
        <View style={styles.navbarWrapper}>
          <View style={styles.topBar}>
            {/* Left: dot + title + dept */}
            <View style={styles.topBarLeft}>
              <View style={styles.onlineIndicator} />
              <View>
                <Text style={styles.topBarTitle}>CRMS Chat</Text>
                <Text style={styles.topBarSub}>
                  {user?.department || "Campus Administration"}
                </Text>
              </View>
            </View>

            {/* Right: user name + sign out */}
            <View style={styles.topBarRight}>
              <Text style={styles.topBarUserName} numberOfLines={1}>
                {user?.name}
              </Text>
              <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── User Chip ── */}
        <View style={styles.userChip}>
          <Text style={styles.userChipText}>
            Logged in as{" "}
            <Text style={styles.userChipName}>{user?.name}</Text>
          </Text>
        </View>

        {/* ── Messages area (fills all remaining space) ── */}
        <View style={styles.messagesContainer}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={PURPLE} size="large" />
              <Text style={styles.loadingText}>Loading messages…</Text>
            </View>
          ) : (
            <Animated.View style={[styles.flex1, { opacity: fadeAnim }]}>
              <FlatList
                ref={flatRef}
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>💬</Text>
                    <Text style={styles.emptyTitle}>No messages yet</Text>
                    <Text style={styles.emptySub}>
                      Send a message below to start a conversation with campus administration.
                    </Text>
                  </View>
                }
              />
            </Animated.View>
          )}
        </View>

        {/* ── Error bar ── */}
        {error ? (
          <View style={styles.errorBar}>
            <Text style={styles.errorBarText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* ── Input bar ── */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message to admin…"
            placeholderTextColor="#556"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendBtnText}>▶</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Root containers ──
  safeArea: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex1: {
    flex: 1,
  },

  // ── Navbar wrapper (adds Android status bar gap + side margins) ──
  navbarWrapper: {
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingHorizontal: 14,
    paddingBottom: 8,
    backgroundColor: DARK_BG,
  },

  // ── Top bar card ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ffffff12",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  topBarRight: {
    alignItems: "flex-end",
    gap: 6,
    marginLeft: 10,
  },
  topBarUserName: {
    color: "#c4b5fd",
    fontSize: 11,
    fontWeight: "600",
    maxWidth: 110,
  },
  onlineIndicator: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#00e676",
    marginRight: 4,
  },
  topBarTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  topBarSub: {
    color: "#8899aa",
    fontSize: 10,
    marginTop: 1,
  },
  logoutBtn: {
    backgroundColor: "#ff4d6d22",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ff4d6d44",
  },
  logoutText: {
    color: "#ff4d6d",
    fontSize: 11,
    fontWeight: "600",
  },

  // ── User chip ──
  userChip: {
    backgroundColor: PURPLE + "22",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: PURPLE + "44",
    alignSelf: "center",
    width: "90%",
  },
  userChipText: {
    color: "#aab4cc",
    fontSize: 12,
    textAlign: "center",
  },
  userChipName: {
    color: "#c4b5fd",
    fontWeight: "700",
  },

  // ── Messages container (fills screen) ──
  messagesContainer: {
    flex: 1,
    backgroundColor: DARK_BG,
  },

  // ── Loading / empty ──
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#8899aa",
    fontSize: 14,
    marginTop: 8,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySub: {
    color: "#556677",
    textAlign: "center",
    lineHeight: 20,
    fontSize: 13,
  },

  // ── Message list ──
  messageList: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
    flexGrow: 1,
  },
  dateHeader: {
    alignItems: "center",
    marginVertical: 12,
  },
  dateHeaderText: {
    backgroundColor: "#ffffff12",
    color: "#8899aa",
    fontSize: 11,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: "hidden",
  },
  bubbleRow: {
    flexDirection: "row",
    marginVertical: 5,
    alignItems: "flex-end",
  },
  bubbleRowMe: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1e2a45",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  avatarAI: {
    backgroundColor: "#12312a",
  },
  avatarText: {
    fontSize: 16,
  },
  bubbleCol: {
    maxWidth: "75%",
  },
  senderLabel: {
    color: "#8899aa",
    fontSize: 10,
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: FACULTY_BUBBLE,
    borderBottomRightRadius: 4,
  },
  bubbleAdmin: {
    backgroundColor: ADMIN_BUBBLE,
    borderBottomLeftRadius: 4,
  },
  bubbleAI: {
    backgroundColor: AI_BUBBLE,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#00e67633",
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  timeText: {
    color: "#55667788",
    fontSize: 10,
    marginTop: 3,
    marginLeft: 4,
  },
  timeTextMe: {
    textAlign: "right",
    marginRight: 4,
  },

  // ── Error bar ──
  errorBar: {
    backgroundColor: "#ff4d6d22",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ff4d6d44",
  },
  errorBarText: {
    color: "#ff4d6d",
    fontSize: 13,
  },

  // ── Input bar ──
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderTopColor: "#ffffff10",
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#1e2235",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffffff18",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: PURPLE,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PURPLE,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
