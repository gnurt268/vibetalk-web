import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BsReply } from "react-icons/bs";
import { MdEdit, MdDelete, MdDeleteOutline } from "react-icons/md";
import cryptoService from "../../services/CryptoService";
import {
  editMessage,
  deleteMessage,
  deleteMessageForMe,
} from "../../redux/Message/Action";

const MessageCard = ({
  message,
  isRequestUserMessage,
  onReply,
  messageDomId,
  highlightText,
  encryptFn,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message?.content || "");
  const [showLightbox, setShowLightbox] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const dropdownRef = useRef(null);

  const { auth } = useSelector((store) => store);
  const { message: messageState } = useSelector((store) => store);
  const dispatch = useDispatch();

  const currentUser = auth?.user;
  const isOwnMessage = message?.sender?.id === currentUser?.id;
  const isEditingMessage = messageState?.editingMessage;

  if (!message) return null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  useEffect(() => {
    const decryptIfNeeded = async () => {
      if (!message?.content || message.messageType !== "TEXT") return;
      if (cryptoService.isEncrypted(message.content)) {
        setIsDecrypting(true);
        try {
          const parsed = cryptoService.parseEncryptedContent(message.content);
          if (
            parsed &&
            parsed.encryptedKeys &&
            parsed.encryptedContent &&
            parsed.iv
          ) {
            const myUserId = currentUser?.id?.toString();
            const myEncryptedKey = parsed.encryptedKeys[myUserId];
            if (myEncryptedKey) {
              const plainText = await cryptoService.decryptMessage(
                parsed.encryptedContent,
                myEncryptedKey,
                parsed.iv,
              );
              setDecryptedContent(plainText);
            } else {
              setDecryptedContent("[No decryption key for you]");
            }
          }
        } catch (error) {
          console.error("[E2EE] Decrypt error:", error);
          setDecryptedContent("[Decryption failed]");
        }
        setIsDecrypting(false);
      }
    };
    decryptIfNeeded();
  }, [message?.content, message?.messageType, currentUser?.id]);

  const displayContent =
    decryptedContent !== null ? decryptedContent : message?.content;

  useEffect(() => {
    if (decryptedContent !== null && !isEditing) {
      setEditContent(decryptedContent);
    }
  }, [decryptedContent]);

  const parseFileContent = (content) => {
    if (!content) return { url: "", fileName: "", fileSize: 0, caption: "" };
    const parts = content.split("|");
    return {
      url: parts[0] || "",
      fileName: parts[1] || "file",
      fileSize: parseInt(parts[2]) || 0,
      caption: parts[3] || "",
    };
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isImageMessage = message.messageType === "IMAGE";
  const isFileMessage = message.messageType === "FILE";
  const isMediaMessage = isImageMessage || isFileMessage;
  const fileData = isMediaMessage ? parseFileContent(message.content) : null;

  const getReplyPreview = (replyMsg) => {
    if (!replyMsg) return "";
    if (replyMsg.messageType === "IMAGE") return "📷 Photo";
    if (replyMsg.messageType === "FILE") {
      const parts = replyMsg.content?.split("|") || [];
      return "📎 " + (parts[1] || "File");
    }
    const text = replyMsg.content || "";
    return text.length > 60 ? text.substring(0, 60) + "..." : text;
  };

  const renderHighlightedText = (text) => {
    if (!highlightText || !text) return text;
    const regex = new RegExp(
      `(${highlightText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-300 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

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
    if (editContent.trim() && editContent.trim() !== displayContent) {
      try {
        let contentToSend = editContent.trim();
        if (encryptFn) {
          contentToSend = await encryptFn(contentToSend);
        }
        await dispatch(editMessage(message.id, contentToSend));
        setDecryptedContent(editContent.trim());
        setIsEditing(false);
        setShowOptions(false);
      } catch (error) {
        console.error("Error editing message:", error);
      }
    } else {
      setIsEditing(false);
      setEditContent(displayContent || message.content);
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
        "Are you sure you want to delete this message for yourself?",
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
    setEditContent(displayContent || message.content);
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
  const messageStyle = isOwnMessage ? "bg-[#d9fdd3]" : "bg-white";

  const DotsButton = () => (
    <div className="relative flex-shrink-0" ref={dropdownRef}>
      <div
        className={`transition-opacity ${
          (showOptions || showDropdown) && !isEditing
            ? "opacity-100"
            : "opacity-0"
        }`}
      >
        <BsThreeDotsVertical
          className="text-gray-400 hover:text-gray-600 cursor-pointer text-sm p-1"
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown((prev) => !prev);
          }}
        />
      </div>

      {/* Dropdown menu */}
      {showDropdown && (
        <div
          className={`absolute top-6 ${isOwnMessage ? "right-0" : "left-0"} bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[150px] z-30`}
        >
          <button
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
              setShowOptions(false);
              if (onReply) onReply(message);
            }}
          >
            <BsReply className="text-base" />
            <span>Reply</span>
          </button>

          {isOwnMessage && (
            <button
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                setIsEditing(true);
              }}
            >
              <MdEdit className="text-base" />
              <span>Edit</span>
            </button>
          )}

          {isOwnMessage && (
            <button
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                setShowOptions(false);
                handleDeleteMessage();
              }}
            >
              <MdDelete className="text-base" />
              <span>Delete</span>
            </button>
          )}

          <button
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
              setShowOptions(false);
              handleDeleteForMe();
            }}
          >
            <MdDeleteOutline className="text-base" />
            <span>Delete for me</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      id={messageDomId}
      className={`flex items-start max-w-[75%] ${isOwnMessage ? "self-end flex-row-reverse" : "self-start flex-row"}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => {
        if (!isEditing && !showDropdown) setShowOptions(false);
      }}
    >
      {/* Message bubble */}
      <div
        className={`py-2 px-3 rounded-lg ${messageStyle} shadow-sm relative`}
      >
        {/* Sender name for group chats (only for received messages) */}
        {!isOwnMessage && message.sender && (
          <div className="text-xs text-gray-600 mb-1 font-medium">
            {message.sender.fullName}
          </div>
        )}

        {/* Reply quote block */}
        {message.replyTo && (
          <div
            className="mb-2 p-2 bg-black/5 rounded-md cursor-pointer hover:bg-black/10 transition-colors"
            style={{ borderLeftWidth: "3px", borderLeftColor: "#22c55e" }}
            onClick={(e) => {
              e.stopPropagation();
              const targetEl = document.getElementById(
                `msg-${message.replyTo.id}`,
              );
              if (targetEl) {
                targetEl.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                targetEl.style.transition = "background-color 0.3s";
                targetEl.style.backgroundColor = "rgba(34, 197, 94, 0.15)";
                setTimeout(() => {
                  targetEl.style.backgroundColor = "transparent";
                }, 1500);
              }
            }}
          >
            <p className="text-xs font-semibold text-green-700 mb-0.5">
              {message.replyTo.sender?.fullName || "Unknown"}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {getReplyPreview(message.replyTo)}
            </p>
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
        ) : isImageMessage && fileData ? (
          <div>
            {/* Image message */}
            <div className="relative">
              {!imageLoaded && (
                <div className="w-48 h-32 bg-gray-200 rounded-md animate-pulse flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Loading...</span>
                </div>
              )}
              <img
                src={fileData.url}
                alt={fileData.fileName}
                className={`max-w-[280px] max-h-[300px] rounded-md cursor-pointer object-cover hover:opacity-90 transition-opacity ${
                  imageLoaded ? "" : "hidden"
                }`}
                onClick={() => setShowLightbox(true)}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </div>
            {fileData.caption && (
              <p className="text-sm mt-1 break-words whitespace-pre-wrap">
                {fileData.caption}
              </p>
            )}

            {/* Lightbox */}
            {showLightbox && (
              <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                onClick={() => setShowLightbox(false)}
              >
                <div className="relative max-w-[90vw] max-h-[90vh]">
                  <img
                    src={fileData.url}
                    alt={fileData.fileName}
                    className="max-w-full max-h-[90vh] object-contain rounded"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <a
                      href={fileData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={fileData.fileName}
                      className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 text-sm backdrop-blur-sm"
                      onClick={(e) => e.stopPropagation()}
                      title="Download"
                    >
                      ⬇
                    </a>
                    <button
                      className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 text-sm backdrop-blur-sm"
                      onClick={() => setShowLightbox(false)}
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : isFileMessage && fileData ? (
          <div>
            {/* File message */}
            <a
              href={fileData.url}
              target="_blank"
              rel="noopener noreferrer"
              download={fileData.fileName}
              className="flex items-center space-x-3 p-2 bg-white/50 rounded-lg hover:bg-white/80 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                📄
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-blue-600 truncate">
                  {fileData.fileName}
                </p>
                {fileData.fileSize > 0 && (
                  <p className="text-xs text-gray-500">
                    {formatFileSize(fileData.fileSize)}
                  </p>
                )}
              </div>
              <span className="text-gray-400 text-lg flex-shrink-0">⬇</span>
            </a>
            {fileData.caption && (
              <p className="text-sm mt-1 break-words whitespace-pre-wrap">
                {fileData.caption}
              </p>
            )}
          </div>
        ) : (
          <div>
            {isDecrypting ? (
              <p className="text-sm text-gray-400 italic">Decrypting...</p>
            ) : (
              <p className="text-sm break-words whitespace-pre-wrap">
                {highlightText
                  ? renderHighlightedText(displayContent)
                  : displayContent}
              </p>
            )}

            {/* Message edited indicator */}
            {message.updatedAt && message.updatedAt !== message.createdAt && (
              <span className="text-xs text-gray-400 italic ml-2">edited</span>
            )}
          </div>
        )}

        {/* Message metadata */}
        <div
          className={`flex items-center mt-1 space-x-1 text-xs text-gray-500 ${
            isOwnMessage ? "justify-end" : "justify-start"
          }`}
        >
          <span>{formatTimestamp(message.createdAt)}</span>

          {/* Message status for own messages */}
          {isOwnMessage && (
            <span>
              {message.status === "SENDING" ||
              message.status === "UPLOADING" ? (
                <span className="text-gray-400" title="Sending...">
                  ⏳
                </span>
              ) : message.status === "FAILED" ? (
                <span className="text-red-500" title="Failed to send">
                  ✗
                </span>
              ) : message.readStatuses && message.readStatuses.length > 0 ? (
                <span className="text-blue-500" title="Read">
                  ✓✓
                </span>
              ) : (
                <span className="text-gray-400" title="Sent">
                  ✓
                </span>
              )}
            </span>
          )}
        </div>

        {/* Retry button for failed messages */}
        {message.status === "FAILED" && isOwnMessage && (
          <div className="mt-1">
            <span className="text-xs text-red-500">Failed to send. </span>
            <button
              className="text-xs text-blue-500 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
      {/* end bubble */}

      {/* Dots button - outside bubble */}
      <DotsButton />
    </div>
  );
};

export default MessageCard;
