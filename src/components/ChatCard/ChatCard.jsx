import React from "react";
import { useSelector } from "react-redux";

const ChatCard = ({ chat, isActive }) => {
  const { auth } = useSelector((store) => store);
  const currentUser = auth?.user;

  if (!chat) return null;
  const getChatDisplayName = () => {
    if (chat.groupChat) {
      return chat.chatName || "Group Chat";
    } else {
      const otherUser = chat.members?.find(
        (member) => member.id !== currentUser?.id
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
        (member) => member.id !== currentUser?.id
      );
      return (
        otherUser?.urlAvatar ||
        "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
      );
    }
  };
  const getLastMessage = () => {
    if (!chat.messages || chat.messages.length === 0) {
      return {
        content: "No messages yet",
        timestamp: "",
        isFromCurrentUser: false,
      };
    }

    const lastMessage = chat.messages[chat.messages.length - 1];
    const isFromCurrentUser = lastMessage.sender.id === currentUser?.id;
    const messageDate = new Date(lastMessage.createdAt);
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
    let content = lastMessage.content;
    if (content.length > 30) {
      content = content.substring(0, 30) + "...";
    }
    if (isFromCurrentUser && chat.groupChat) {
      content = "You: " + content;
    }

    return {
      content,
      timestamp,
      isFromCurrentUser,
    };
  };
  const getUnreadCount = () => {
    return 0;
  };

  const lastMessage = getLastMessage();
  const unreadCount = getUnreadCount();
  const displayName = getChatDisplayName();
  const displayImage = getChatDisplayImage();

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
          {/* Online status indicator (optional) */}
          {!chat.groupChat && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
      </div>

      <div className="w-[80%] pl-3">
        <div className="flex justify-between items-center">
          <p
            className={`text-lg truncate ${
              isActive ? "font-semibold" : "font-medium"
            }`}
          >
            {displayName}
          </p>
          <p className="text-xs text-gray-500 flex-shrink-0">
            {lastMessage.timestamp}
          </p>
        </div>

        <div className="flex justify-between items-center mt-1">
          <p
            className={`text-sm truncate flex-1 ${
              lastMessage.content === "No messages yet"
                ? "text-gray-400 italic"
                : "text-gray-600"
            }`}
          >
            {lastMessage.content}
          </p>

          <div className="flex space-x-2 items-center flex-shrink-0">
            {/* Unread count badge */}
            {unreadCount > 0 && (
              <div className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}

            {/* Group chat indicator */}
            {chat.groupChat && (
              <div className="text-xs text-gray-400">👥</div>
            )}

            {/* Message status for last message from current user */}
            {lastMessage.isFromCurrentUser && (
              <div className="text-xs text-gray-400">
                ✓✓ {/* This could be dynamic based on read status */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatCard;
