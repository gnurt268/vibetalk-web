import { CircularProgress } from "@mui/material";
import React, { useState } from "react";
import { BsArrowLeft } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { createGroupChat } from "../../redux/Chat/Action";
import { fileUploadApi } from "../../config/api";

const NewGroup = ({ onBack, onGroupCreated, selectedMembers = [] }) => {
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const dispatch = useDispatch();
  const auth = useSelector((store) => store.auth);
  const chat = useSelector((store) => store.chat);
  const currentUser = auth?.user;
  const isLoadingChat = chat?.isCreatingChat;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsImageUploaded(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fileUploadApi.post(
          "/api/users/upload-avatar",
          formData,
        );

        const cloudinaryUrl = response.data.imageUrl;
        setGroupImage(cloudinaryUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
        setGroupImage("");
      } finally {
        setIsImageUploaded(false);
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    if (selectedMembers.length < 2) {
      alert("Please select at least 2 members for the group");
      return;
    }

    setIsCreating(true);
    try {
      const groupData = {
        chatName: groupName.trim(),
        chatImage: groupImage || null,
        userIds: selectedMembers.map((member) => member.id),
      };

      const newGroup = await dispatch(createGroupChat(groupData));

      if (onGroupCreated) {
        onGroupCreated();
      } else {
        onBack();
      }
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleNavigate = () => {
    onBack();
  };

  return (
    <div className="w-full h-full">
      <div className="flex items-center space-x-10 bg-[#008069] text-white pt-11 px-10 pb-5">
        <BsArrowLeft
          size={20}
          className="cursor-pointer text-2xl font-bold"
          onClick={handleNavigate}
        />
        <p className="text-xl font-semibold">New Group</p>
      </div>

      <div className="flex flex-col justify-center items-center my-12">
        <label htmlFor="avtGroupInput" className="relative">
          <img
            src={
              groupImage ||
              "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
            }
            alt="group avatar"
            className="rounded-full w-[15vw] h-[15vw] cursor-pointer object-cover border-4 border-gray-200 hover:border-green-500 transition-colors"
          />
          {isImageUploaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
              <CircularProgress className="text-white" />
            </div>
          )}
        </label>
        <input
          type="file"
          id="avtGroupInput"
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <p className="text-lg font-semibold mt-4 text-gray-700">
          {groupImage ? "Change Group Photo" : "Add Group Photo"}
        </p>
      </div>

      <div className="w-full flex justify-between items-center py-2 px-5">
        <input
          type="text"
          placeholder="Group Subject"
          className="w-[90%] border-b-2 border-gray-300 outline-none text-2xl font-semibold px-5 py-3 focus:border-green-500 transition-colors"
          maxLength={25}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          disabled={isCreating || isLoadingChat}
        />
      </div>

      <div className="px-10 text-sm text-gray-500">
        {groupName.length}/25 characters
      </div>

      <div className="px-5 mt-6">
        <p className="text-lg font-semibold mb-3 text-gray-700">
          Members ({selectedMembers.length + 1}):
        </p>
        <div className="max-h-32 overflow-y-auto">
          <div className="flex items-center py-2 px-3 bg-green-50 rounded-lg mb-2">
            <img
              className="h-8 w-8 rounded-full object-cover mr-3"
              src={
                currentUser?.urlAvatar ||
                "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
              }
              alt="profile"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {currentUser?.fullName} (You)
              </p>
              <p className="text-xs text-green-600">Admin</p>
            </div>
          </div>

          {selectedMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center py-2 px-3 bg-gray-50 rounded-lg mb-2"
            >
              <img
                className="h-8 w-8 rounded-full object-cover mr-3"
                src={
                  member.urlAvatar ||
                  "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
                }
                alt="profile"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{member.fullName}</p>
                <p className="text-xs text-gray-500">@{member.username}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full flex justify-center mt-8 px-5">
        <button
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || isCreating || isLoadingChat}
          className={`px-8 py-3 rounded-lg font-semibold text-white text-lg transition-all duration-200 flex items-center space-x-2 ${
            groupName.trim() && !isCreating && !isLoadingChat
              ? "bg-[#008069] hover:bg-[#006b5b] cursor-pointer shadow-md hover:shadow-lg"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {(isCreating || isLoadingChat) && (
            <CircularProgress size={20} className="text-white" />
          )}
          <span>
            {isCreating || isLoadingChat ? "Creating Group..." : "Create Group"}
          </span>
        </button>
      </div>

      <div className="px-5 mt-6 text-sm text-gray-500">
        <p className="mb-2">• Only admins can change group info</p>
        <p className="mb-2">• All members can send messages</p>
        <p>• You can add more members later</p>
      </div>
    </div>
  );
};

export default NewGroup;
