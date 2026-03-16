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
import { ImAttachment } from "react-icons/im";
import { IoSend } from "react-icons/io5";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";
import Profile from "./Profile/Profile";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import CreateGroup from "./GroupChat/CreateGroup";
import StartNewChat from "./Chat/StartNewChat";
import { logout } from "../redux/Auth/Action";
import { useDispatch, useSelector } from "react-redux";
import { getUserChats, searchChats, setActiveChat, getAllUnreadCounts, clearUnreadCount } from "../redux/Chat/Action";
import useWebSocket from "../hooks/useWebSocket";

import {
  getChatMessages,
  sendMessage,
  setMessageDraft,
  markChatAsRead,
} from "../redux/Message/Action";

import {
  selectMessagesByChat,
  selectMessageDraft,
} from "../redux/Message/Selectors";

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

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const inputContainerRef = useRef(null);

  const store = useSelector((store) => store);
  const { auth } = store;
  const { chat } = store;
  const { message } = store;

  const currentUser = auth?.user;
  const currentChat = chat?.activeChat;
  const chats = Array.isArray(chat?.chats) ? chat.chats : [];
  const searchResults = Array.isArray(chat?.searchResults)
    ? chat.searchResults
    : [];
  const messages =
    currentChat?.id && message
      ? selectMessagesByChat(store, currentChat.id)
      : [];
  const messageDraft =
    currentChat?.id && message ? selectMessageDraft(store, currentChat.id) : "";
  const isLoadingChats = chat?.loading || false;
  const isLoadingMessages = message?.messageLoading;
  const isSendingMessage = message?.sendingMessage;
  const hasMore = currentChat?.id
    ? message?.messagesByChat?.[currentChat.id]?.hasMore ?? true
    : false;
  const currentPage = currentChat?.id
    ? message?.messagesByChat?.[currentChat.id]?.page ?? 0
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
      dispatch(getAllUnreadCounts());
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    if (currentChat?.id) {
      dispatch(getChatMessages(currentChat.id));
      dispatch(markChatAsRead(currentChat.id));
      dispatch(clearUnreadCount(currentChat.id));
    }
  }, [currentChat?.id, dispatch]);

  useEffect(() => {
    if (currentChat?.id) {
      setContent(messageDraft);
    }
  }, [currentChat?.id, messageDraft]);

  const prevMessagesLengthRef = useRef(0);
  const shouldScrollRef = useRef(true);

  // Scroll xuống cuối khi mở chat mới
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
      // Mở chat lần đầu → scroll xuống cuối sau khi render
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        shouldScrollRef.current = false;
      }, 100);
    } else if (newLength > prevLength && prevLength > 0) {
      // Có tin mới (append ở cuối) → kiểm tra nếu đang ở gần cuối thì scroll
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    }
    // Load tin cũ (prepend) → không scroll, handleLoadMore đã giữ vị trí

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

    // Lưu scroll position trước khi load
    const prevScrollHeight = container.scrollHeight;

    setIsLoadingMore(true);
    try {
      await dispatch(getChatMessages(currentChat.id, currentPage + 1));
    } finally {
      setIsLoadingMore(false);
    }

    // Giữ vị trí scroll sau khi prepend tin cũ
    requestAnimationFrame(() => {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - prevScrollHeight;
    });
  }, [currentChat?.id, isLoadingMore, hasMore, currentPage, dispatch]);

  const handleMessagesScroll = useCallback(
    (e) => {
      const { scrollTop } = e.target;
      // Khi scroll lên gần đầu (< 50px) → load thêm tin cũ
      if (scrollTop < 50 && hasMore && !isLoadingMore) {
        handleLoadMore();
      }
    },
    [hasMore, isLoadingMore, handleLoadMore]
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

  const handleCreateNewMessage = async () => {
    if (!currentChat?.id) {
      console.error("No chat selected");
      return;
    }

    if (content.trim() && currentChat && !isSendingMessage) {
      try {
        if (isTyping) {
          setIsTyping(false);
          sendTypingIndicator(currentChat.id, false);
          if (typingTimer) {
            clearTimeout(typingTimer);
            setTypingTimer(null);
          }
        }

        const messageData = {
          content: content.trim(),
          chatId: currentChat.id,
          messageType: "TEXT",
        };

        let success = false;

        if (wsConnected) {
          success = sendWebSocketMessage(
            currentChat.id,
            content.trim(),
            "TEXT",
          );
        }

        if (!success) {
          await dispatch(sendMessage(messageData));
        }

        setContent("");
        dispatch(setMessageDraft(currentChat.id, ""));

        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          setInputHeight(100);
        }

        setTimeout(() => scrollToBottom(), 100);
      } catch (error) {
        console.error("Error sending message:", error);
      }
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
          <div className="right w-[70%] h-full bg-white relative">
            {/* Chat header */}
            <div className="header absolute top-0 w-full bg-white border-b border-gray-200 shadow-sm z-10">
              <div className="flex justify-between">
                <div className="py-3 space-x-4 flex items-center px-3">
                  <img
                    className="rounded-full w-10 h-10 cursor-pointer"
                    src={
                      currentChat.chatImage ||
                      "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
                    }
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
                  <AiOutlineSearch className="cursor-pointer hover:text-gray-800" />
                  <BsThreeDotsVertical className="cursor-pointer hover:text-gray-800" />
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
              <div className="flex flex-col space-y-2 pb-4">
                {/* Loading more indicator */}
                {isLoadingMore && (
                  <div className="flex justify-center items-center py-3">
                    <div className="text-sm text-gray-500">Loading older messages...</div>
                  </div>
                )}
                {!hasMore && messages.length > 0 && (
                  <div className="flex justify-center items-center py-3">
                    <div className="text-xs text-gray-400">Beginning of conversation</div>
                  </div>
                )}
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-20">
                    <div className="text-gray-500">Loading messages...</div>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <MessageCard
                      key={msg.id}
                      message={msg}
                      isReqUserMessage={msg.sender.id === currentUser?.id}
                      content={msg.content}
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
              className="absolute bottom-0 left-0 right-0 bg-[#f0f2f5] px-3 py-2 flex items-end space-x-3"
              style={{ minHeight: `${inputHeight}px` }}
            >
              <BsEmojiSmile className="text-2xl text-gray-500 cursor-pointer hover:text-gray-700" />
              <ImAttachment className="text-2xl text-gray-500 cursor-pointer hover:text-gray-700" />

              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  className="w-full border-none outline-none bg-white rounded-lg px-4 py-2 resize-none text-sm"
                  placeholder="Type a message..."
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyPress={handleKeyPress}
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
                  disabled={isSendingMessage}
                />
              </div>

              {/* ✅ Fixed send button - removed wsConnected dependency */}
              <button
                onClick={handleCreateNewMessage}
                disabled={!content.trim() || isSendingMessage}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title={wsConnected ? "Send via WebSocket" : "Send via HTTP"}
              >
                <IoSend
                  className={`text-2xl ${
                    !content.trim() || isSendingMessage
                      ? "text-gray-400"
                      : wsConnected
                        ? "text-green-600 hover:text-green-700"
                        : "text-blue-600 hover:text-blue-700"
                  } transition-colors`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;