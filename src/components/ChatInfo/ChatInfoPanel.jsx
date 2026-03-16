import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IoClose, IoCamera } from "react-icons/io5";
import { MdEdit, MdPersonRemove, MdAdminPanelSettings, MdPersonAdd } from "react-icons/md";
import {
  removeUserFromGroup,
  makeAdmin,
  removeAdmin,
  addUserToGroup,
} from "../../redux/Chat/Action";
import { searchUser } from "../../redux/Auth/Action";
import api from "../../config/api";

const ChatInfoPanel = ({ chat, onClose }) => {
  const dispatch = useDispatch();
  const { auth } = useSelector((store) => store);
  const currentUser = auth?.user;

  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(chat?.chatName || "");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!chat) return null;

  const isGroupChat = chat.groupChat;
  const isOwner = chat.createdBy?.id === currentUser?.id;
  const isAdmin = isOwner || chat.admins?.some((a) => a.id === currentUser?.id);
  const members = chat.members || [];

  const otherUser = !isGroupChat
    ? members.find((m) => m.id !== currentUser?.id)
    : null;

  // ===== GROUP: Rename =====
  const handleRenameGroup = async () => {
    if (!groupName.trim() || groupName === chat.chatName) {
      setIsEditingName(false);
      setGroupName(chat.chatName);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await api.put(`/api/chats/${chat.id}/name`, groupName.trim(), {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
      });
      setIsEditingName(false);
      // Refresh chats
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to rename");
    }
  };

  // ===== GROUP: Change avatar =====
  const handleChangeGroupAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // 1. Upload image
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("token");
      const uploadRes = await api.post("/api/users/upload-avatar", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      const imageUrl = uploadRes.data.imageUrl;
      // 2. Update group image
      await api.put(`/api/chats/${chat.id}/image`, imageUrl, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
      });
      window.location.reload();
    } catch (error) {
      alert("Failed to update group avatar");
    }
    e.target.value = "";
  };

  // ===== GROUP: Kick member =====
  const handleKickMember = async (userId) => {
    const member = members.find((m) => m.id === userId);
    if (!window.confirm(`Remove ${member?.fullName || "this user"} from group?`)) return;
    try {
      await dispatch(removeUserFromGroup(chat.id, userId));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove member");
    }
  };

  // ===== GROUP: Toggle admin =====
  const handleToggleAdmin = async (userId) => {
    const isUserAdmin = chat.admins?.some((a) => a.id === userId);
    try {
      if (isUserAdmin) {
        await dispatch(removeAdmin(chat.id, userId));
      } else {
        await dispatch(makeAdmin(chat.id, userId));
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update admin");
    }
  };

  // ===== GROUP: Add member =====
  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await dispatch(searchUser({ keyword: query }, localStorage.getItem("token")));
      const filtered = (res || []).filter(
        (u) => !members.some((m) => m.id === u.id)
      );
      setSearchResults(filtered);
    } catch {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const handleAddMember = async (userId) => {
    try {
      await dispatch(addUserToGroup(chat.id, userId));
      setSearchResults(searchResults.filter((u) => u.id !== userId));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add member");
    }
  };

  // ===== 1-1: Nickname =====
  const handleSaveNickname = async () => {
    // TODO: implement nickname API endpoint if needed
    setIsEditingNickname(false);
    alert("Nickname feature coming soon!");
  };

  return (
    <div className="w-[320px] h-full bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">
          {isGroupChat ? "Group Info" : "Chat Info"}
        </h3>
        <IoClose
          className="text-xl text-gray-500 cursor-pointer hover:text-gray-800"
          onClick={onClose}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center py-6 px-4">
          <div className="relative">
            <img
              className="w-20 h-20 rounded-full object-cover"
              src={
                isGroupChat
                  ? chat.chatImage || "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
                  : otherUser?.urlAvatar || "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
              }
              alt="avatar"
            />
            {isGroupChat && isAdmin && (
              <label className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-green-600">
                <IoCamera className="text-sm" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleChangeGroupAvatar}
                />
              </label>
            )}
          </div>

          {/* Name */}
          {isGroupChat ? (
            <div className="mt-3 flex items-center space-x-2">
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-green-500"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameGroup();
                      if (e.key === "Escape") { setIsEditingName(false); setGroupName(chat.chatName); }
                    }}
                    autoFocus
                  />
                  <button
                    className="text-xs text-green-600 hover:underline"
                    onClick={handleRenameGroup}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <h4 className="text-lg font-semibold">{chat.chatName}</h4>
                  {isAdmin && (
                    <MdEdit
                      className="text-gray-400 cursor-pointer hover:text-gray-600"
                      onClick={() => setIsEditingName(true)}
                    />
                  )}
                </>
              )}
            </div>
          ) : (
            <h4 className="mt-3 text-lg font-semibold">{otherUser?.fullName}</h4>
          )}

          {isGroupChat && (
            <p className="text-sm text-gray-500 mt-1">{members.length} members</p>
          )}
          {!isGroupChat && otherUser?.email && (
            <p className="text-sm text-gray-500 mt-1">{otherUser.email}</p>
          )}
        </div>

        {/* 1-1: Nickname */}
        {!isGroupChat && (
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Nickname</span>
              <button
                className="text-xs text-green-600 hover:underline"
                onClick={() => setIsEditingNickname(true)}
              >
                {isEditingNickname ? "" : "Edit"}
              </button>
            </div>
            {isEditingNickname ? (
              <div className="flex items-center space-x-2 mt-2">
                <input
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-green-500"
                  placeholder="Set a nickname..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveNickname();
                    if (e.key === "Escape") setIsEditingNickname(false);
                  }}
                  autoFocus
                />
                <button className="text-xs text-green-600 hover:underline" onClick={handleSaveNickname}>Save</button>
                <button className="text-xs text-gray-500 hover:underline" onClick={() => setIsEditingNickname(false)}>Cancel</button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-1 italic">No nickname set</p>
            )}
          </div>
        )}

        {/* E2EE indicator */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-green-500">🔒</span>
            <div>
              <p className="text-sm font-medium text-gray-700">End-to-end encrypted</p>
              <p className="text-xs text-gray-500">Messages are secured with E2EE</p>
            </div>
          </div>
        </div>

        {/* Group: Members list */}
        {isGroupChat && (
          <div className="border-t border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">Members</span>
              {isAdmin && (
                <button
                  className="flex items-center space-x-1 text-xs text-green-600 hover:underline"
                  onClick={() => setShowAddMember((prev) => !prev)}
                >
                  <MdPersonAdd className="text-sm" />
                  <span>Add</span>
                </button>
              )}
            </div>

            {/* Add member search */}
            {showAddMember && isAdmin && (
              <div className="px-4 pb-3">
                <input
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-green-500"
                  placeholder="Search users to add..."
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                />
                {isSearching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center space-x-2">
                      <img
                        className="w-8 h-8 rounded-full object-cover"
                        src={user.urlAvatar || "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"}
                        alt=""
                      />
                      <div>
                        <p className="text-sm font-medium">{user.fullName}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      onClick={() => handleAddMember(user.id)}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Members list */}
            <div className="px-4 pb-4">
              {members.map((member) => {
                const isMemberOwner = chat.createdBy?.id === member.id;
                const isMemberAdmin = chat.admins?.some((a) => a.id === member.id);
                const isMe = member.id === currentUser?.id;

                return (
                  <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
                    <div className="flex items-center space-x-2">
                      <img
                        className="w-9 h-9 rounded-full object-cover"
                        src={member.urlAvatar || "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"}
                        alt=""
                      />
                      <div>
                        <div className="flex items-center space-x-1">
                          <p className="text-sm font-medium">
                            {member.fullName}{isMe ? " (You)" : ""}
                          </p>
                          {isMemberOwner && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Owner</span>
                          )}
                          {isMemberAdmin && !isMemberOwner && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Admin</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">@{member.username}</p>
                      </div>
                    </div>

                    {/* Admin actions */}
                    {isAdmin && !isMe && !isMemberOwner && (
                      <div className="flex space-x-1">
                        {isOwner && (
                          <button
                            className={`p-1.5 rounded-full hover:bg-gray-100 ${isMemberAdmin ? "text-blue-500" : "text-gray-400"}`}
                            title={isMemberAdmin ? "Remove admin" : "Make admin"}
                            onClick={() => handleToggleAdmin(member.id)}
                          >
                            <MdAdminPanelSettings className="text-base" />
                          </button>
                        )}
                        <button
                          className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
                          title="Remove from group"
                          onClick={() => handleKickMember(member.id)}
                        >
                          <MdPersonRemove className="text-base" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInfoPanel;