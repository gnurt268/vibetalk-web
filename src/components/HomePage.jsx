import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { BiCommentDetail } from "react-icons/bi";
import { TbCircleDashed } from "react-icons/tb";
import { BsEmojiSmile, BsFilter, BsThreeDotsVertical } from "react-icons/bs";
import ChatCard from "./ChatCard/ChatCard";
import MessageCard from "./MessageCard/MessageCard";
import ChatInfoPanel from "./ChatInfo/ChatInfoPanel";
import { ImAttachment } from "react-icons/im";
import { IoSend, IoClose } from "react-icons/io5";
import EmojiPicker from "emoji-picker-react";
import cryptoService from "../services/CryptoService";
import api from "../config/api";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";
import Profile from "./Profile/Profile";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import CreateGroup from "./GroupChat/CreateGroup";
import StartNewChat from "./Chat/StartNewChat";
import { logout } from "../redux/Auth/Action";
import { useDispatch, useSelector } from "react-redux";
import {
  getUserChats,
  searchChats,
  setActiveChat,
  clearUnreadCount,
  deleteGroupChat,
  leaveGroup,
} from "../redux/Chat/Action";
import useWebSocket from "../hooks/useWebSocket";

import {
  getChatMessages,
  sendMessage,
  setMessageDraft,
  markChatAsRead,
  uploadAndSendFile,
  setReplyingTo,
  clearReplyingTo,
} from "../redux/Message/Action";

import {
  ADD_OPTIMISTIC_MESSAGE,
  MARK_MESSAGE_FAILED,
} from "../redux/Message/ActionType";

const HomePage = () => {
  const [querys, setQuerys] = useState("");
  const [content, setContent] = useState("");
  const [inputHeight, setInputHeight] = useState(100);
  const [isProfile, setIsProfile] = useState(false);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [isStartNewChat, setIsStartNewChat] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimer, setTypingTimer] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [chatSearchResults, setChatSearchResults] = useState([]);
  const [chatSearchIndex, setChatSearchIndex] = useState(-1);
  const [activeSearchHighlight, setActiveSearchHighlight] = useState({
    messageId: null,
    query: "",
  });
  const [isSearchingChat, setIsSearchingChat] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const inputContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const chatSearchRef = useRef(null);
  const chatMenuRef = useRef(null);

  const auth = useSelector((store) => store.auth);
  const chat = useSelector((store) => store.chat);
  const message = useSelector((store) => store.message);

  const currentUser = auth?.user;
  const currentChat = chat?.activeChat;
  const chats = Array.isArray(chat?.chats) ? chat.chats : [];
  const searchResults = Array.isArray(chat?.searchResults)
    ? chat.searchResults
    : [];
  const messagesRaw = useSelector((store) =>
    currentChat?.id
      ? store.message?.messagesByChat?.[currentChat.id]?.messages
      : undefined,
  );
  const messages = messagesRaw || [];
  const messageDraft =
    useSelector((store) =>
      currentChat?.id
        ? store.message?.messageDrafts?.[currentChat.id]
        : undefined,
    ) || "";
  const isLoadingChats = chat?.loading || false;
  const isLoadingMessages = message?.messageLoading;
  const isSendingMessage = message?.sendingMessage;
  const isUploadingFile = message?.uploadingFile;
  const replyingTo = message?.replyingTo;
  const hasMore = currentChat?.id
    ? (message?.messagesByChat?.[currentChat.id]?.hasMore ?? true)
    : false;
  const currentPage = currentChat?.id
    ? (message?.messagesByChat?.[currentChat.id]?.page ?? 0)
    : 0;

  const open = Boolean(anchorEl);

  const {
    isConnected: wsConnected,
    sendMessage: sendWebSocketMessage,
    sendTypingIndicator,
    markMessageAsRead,
  } = useWebSocket();

  useEffect(() => {
    if (currentUser) {
      dispatch(getUserChats());
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    if (currentChat?.id) {
      dispatch(getChatMessages(currentChat.id));
      dispatch(markChatAsRead(currentChat.id));
      dispatch(clearUnreadCount(currentChat.id));
      dispatch(clearReplyingTo());
      closeChatSearch();
      setShowChatMenu(false);
      setShowChatInfo(false);
    }
  }, [currentChat?.id, dispatch]);

  useEffect(() => {
    if (currentChat?.id) {
      setContent(messageDraft);
    }
  }, [currentChat?.id, messageDraft]);

  const prevMessagesLengthRef = useRef(0);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    if (currentChat?.id) {
      shouldScrollRef.current = true;
    }
  }, [currentChat?.id]);

  useEffect(() => {
    if (!messages.length) return;

    const prevLength = prevMessagesLengthRef.current;
    const newLength = messages.length;

    if (shouldScrollRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        shouldScrollRef.current = false;
      }, 100);
    } else if (newLength > prevLength && prevLength > 0) {
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom =
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
          150;
        if (isNearBottom) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    }

    prevMessagesLengthRef.current = newLength;
  }, [messages.length]);

  const lastReadChatRef = useRef(null);
  const lastReadLengthRef = useRef(0);

  useEffect(() => {
    if (!currentChat?.id || !wsConnected || !messages.length) return;

    const isNewChat = lastReadChatRef.current !== currentChat.id;
    const hasNewMessages = messages.length > lastReadLengthRef.current;

    if (!isNewChat && !hasNewMessages) return;

    const unreadMessages = messages.filter(
      (msg) =>
        msg.sender.id !== currentUser?.id &&
        !msg.readStatuses?.some((status) => status.user.id === currentUser?.id),
    );

    if (unreadMessages.length > 0) {
      const lastUnread = unreadMessages[unreadMessages.length - 1];
      markMessageAsRead(lastUnread.id);
    }

    lastReadChatRef.current = currentChat.id;
    lastReadLengthRef.current = messages.length;
  }, [
    currentChat?.id,
    wsConnected,
    messages.length,
    currentUser?.id,
    markMessageAsRead,
  ]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);
      if (currentChat) {
        dispatch(setMessageDraft(currentChat.id, newContent));
      }
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      const newContent = content + emoji;
      setContent(newContent);
      if (currentChat) {
        dispatch(setMessageDraft(currentChat.id, newContent));
      }
    }
  };

  const handleTyping = useCallback(() => {
    if (!currentChat?.id || !wsConnected) return;

    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(currentChat.id, true);
    }

    if (typingTimer) {
      clearTimeout(typingTimer);
    }

    const newTimer = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(currentChat.id, false);
      setTypingTimer(null);
    }, 3000);

    setTypingTimer(newTimer);
  }, [
    currentChat?.id,
    wsConnected,
    isTyping,
    sendTypingIndicator,
    typingTimer,
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLoadMore = useCallback(async () => {
    if (!currentChat?.id || isLoadingMore || !hasMore) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const prevScrollHeight = container.scrollHeight;

    setIsLoadingMore(true);
    try {
      await dispatch(getChatMessages(currentChat.id, currentPage + 1));
    } finally {
      setIsLoadingMore(false);
    }

    requestAnimationFrame(() => {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - prevScrollHeight;
    });
  }, [currentChat?.id, isLoadingMore, hasMore, currentPage, dispatch]);

  const handleMessagesScroll = useCallback(
    (e) => {
      const { scrollTop } = e.target;
      if (scrollTop < 50 && hasMore && !isLoadingMore) {
        handleLoadMore();
      }
    },
    [hasMore, isLoadingMore, handleLoadMore],
  );

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSearch = (query) => {
    if (query.trim()) {
      dispatch(searchChats(query));
    } else {
      dispatch(getUserChats());
    }
  };

  const handleClickOnChatCard = (chatData) => {
    dispatch(setActiveChat(chatData));
  };

  // ===== CHAT SEARCH =====
  const handleChatSearch = async () => {
    if (!chatSearchQuery.trim() || !currentChat?.id) {
      setChatSearchResults([]);
      return;
    }
    setIsSearchingChat(true);
    try {
      const q = chatSearchQuery.trim().toLowerCase();
      const matched = [];

      for (const msg of messages) {
        if (!msg.content) continue;

        let searchText = msg.content;

        if (cryptoService.isEncrypted(msg.content)) {
          try {
            const parsed = cryptoService.parseEncryptedContent(msg.content);
            const myUserId = currentUser?.id?.toString();
            const myKey = parsed?.encryptedKeys?.[myUserId];
            if (myKey && parsed.encryptedContent && parsed.iv) {
              searchText = await cryptoService.decryptMessage(
                parsed.encryptedContent,
                myKey,
                parsed.iv,
              );
            } else {
              continue;
            }
          } catch {
            continue;
          }
        }

        if (searchText.toLowerCase().includes(q)) {
          matched.push({ ...msg, _searchText: searchText });
        }
      }

      setChatSearchResults(matched);
    } catch (error) {
      console.error("Search error:", error);
      setChatSearchResults([]);
    }
    setIsSearchingChat(false);
  };

  const scrollToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "background-color 0.3s";
      el.style.backgroundColor = "rgba(234, 179, 8, 0.2)";
      setTimeout(() => {
        el.style.backgroundColor = "transparent";
      }, 2000);
    }
  };

  const closeChatSearch = () => {
    setShowChatSearch(false);
    setChatSearchQuery("");
    setChatSearchResults([]);
    setChatSearchIndex(-1);
    setActiveSearchHighlight({ messageId: null, query: "" });
  };

  // ===== CHAT MENU =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) {
        setShowChatMenu(false);
      }
    };
    if (showChatMenu)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showChatMenu]);

  const handleDeleteChat = async () => {
    if (!currentChat?.id) return;
    if (!window.confirm("Are you sure you want to delete this chat?")) return;
    try {
      await dispatch(deleteGroupChat(currentChat.id));
      dispatch(setActiveChat(null));
      dispatch(getUserChats());
    } catch (error) {
      console.error("Delete chat error:", error);
      alert(error.response?.data?.message || "Failed to delete chat");
    }
    setShowChatMenu(false);
  };

  const handleLeaveGroup = async () => {
    if (!currentChat?.id) return;
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    try {
      await dispatch(leaveGroup(currentChat.id));
      dispatch(setActiveChat(null));
      dispatch(getUserChats());
    } catch (error) {
      console.error("Leave group error:", error);
      alert(error.response?.data?.message || "Failed to leave group");
    }
    setShowChatMenu(false);
  };

  /**
   * Encrypt message content for all members in current chat
   * Returns encrypted JSON string or original text if E2EE not available
   */
  const encryptForChat = async (plainText) => {
    try {
      if (!currentChat?.members || !cryptoService.hasKeyPair()) {
        return plainText;
      }

      const recipients = [];
      for (const member of currentChat.members) {
        let publicKey = member.publicKey;
        if (!publicKey) {
          try {
            const res = await api.get(`/api/users/${member.id}/public-key`);
            publicKey = res.data.publicKey;
          } catch {}
        }
        if (publicKey) {
          recipients.push({ userId: member.id, publicKey });
        }
      }

      if (recipients.length < currentChat.members.length) {
        console.warn(
          "[E2EE] Not all members have public keys, sending unencrypted",
        );
        return plainText;
      }

      const { encryptedContent, iv, encryptedKeys } =
        await cryptoService.encryptForGroup(plainText, recipients);

      return JSON.stringify({
        _e2ee: true,
        encryptedContent,
        iv,
        encryptedKeys,
      });
    } catch (error) {
      console.error("[E2EE] Encryption failed, sending unencrypted:", error);
      return plainText;
    }
  };

  const handleCreateNewMessage = async () => {
    if (!currentChat?.id || !content.trim() || isSendingMessage) return;

    const clientMessageId = crypto.randomUUID();
    const messageText = content.trim();
    const currentReplyTo = replyingTo;

    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(currentChat.id, false);
      if (typingTimer) {
        clearTimeout(typingTimer);
        setTypingTimer(null);
      }
    }

    dispatch({
      type: ADD_OPTIMISTIC_MESSAGE,
      payload: {
        clientMessageId,
        content: messageText,
        messageType: "TEXT",
        createdAt: new Date().toISOString(),
        status: "SENDING",
        sender: {
          id: currentUser.id,
          username: currentUser.username,
          fullName: currentUser.fullName,
          urlAvatar: currentUser.urlAvatar,
        },
        chat: { id: currentChat.id },
        replyTo: currentReplyTo
          ? {
              id: currentReplyTo.id,
              content: currentReplyTo.content,
              sender: currentReplyTo.sender,
              messageType: currentReplyTo.messageType,
            }
          : null,
      },
    });

    setContent("");
    dispatch(setMessageDraft(currentChat.id, ""));
    if (currentReplyTo) dispatch(clearReplyingTo());
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      setInputHeight(100);
    }
    setTimeout(() => scrollToBottom(), 100);

    try {
      const encryptedContent = await encryptForChat(messageText);

      let success = false;
      if (wsConnected) {
        success = sendWebSocketMessage(
          currentChat.id,
          encryptedContent,
          "TEXT",
          clientMessageId,
          currentReplyTo?.id,
        );
      }
      if (!success) {
        await dispatch(
          sendMessage({
            content: encryptedContent,
            chatId: currentChat.id,
            messageType: "TEXT",
            clientMessageId,
            replyToId: currentReplyTo?.id,
          }),
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      dispatch({
        type: MARK_MESSAGE_FAILED,
        payload: { clientMessageId, chatId: currentChat.id },
      });
    }
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    if (currentChat) {
      dispatch(setMessageDraft(currentChat.id, newContent));

      if (newContent.trim() && wsConnected) {
        handleTyping();
      } else if (isTyping && wsConnected) {
        setIsTyping(false);
        sendTypingIndicator(currentChat.id, false);
        if (typingTimer) {
          clearTimeout(typingTimer);
          setTypingTimer(null);
        }
      }
    }
  };

  const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = IMAGE_TYPES.includes(file.type);
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;

    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      alert(`File size exceeds ${maxMB}MB limit`);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    e.target.value = "";
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
  };

  const handleSendFile = async () => {
    if (!selectedFile || !currentChat?.id || isUploadingFile) return;

    const clientMessageId = crypto.randomUUID();
    const isImage = IMAGE_TYPES.includes(selectedFile.type);
    const caption = content.trim() || "";

    dispatch({
      type: ADD_OPTIMISTIC_MESSAGE,
      payload: {
        clientMessageId,
        content:
          (filePreview || "") +
          "|" +
          selectedFile.name +
          "|" +
          selectedFile.size +
          (caption ? "|" + caption : ""),
        messageType: isImage ? "IMAGE" : "FILE",
        createdAt: new Date().toISOString(),
        status: "UPLOADING",
        sender: {
          id: currentUser.id,
          username: currentUser.username,
          fullName: currentUser.fullName,
          urlAvatar: currentUser.urlAvatar,
        },
        chat: { id: currentChat.id },
      },
    });

    const fileToUpload = selectedFile;
    const captionToSend = caption || undefined;
    handleFileRemove();
    setContent("");
    dispatch(setMessageDraft(currentChat.id, ""));
    setTimeout(() => scrollToBottom(), 100);

    try {
      await dispatch(
        uploadAndSendFile(
          fileToUpload,
          currentChat.id,
          captionToSend,
          (progress) => {
            setUploadProgress(progress);
          },
          clientMessageId,
        ),
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      dispatch({
        type: MARK_MESSAGE_FAILED,
        payload: { clientMessageId, chatId: currentChat.id },
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const typingUsers = useMemo(() => {
    if (!currentChat?.id || !message?.typingUsers) return [];
    return message.typingUsers[currentChat.id] || [];
  }, [currentChat?.id, message?.typingUsers]);

  const ConnectionStatus = () => (
    <div
      className={`fixed top-4 right-4 px-3 py-1 rounded-full text-sm font-medium z-50 ${
        wsConnected
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-yellow-100 text-yellow-800 border border-yellow-200"
      }`}
    >
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${
            wsConnected ? "bg-green-500" : "bg-yellow-500"
          }`}
        ></div>
        <span>{wsConnected ? "Real-time" : "HTTP Mode"}</span>
      </div>
    </div>
  );

  const TypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    const typingText =
      typingUsers.length === 1
        ? `${typingUsers[0].fullName} is typing...`
        : `${typingUsers.length} people are typing...`;

    return (
      <div className="px-4 py-2 text-sm text-gray-500 italic">{typingText}</div>
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreateNewMessage();
    }
  };

  const handleNavigateToProfile = () => {
    setIsProfile(true);
    setAnchorEl(null);
  };

  const handleBackFromProfile = () => {
    setIsProfile(false);
  };

  const handleBackFromGroupChat = () => {
    setIsGroupChat(false);
    if (currentUser) {
      dispatch(getUserChats());
    }
  };

  const handleGroupCreated = () => {
    setIsGroupChat(false);
  };

  const handleCreateGroupChat = () => {
    setIsGroupChat(true);
    setAnchorEl(null);
  };

  const handleStartNewChat = () => {
    setIsStartNewChat(true);
    setAnchorEl(null);
  };

  const handleBackFromStartNewChat = () => {
    setIsStartNewChat(false);
    if (currentUser) {
      dispatch(getUserChats());
    }
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    try {
      await dispatch(logout());
    } catch (error) {
      console.error("Logout error:", error);
    }
    navigate("/login");
  };

  const displayChats = useMemo(() => {
    const searchRes = Array.isArray(searchResults) ? searchResults : [];
    const chatList = Array.isArray(chats) ? chats : [];
    return querys ? searchRes : chatList;
  }, [querys, searchResults, chats]);

  return (
    <div className="relative">
      <div className="w-full py-14 bg-[#00a884]">
        <ConnectionStatus />
      </div>
      <div className="flex bg-[#f0f2f5] h-[95vh] absolute top-6 left-6 right-6 overflow-hidden shadow-lg">
        {/* Left sidebar */}
        <div className="left w-[30%] bg-[#e8e9ec] h-full">
          {/* Profile */}
          {isProfile && (
            <div className="w-full h-full">
              <Profile onBack={handleBackFromProfile} />
            </div>
          )}
          {/* Create Group Chat */}
          {isGroupChat && (
            <div className="w-full h-full">
              <CreateGroup
                onBack={handleBackFromGroupChat}
                onGroupCreated={handleGroupCreated}
              />
            </div>
          )}
          {/* Start New Chat */}
          {isStartNewChat && (
            <div className="w-full h-full">
              <StartNewChat
                onBack={handleBackFromStartNewChat}
                onGroupCreated={handleGroupCreated}
              />
            </div>
          )}
          {!isProfile && !isGroupChat && !isStartNewChat && (
            <div className="w-full">
              {/* Profile header */}
              <div className="flex justify-between items-center p-3 bg-[#e8e9ec] border-b border-gray-300">
                <div
                  onClick={handleNavigateToProfile}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <img
                    className="rounded-full w-10 h-10"
                    src={
                      currentUser?.urlAvatar ||
                      "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
                    }
                    alt="profile"
                  />
                  <p className="font-medium">{currentUser?.fullName}</p>
                </div>
                <div className="space-x-3 text-2xl flex text-gray-600">
                  <TbCircleDashed
                    className="cursor-pointer hover:text-gray-800"
                    onClick={() => navigate("/stories")}
                  />
                  <BiCommentDetail className="cursor-pointer hover:text-gray-800" />
                  <div>
                    <BsThreeDotsVertical
                      className="cursor-pointer hover:text-gray-800"
                      id="basic-button"
                      aria-controls={open ? "basic-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={open ? "true" : undefined}
                      onClick={handleClick}
                    />
                    <Menu
                      id="basic-menu"
                      anchorEl={anchorEl}
                      open={open}
                      onClose={handleClose}
                      slotProps={{
                        list: {
                          "aria-labelledby": "basic-button",
                        },
                      }}
                    >
                      <MenuItem onClick={handleNavigateToProfile}>
                        Profile
                      </MenuItem>
                      <MenuItem onClick={handleStartNewChat}>
                        Start New Chat
                      </MenuItem>
                      <MenuItem onClick={handleCreateGroupChat}>
                        Create Group Chat
                      </MenuItem>
                      <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                  </div>
                </div>
              </div>

              {/* Search bar */}
              <div className="relative flex justify-center items-center bg-white py-4 px-3 border-b border-gray-200">
                <input
                  className="border-none outline-none bg-slate-200 rounded-md w-[90%] pl-9 py-2 focus:bg-white focus:shadow-sm transition-all"
                  type="text"
                  placeholder="Search or start new chat"
                  onChange={(e) => {
                    setQuerys(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  value={querys}
                />
                <AiOutlineSearch className="absolute left-6 text-xl text-gray-500" />
                <div>
                  <BsFilter className="ml-4 text-3xl cursor-pointer hover:text-gray-700" />
                </div>
              </div>

              {/* Chat list */}
              <div className="bg-white h-[75vh] overflow-y-scroll relative">
                {isLoadingChats ? (
                  <div className="flex justify-center items-center h-20">
                    <div className="text-gray-500">Loading chats...</div>
                  </div>
                ) : Array.isArray(displayChats) && displayChats.length > 0 ? (
                  displayChats.map((chatItem, index) => (
                    <div
                      key={chatItem?.id || index}
                      onClick={() => handleClickOnChatCard(chatItem)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <hr className="border-gray-100" />
                      <ChatCard
                        chat={chatItem}
                        isActive={currentChat?.id === chatItem?.id}
                        unreadCount={chat?.unreadCounts?.[chatItem?.id] || 0}
                      />
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center items-center h-20">
                    <div className="text-gray-500">
                      {querys ? "No chats found" : "No chats yet"}
                    </div>
                  </div>
                )}

                {/* Floating Action Button - Start New Chat */}
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={handleStartNewChat}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl"
                    title="Start new chat"
                  >
                    <BiCommentDetail className="text-xl" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right chat area */}
        {!currentChat && (
          <div className="right items-center justify-center w-[70%] h-full flex bg-[#f7f8fa]">
            <div className="max-w-[70%] flex flex-col items-center justify-center h-full">
              <div>
                <img
                  className="w-full h-[60vh] object-contain"
                  src="/background.png"
                  alt="background"
                />
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-semibold text-gray-700">
                  Select a chat to start messaging
                </h1>
                <p className="text-gray-500 mt-3">
                  Your space to connect and vibe with friends.
                </p>
                {!wsConnected && (
                  <div className="mt-4 text-yellow-600 text-sm">
                    <p>Real-time messaging connecting...</p>
                    <p>Messages will work in HTTP mode</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat area when a chat is selected */}
        {currentChat && (
          <div className="right w-[70%] h-full bg-white relative flex">
            {/* Chat content area */}
            <div className="flex-1 h-full relative min-w-0">
              {/* Chat header */}
              <div className="header absolute top-0 w-full bg-white border-b border-gray-200 shadow-sm z-10">
                <div className="flex justify-between">
                  <div className="py-3 space-x-4 flex items-center px-3">
                    <img
                      className="rounded-full w-10 h-10 cursor-pointer"
                      src={(() => {
                        if (currentChat.groupChat) {
                          return (
                            currentChat.chatImage ||
                            "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
                          );
                        }
                        const chatData =
                          currentChat.members?.length > 0
                            ? currentChat
                            : chats?.find((c) => c.id === currentChat.id) ||
                              currentChat;
                        const otherUser = chatData.members?.find(
                          (m) => m.id !== currentUser?.id,
                        );
                        return (
                          otherUser?.urlAvatar ||
                          "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
                        );
                      })()}
                      alt="chat"
                    />
                    <div className="flex flex-col">
                      <p className="font-medium">
                        {currentChat.groupChat
                          ? currentChat.chatName || "Group Chat"
                          : currentChat.members?.find(
                              (member) => member.id !== currentUser?.id,
                            )?.fullName || "Chat"}
                      </p>
                      {currentChat.groupChat && (
                        <p className="text-xs text-gray-500">
                          {currentChat.members?.length || 0} members
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="py-3 flex space-x-4 items-center px-3 text-gray-600">
                    <AiOutlineSearch
                      className="cursor-pointer hover:text-gray-800 text-xl"
                      onClick={() => {
                        setShowChatSearch((prev) => !prev);
                        if (showChatSearch) closeChatSearch();
                      }}
                    />
                    <div className="relative" ref={chatMenuRef}>
                      <BsThreeDotsVertical
                        className="cursor-pointer hover:text-gray-800 text-xl"
                        onClick={() => setShowChatMenu((prev) => !prev)}
                      />
                      {/* Chat menu dropdown */}
                      {showChatMenu && (
                        <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px] z-30">
                          {/* Info */}
                          <button
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                            onClick={() => {
                              setShowChatInfo(true);
                              setShowChatMenu(false);
                              setShowChatSearch(false);
                            }}
                          >
                            <span>ℹ️</span>
                            <span>
                              {currentChat.groupChat
                                ? "Group info"
                                : "Chat info"}
                            </span>
                          </button>

                          {/* Private chat: Nickname */}
                          {!currentChat.groupChat && (
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                              onClick={() => {
                                setShowChatInfo(true);
                                setShowChatMenu(false);
                                setShowChatSearch(false);
                              }}
                            >
                              <span>✏️</span>
                              <span>Set nickname</span>
                            </button>
                          )}

                          {/* Group: Members */}
                          {currentChat.groupChat && (
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                              onClick={() => {
                                setShowChatInfo(true);
                                setShowChatMenu(false);
                                setShowChatSearch(false);
                              }}
                            >
                              <span>👥</span>
                              <span>
                                Members ({currentChat.members?.length || 0})
                              </span>
                            </button>
                          )}

                          {/* Group admin: Rename */}
                          {currentChat.groupChat &&
                            (currentChat.createdBy?.id === currentUser?.id ||
                              currentChat.admins?.some(
                                (a) => a.id === currentUser?.id,
                              )) && (
                              <button
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                                onClick={async () => {
                                  const newName = prompt(
                                    "Enter new group name:",
                                    currentChat.chatName,
                                  );
                                  if (
                                    newName &&
                                    newName.trim() &&
                                    newName.trim() !== currentChat.chatName
                                  ) {
                                    try {
                                      const token =
                                        localStorage.getItem("token");
                                      await api.put(
                                        `/api/chats/${currentChat.id}/name`,
                                        newName.trim(),
                                        {
                                          headers: {
                                            Authorization: `Bearer ${token}`,
                                            "Content-Type": "text/plain",
                                          },
                                        },
                                      );
                                      dispatch(getUserChats());
                                    } catch (err) {
                                      alert("Failed to rename group");
                                    }
                                  }
                                  setShowChatMenu(false);
                                }}
                              >
                                <span>📝</span>
                                <span>Change group name</span>
                              </button>
                            )}

                          {/* Group admin: Change photo */}
                          {currentChat.groupChat &&
                            (currentChat.createdBy?.id === currentUser?.id ||
                              currentChat.admins?.some(
                                (a) => a.id === currentUser?.id,
                              )) && (
                              <label className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3 cursor-pointer">
                                <span>📷</span>
                                <span>Change group photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const formData = new FormData();
                                      formData.append("file", file);
                                      const token =
                                        localStorage.getItem("token");
                                      const uploadRes = await api.post(
                                        "/api/users/upload-avatar",
                                        formData,
                                        {
                                          headers: {
                                            Authorization: `Bearer ${token}`,
                                            "Content-Type":
                                              "multipart/form-data",
                                          },
                                        },
                                      );
                                      await api.put(
                                        `/api/chats/${currentChat.id}/image`,
                                        uploadRes.data.imageUrl,
                                        {
                                          headers: {
                                            Authorization: `Bearer ${token}`,
                                            "Content-Type": "text/plain",
                                          },
                                        },
                                      );
                                      dispatch(getUserChats());
                                    } catch (err) {
                                      alert("Failed to update group photo");
                                    }
                                    e.target.value = "";
                                    setShowChatMenu(false);
                                  }}
                                />
                              </label>
                            )}

                          {/* Group admin: Add member */}
                          {currentChat.groupChat &&
                            (currentChat.createdBy?.id === currentUser?.id ||
                              currentChat.admins?.some(
                                (a) => a.id === currentUser?.id,
                              )) && (
                              <button
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                                onClick={() => {
                                  setShowChatInfo(true);
                                  setShowChatMenu(false);
                                  setShowChatSearch(false);
                                }}
                              >
                                <span>➕</span>
                                <span>Add member</span>
                              </button>
                            )}

                          <div className="border-t border-gray-100 my-1"></div>

                          {/* Group: Leave */}
                          {currentChat.groupChat && (
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                              onClick={handleLeaveGroup}
                            >
                              <span>🚪</span>
                              <span>Leave group</span>
                            </button>
                          )}

                          {/* Delete chat */}
                          <button
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                            onClick={handleDeleteChat}
                          >
                            <span>🗑️</span>
                            <span>Delete chat</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat messages area */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="messages pt-20 px-3 overflow-y-auto flex flex-col space-y-2 bg-[#efeae2] absolute top-0 left-0 right-0"
                style={{
                  bottom: `${inputHeight}px`,
                }}
              >
                <div className="flex flex-col items-start space-y-2 pb-4">
                  {/* Loading more indicator */}
                  {isLoadingMore && (
                    <div className="flex justify-center items-center py-3">
                      <div className="text-sm text-gray-500">
                        Loading older messages...
                      </div>
                    </div>
                  )}
                  {!hasMore && messages.length > 0 && (
                    <div className="flex justify-center items-center py-3">
                      <div className="text-xs text-gray-400">
                        Beginning of conversation
                      </div>
                    </div>
                  )}
                  {isLoadingMessages ? (
                    <div className="flex justify-center items-center h-20">
                      <div className="text-gray-500">Loading messages...</div>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg, index) => (
                      <MessageCard
                        key={msg.id || msg.clientMessageId}
                        message={msg}
                        messageDomId={`msg-${msg.id}`}
                        isReqUserMessage={msg.sender?.id === currentUser?.id}
                        content={msg.content}
                        highlightText={
                          activeSearchHighlight.messageId === msg.id
                            ? activeSearchHighlight.query
                            : ""
                        }
                        encryptFn={encryptForChat}
                        onReply={(m) => {
                          dispatch(setReplyingTo(m));
                          textareaRef.current?.focus();
                        }}
                      />
                    ))
                  ) : (
                    <div className="flex justify-center items-center h-20">
                      <div className="text-gray-500">
                        No messages yet. Start the conversation!
                      </div>
                    </div>
                  )}
                  {/* Typing Indicator */}
                  <TypingIndicator />
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message input */}
              <div
                ref={inputContainerRef}
                className="absolute bottom-0 left-0 right-0 bg-[#f0f2f5] px-3 py-2 flex flex-col"
                style={{ minHeight: `${inputHeight}px` }}
              >
                {/* Reply preview bar */}
                {replyingTo && (
                  <div className="mb-2 p-2 bg-white rounded-lg border-l-4 border-green-500 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-green-600">
                        {replyingTo.sender?.id === currentUser?.id
                          ? "You"
                          : replyingTo.sender?.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {replyingTo.messageType === "IMAGE"
                          ? "📷 Photo"
                          : replyingTo.messageType === "FILE"
                            ? "📎 File"
                            : replyingTo.content}
                      </p>
                    </div>
                    <button
                      onClick={() => dispatch(clearReplyingTo())}
                      className="p-1 hover:bg-gray-100 rounded-full ml-2 flex-shrink-0"
                    >
                      <IoClose className="text-lg text-gray-500" />
                    </button>
                  </div>
                )}

                {/* File preview */}
                {selectedFile && (
                  <div className="mb-2 p-2 bg-white rounded-lg border border-gray-200 flex items-center space-x-3">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="preview"
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-2xl">
                        📎
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                      {isUploadingFile && (
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleFileRemove}
                      className="p-1 hover:bg-gray-100 rounded-full"
                      disabled={isUploadingFile}
                    >
                      <IoClose className="text-xl text-gray-500" />
                    </button>
                  </div>
                )}

                {/* Input row */}
                <div className="flex items-end space-x-3">
                  <div className="relative" ref={emojiPickerRef}>
                    <BsEmojiSmile
                      className={`text-2xl cursor-pointer transition-colors ${
                        showEmojiPicker
                          ? "text-green-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                    />
                    {showEmojiPicker && (
                      <div className="absolute bottom-10 left-0 z-50 shadow-xl rounded-lg">
                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          width={320}
                          height={400}
                          searchPlaceHolder="Search emoji..."
                          previewConfig={{ showPreview: false }}
                          skinTonesDisabled
                          lazyLoadEmojis
                        />
                      </div>
                    )}
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
                  />
                  <ImAttachment
                    className="text-2xl text-gray-500 cursor-pointer hover:text-gray-700"
                    onClick={() => fileInputRef.current?.click()}
                  />

                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      className="w-full border-none outline-none bg-white rounded-lg px-4 py-2 resize-none text-sm"
                      placeholder={
                        selectedFile ? "Add a caption..." : "Type a message..."
                      }
                      value={content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (selectedFile) {
                            handleSendFile();
                          } else {
                            handleCreateNewMessage();
                          }
                        }
                      }}
                      style={{ minHeight: "40px", maxHeight: "120px" }}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        const newHeight = Math.min(
                          Math.max(e.target.scrollHeight, 40),
                          120,
                        );
                        e.target.style.height = newHeight + "px";
                        setInputHeight(Math.max(100, newHeight + 60));
                      }}
                      disabled={isSendingMessage || isUploadingFile}
                    />
                  </div>

                  <button
                    onClick={
                      selectedFile ? handleSendFile : handleCreateNewMessage
                    }
                    disabled={
                      selectedFile
                        ? isUploadingFile
                        : !content.trim() || isSendingMessage
                    }
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title={
                      selectedFile
                        ? isUploadingFile
                          ? `Uploading... ${uploadProgress}%`
                          : "Send file"
                        : wsConnected
                          ? "Send via WebSocket"
                          : "Send via HTTP"
                    }
                  >
                    {isUploadingFile ? (
                      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <IoSend
                        className={`text-2xl ${
                          selectedFile
                            ? "text-green-600 hover:text-green-700"
                            : !content.trim() || isSendingMessage
                              ? "text-gray-400"
                              : wsConnected
                                ? "text-green-600 hover:text-green-700"
                                : "text-blue-600 hover:text-blue-700"
                        } transition-colors`}
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>
            {/* end chat content area */}

            {/* Chat Info Panel */}
            {showChatInfo && (
              <ChatInfoPanel
                chat={currentChat}
                onClose={() => setShowChatInfo(false)}
              />
            )}

            {/* Search Panel (Messenger style) */}
            {showChatSearch && (
              <div className="w-[320px] h-full bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
                {/* Search header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">Search</h3>
                  <IoClose
                    className="text-xl text-gray-500 cursor-pointer hover:text-gray-800"
                    onClick={closeChatSearch}
                  />
                </div>

                {/* Search input */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
                    <AiOutlineSearch className="text-gray-400 mr-2" />
                    <input
                      ref={chatSearchRef}
                      type="text"
                      placeholder="Search messages..."
                      className="flex-1 bg-transparent outline-none text-sm"
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleChatSearch();
                        if (e.key === "Escape") closeChatSearch();
                      }}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Results count */}
                {chatSearchResults.length > 0 && (
                  <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                    {chatSearchResults.length} results
                  </div>
                )}

                {/* Search results list */}
                <div className="flex-1 overflow-y-auto">
                  {isSearchingChat && (
                    <div className="flex justify-center py-8">
                      <span className="text-sm text-gray-400">
                        Searching...
                      </span>
                    </div>
                  )}

                  {!isSearchingChat &&
                    chatSearchQuery &&
                    chatSearchResults.length === 0 && (
                      <div className="flex justify-center py-8">
                        <span className="text-sm text-gray-400">
                          No results found
                        </span>
                      </div>
                    )}

                  {chatSearchResults.map((msg) => {
                    const isOwn = msg.sender?.id === currentUser?.id;
                    const senderName = isOwn
                      ? "You"
                      : msg.sender?.fullName || "Unknown";
                    const time = new Date(msg.createdAt);
                    const timeStr =
                      time.toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      }) +
                      " " +
                      time.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });

                    const q = chatSearchQuery.trim().toLowerCase();
                    const contentText = msg._searchText || msg.content || "";
                    const matchIdx = contentText.toLowerCase().indexOf(q);
                    let preview;
                    if (matchIdx >= 0) {
                      const start = Math.max(0, matchIdx - 20);
                      const end = Math.min(
                        contentText.length,
                        matchIdx + q.length + 30,
                      );
                      const before =
                        (start > 0 ? "..." : "") +
                        contentText.slice(start, matchIdx);
                      const match = contentText.slice(
                        matchIdx,
                        matchIdx + q.length,
                      );
                      const after =
                        contentText.slice(matchIdx + q.length, end) +
                        (end < contentText.length ? "..." : "");
                      preview = (
                        <span>
                          {before}
                          <mark className="bg-yellow-200 rounded">{match}</mark>
                          {after}
                        </span>
                      );
                    } else {
                      preview =
                        contentText.length > 50
                          ? contentText.slice(0, 50) + "..."
                          : contentText;
                    }

                    return (
                      <div
                        key={msg.id}
                        className="flex items-start px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors"
                        onClick={() => {
                          setActiveSearchHighlight({
                            messageId: msg.id,
                            query: chatSearchQuery.trim(),
                          });
                          scrollToMessage(msg.id);
                        }}
                      >
                        <img
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0 mr-3"
                          src={
                            msg.sender?.urlAvatar ||
                            "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
                          }
                          alt=""
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800 truncate">
                              {senderName}
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {timeStr}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                            {preview}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
