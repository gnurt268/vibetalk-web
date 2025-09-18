export const selectMessagesByChat = (state, chatId) => {
  try {
    if (!state) {
      console.warn("State is undefined");
      return [];
    }

    if (!state.message) {
      console.warn("state.message is undefined");
      return [];
    }

    if (!state.message.messagesByChat) {
      console.warn("state.message.messagesByChat is undefined");
      return [];
    }

    const result = state.message.messagesByChat[chatId]?.messages || [];
    return result;
  } catch (error) {
    console.error("Error in selectMessagesByChat:", error);
    return [];
  }
};

export const selectChatHasMoreMessages = (state, chatId) => {
  if (!state?.message?.messagesByChat) return false;
  return state.message.messagesByChat[chatId]?.hasMore || false;
};

export const selectMessageCount = (state, chatId) => {
  if (!state?.message?.messageCounts) return 0;
  return state.message.messageCounts[chatId] || 0;
};

export const selectSearchResults = (state, chatId) => {
  if (!state?.message?.searchResults) return [];
  return state.message.searchResults[chatId]?.results || [];
};

export const selectTypingUsers = (state, chatId) => {
  if (!state?.message?.typingUsers) return [];
  return state.message.typingUsers[chatId] || [];
};

export const selectMessageDraft = (state, chatId) => {
  try {
    if (!state) {
      console.warn("State is undefined in selectMessageDraft");
      return "";
    }

    if (!state.message) {
      console.warn("state.message is undefined in selectMessageDraft");
      return "";
    }

    if (!state.message.messageDrafts) {
      console.warn(
        "state.message.messageDrafts is undefined in selectMessageDraft"
      );
      return "";
    }

    const result = state.message.messageDrafts[chatId] || "";
    return result;
  } catch (error) {
    console.error("Error in selectMessageDraft:", error);
    return "";
  }
};

export const selectMessagePermissions = (state, messageId) => {
  if (!state?.message?.messagePermissions) {
    return { canEdit: false, canDelete: false };
  }
  return (
    state.message.messagePermissions[messageId] || {
      canEdit: false,
      canDelete: false,
    }
  );
};

export const selectIsMessageRead = (state, messageId) => {
  if (!state?.message?.readMessages) return false;
  return state.message.readMessages.has(messageId);
};

export const selectMessagesByPage = (state, chatId, page = 0) => {
  if (!state?.message?.messagesByChat) return [];

  const chatMessages = state.message.messagesByChat[chatId];
  if (!chatMessages) return [];

  const pageSize = 50;
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;

  return chatMessages.messages.slice(startIndex, endIndex);
};

export const selectLastMessage = (state, chatId) => {
  const messages = selectMessagesByChat(state, chatId);
  return messages.length > 0 ? messages[messages.length - 1] : null;
};

export const selectUnreadMessageCount = (state, chatId) => {
  return 0;
};

export const getUnreadCount = async (chatId, token) => {
  try {
    const response = await fetch(`/api/chats/${chatId}/unread-count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const count = await response.json();
    return count;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
};
