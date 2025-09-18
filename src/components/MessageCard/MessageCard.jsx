import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  editMessage,
  deleteMessage,
  deleteMessageForMe,
} from "../../redux/Message/Action";

const MessageCard = ({ message, isRequestUserMessage }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message?.content || "");

  const { auth } = useSelector((store) => store);
  const { message: messageState } = useSelector((store) => store);
  const dispatch = useDispatch();

  const currentUser = auth?.user;
  const isOwnMessage = message?.sender?.id === currentUser?.id;
  const isEditingMessage = messageState?.editingMessage;

  if (!message) return null;
  const formatTimestamp = (timestamp) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffTime = now - messageDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else if (diffDays === 1) {
      return (
        "Yesterday " +
        messageDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    } else {
      return messageDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
  };
  const handleEditMessage = async () => {
    if (editContent.trim() && editContent !== message.content) {
      try {
        await dispatch(editMessage(message.id, editContent.trim()));
        setIsEditing(false);
        setShowOptions(false);
      } catch (error) {
        console.error("Error editing message:", error);
      }
    } else {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  const handleDeleteMessage = async () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await dispatch(deleteMessage(message.id));
        setShowOptions(false);
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  const handleDeleteForMe = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this message for yourself?"
      )
    ) {
      try {
        await dispatch(deleteMessageForMe(message.id));
        setShowOptions(false);
      } catch (error) {
        console.error("Error deleting message for me:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
    setShowOptions(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEditMessage();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };
  const messageStyle = isOwnMessage
    ? "self-end bg-[#d9fdd3] text-right"
    : "self-start bg-white text-left";

  return (
    <div
      className={`py-2 px-3 rounded-lg max-w-[70%] relative group ${messageStyle} shadow-sm`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => !isEditing && setShowOptions(false)}
    >
      {/* Message options */}
      {showOptions && !isEditing && (
        <div
          className={`absolute top-1 ${isOwnMessage ? "left-1" : "right-1"}`}
        >
          <div className="relative">
            <BsThreeDotsVertical
              className="text-gray-500 hover:text-gray-700 cursor-pointer text-sm bg-white rounded-full p-1 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                const options = [];
                if (isOwnMessage) {
                  options.push("Edit", "Delete");
                }
                options.push("Delete for me");

                const choice = prompt(
                  "Choose option:\n" +
                    options.map((opt, i) => `${i + 1}. ${opt}`).join("\n")
                );

                if (choice === "1" && isOwnMessage) {
                  setIsEditing(true);
                } else if (
                  (choice === "2" && isOwnMessage) ||
                  (choice === "1" && !isOwnMessage)
                ) {
                  if (isOwnMessage) {
                    handleDeleteMessage();
                  } else {
                    handleDeleteForMe();
                  }
                } else if (choice === "3" && isOwnMessage) {
                  handleDeleteForMe();
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Sender name for group chats (only for received messages) */}
      {!isOwnMessage && message.sender && (
        <div className="text-xs text-gray-600 mb-1 font-medium">
          {message.sender.fullName || message.sender.username}
        </div>
      )}

      {/* Message content */}
      {isEditing ? (
        <div className="w-full">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleEditMessage}
            className="w-full bg-transparent border border-gray-300 rounded px-2 py-1 text-sm resize-none outline-none focus:border-blue-400"
            autoFocus
            rows="2"
            disabled={isEditingMessage}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={handleCancelEdit}
              className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800"
              disabled={isEditingMessage}
            >
              Cancel
            </button>
            <button
              onClick={handleEditMessage}
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={isEditingMessage || !editContent.trim()}
            >
              {isEditingMessage ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm break-words whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Message edited indicator */}
          {message.updatedAt && message.updatedAt !== message.createdAt && (
            <span className="text-xs text-gray-400 italic ml-2">edited</span>
          )}
        </div>
      )}

      {/* Message metadata */}
      <div
        className={`flex items-center justify-end mt-1 space-x-1 text-xs text-gray-500 ${
          isOwnMessage ? "justify-end" : "justify-start"
        }`}
      >
        <span>{formatTimestamp(message.createdAt)}</span>

        {/* Message status for own messages */}
        {isOwnMessage && (
          <div className="flex items-center space-x-1">
            {/* Read status indicators */}
            <span className="text-gray-400">
              {message.readStatuses && message.readStatuses.length > 0
                ? "✓✓"
                : "✓"}
            </span>
          </div>
        )}
      </div>

      {/* Message type indicator (for future file/image messages) */}
      {message.messageType && message.messageType !== "TEXT" && (
        <div className="text-xs text-gray-400 mt-1">
          📎 {message.messageType}
        </div>
      )}
    </div>
  );
};

export default MessageCard;
