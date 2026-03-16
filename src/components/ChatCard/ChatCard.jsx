import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import cryptoService from "../../services/CryptoService";

const ChatCard = ({ chat, isActive, unreadCount = 0 }) => {
  const store = useSelector((store) => store);
  const currentUser = store.auth?.user;
  const [decryptedLastMsg, setDecryptedLastMsg] = useState(null);

  const chatMessages =
    store.message?.messagesByChat?.[chat?.id]?.messages || [];

  if (!chat) return null;

  const getChatDisplayName = () => {
    if (chat.groupChat) {
      return chat.chatName || "Group Chat";
    } else {
      const otherUser = chat.members?.find(
        (member) => member.id !== currentUser?.id,
      );
      return otherUser?.fullName || "Unknown User";
    }
  };

  const getChatDisplayImage = () => {
    if (chat.groupChat) {
      return (
        chat.chatImage ||
        "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
      );
    } else {
      const otherUser = chat.members?.find(
        (member) => member.id !== currentUser?.id,
      );
      return (
        otherUser?.urlAvatar ||
        "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
      );
    }
  };

  const getLastMessage = () => {
    if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      return formatMessage(
        lastMsg.content,
        lastMsg.createdAt,
        lastMsg.sender?.id === currentUser?.id,
        lastMsg.messageType,
      );
    }

    if (chat._lastMessage) {
      return formatMessage(
        chat._lastMessage.content,
        chat._lastMessage.createdAt,
        chat._lastMessage.senderId === currentUser?.id,
        chat._lastMessage.messageType,
      );
    }

    return {
      content: "No messages yet",
      timestamp: "",
      isFromCurrentUser: false,
    };
  };

  const formatMessage = (
    content,
    createdAt,
    isFromCurrentUser,
    messageType,
  ) => {
    const messageDate = new Date(createdAt);
    const now = new Date();
    const diffTime = now - messageDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let timestamp = "";
    if (diffDays === 0) {
      timestamp = messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else if (diffDays === 1) {
      timestamp = "Yesterday";
    } else if (diffDays < 7) {
      timestamp = messageDate.toLocaleDateString([], { weekday: "short" });
    } else {
      timestamp = messageDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }

    let displayContent = content || "";
    if (messageType === "IMAGE") {
      displayContent = "📷 Photo";
    } else if (messageType === "FILE") {
      const parts = content?.split("|") || [];
      const fileName = parts[1] || "File";
      displayContent = "📎 " + fileName;
    } else {
      try {
        const parsed = JSON.parse(displayContent);
        if (parsed._e2ee === true) {
          displayContent = "Encrypted message";
        } else {
          if (displayContent.length > 30) {
            displayContent = displayContent.substring(0, 30) + "...";
          }
        }
      } catch {
        if (displayContent.length > 30) {
          displayContent = displayContent.substring(0, 30) + "...";
        }
      }
    }
    if (isFromCurrentUser && chat.groupChat) {
      displayContent = "You: " + displayContent;
    }

    return { content: displayContent, timestamp, isFromCurrentUser };
  };

  const lastMessage = getLastMessage();
  const displayName = getChatDisplayName();
  const displayImage = getChatDisplayImage();

  const rawLastContent =
    chatMessages.length > 0
      ? chatMessages[chatMessages.length - 1].content
      : chat._lastMessage?.content || null;

  useEffect(() => {
    const decryptLast = async () => {
      if (!rawLastContent) {
        setDecryptedLastMsg(null);
        return;
      }
      if (cryptoService.isEncrypted(rawLastContent)) {
        try {
          const parsed = cryptoService.parseEncryptedContent(rawLastContent);
          const myUserId = currentUser?.id?.toString();
          const myKey = parsed?.encryptedKeys?.[myUserId];
          if (myKey && parsed.encryptedContent && parsed.iv) {
            const decrypted = await cryptoService.decryptMessage(
              parsed.encryptedContent,
              myKey,
              parsed.iv,
            );
            const isFromMe =
              chatMessages.length > 0
                ? chatMessages[chatMessages.length - 1].sender?.id ===
                  currentUser?.id
                : chat._lastMessage?.senderId === currentUser?.id;
            let preview =
              decrypted.length > 30
                ? decrypted.substring(0, 30) + "..."
                : decrypted;
            if (isFromMe && chat.groupChat) {
              preview = "You: " + preview;
            }
            setDecryptedLastMsg(preview);
          } else {
            setDecryptedLastMsg("Encrypted message");
          }
        } catch {
          setDecryptedLastMsg("Encrypted message");
        }
      } else {
        setDecryptedLastMsg(null);
      }
    };
    decryptLast();
  }, [rawLastContent, currentUser?.id]);

  const displayLastMessage = decryptedLastMsg || lastMessage.content;

  return (
    <div
      className={`flex items-center justify-center py-2 group cursor-pointer transition-colors ${
        isActive ? "bg-[#e9edef]" : "hover:bg-gray-50"
      }`}
    >
      <div className="w-[20%] flex justify-center items-center">
        <div className="relative">
          <img
            className="h-10 w-10 rounded-full object-cover"
            src={displayImage}
            alt="chat avatar"
            onError={(e) => {
              e.target.src =
                "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png";
            }}
          />
          {!chat.groupChat && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
      </div>

      <div className="w-[80%] pl-3">
        <div className="flex justify-between items-center">
          <p
            className={`text-lg truncate ${
              isActive
                ? "font-semibold"
                : unreadCount > 0
                  ? "font-bold"
                  : "font-medium"
            }`}
          >
            {displayName}
          </p>
          <p
            className={`text-xs flex-shrink-0 ${unreadCount > 0 ? "text-green-600 font-semibold" : "text-gray-500"}`}
          >
            {lastMessage.timestamp}
          </p>
        </div>

        <div className="flex justify-between items-center mt-1">
          <p
            className={`text-sm truncate flex-1 ${
              displayLastMessage === "No messages yet"
                ? "text-gray-400 italic"
                : unreadCount > 0
                  ? "text-gray-800 font-semibold"
                  : "text-gray-600"
            }`}
          >
            {displayLastMessage}
          </p>

          <div className="flex space-x-2 items-center flex-shrink-0 ml-2">
            {/* Unread count badge */}
            {unreadCount > 0 && (
              <div className="bg-green-500 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5">
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}

            {/* Group chat indicator */}
            {chat.groupChat && <div className="text-xs text-gray-400">👥</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatCard;
