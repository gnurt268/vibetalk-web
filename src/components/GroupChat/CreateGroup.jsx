import React, { useState, useEffect } from "react";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import SelectedMember from "./SelectedMember";
import ChatCard from "../ChatCard/ChatCard";
import NewGroup from "./NewGroup";
import { searchUser } from "../../redux/Auth/Action";

const CreateGroup = ({ onBack, onGroupCreated }) => {
  const [newGroup, setNewGroup] = useState(false);
  const [groupMembers, setGroupMembers] = useState(new Set());
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const dispatch = useDispatch();
  const auth = useSelector((store) => store.auth);
  const currentUser = auth?.user;
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem("token");
      const results = await dispatch(
        searchUser({ keyword: searchQuery }, token),
      );
      const filteredResults = results.filter(
        (user) =>
          user.id !== currentUser?.id &&
          !Array.from(groupMembers).some((member) => member.id === user.id),
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = (user) => {
    const newMembers = new Set(groupMembers);
    newMembers.add(user);
    setGroupMembers(newMembers);
    setQuery("");
    setSearchResults([]);
  };

  const handleRemoveMember = (member) => {
    const newMembers = new Set(groupMembers);
    newMembers.delete(member);
    setGroupMembers(newMembers);
  };

  const handleNavigate = () => {
    onBack();
  };

  const handleBackFromNewGroup = () => {
    setNewGroup(false);
  };

  const canProceed = groupMembers.size >= 2;

  return (
    <div className="w-full h-full">
      {!newGroup && (
        <div>
          <div className="flex items-center space-x-10 bg-[#008069] text-white pt-11 px-10 pb-5">
            <BsArrowLeft
              size={20}
              className="cursor-pointer text-2xl font-bold"
              onClick={handleNavigate}
            />
            <p className="cursor-pointer font-semibold">Add Group Members</p>
          </div>

          {/* Selected Members */}
          <div className="relative bg-white py-4 px-3">
            <div className="flex space-x-2 flex-wrap space-y-1">
              {groupMembers.size > 0 &&
                Array.from(groupMembers).map((item) => (
                  <SelectedMember
                    key={item.id}
                    handleRemoveMember={() => handleRemoveMember(item)}
                    member={item}
                  />
                ))}
            </div>

            {/* Search Input */}
            <input
              type="text"
              onChange={(e) => setQuery(e.target.value)}
              className="outline-none border-b border-gray-400 p-2 w-[93%] mt-2"
              placeholder="Search for members"
              value={query}
            />

            {/* Member count indicator */}
            <div className="mt-2 text-sm text-gray-600">
              {groupMembers.size > 0 && (
                <span>
                  Selected: {groupMembers.size} member
                  {groupMembers.size > 1 ? "s" : ""}
                </span>
              )}
              {canProceed && (
                <span className="text-green-600 ml-2">
                  ✓ Ready to create group
                </span>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="bg-white overflow-y-scroll h-[50vh]">
            {isSearching && (
              <div className="flex justify-center items-center h-20">
                <div className="text-gray-500">Searching...</div>
              </div>
            )}

            {!isSearching && query && searchResults.length === 0 && (
              <div className="flex justify-center items-center h-20">
                <div className="text-gray-500">No users found</div>
              </div>
            )}

            {searchResults.map((user) => (
              <div
                onClick={() => handleAddMember(user)}
                key={user.id}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <hr className="border-gray-100" />
                <div className="flex items-center justify-center py-2 group">
                  <div className="w-[20%] flex justify-center items-center">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={
                        user.urlAvatar ||
                        "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
                      }
                      alt="profile"
                      onError={(e) => {
                        e.target.src =
                          "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png";
                      }}
                    />
                  </div>
                  <div className="w-[80%] pl-3">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-medium">{user.fullName}</p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-gray-600">@{user.username}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next Button */}
          <div className="bottom-10 py-10 bg-slate-200 flex items-center justify-center">
            <div
              className={`rounded-full p-4 cursor-pointer transition-all ${
                canProceed
                  ? "bg-green-600 hover:bg-green-700 shadow-lg"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={() => canProceed && setNewGroup(true)}
              title={
                canProceed
                  ? "Create group"
                  : "Select at least 2 members to create a group"
              }
            >
              <BsArrowRight className="text-white font-bold text-3xl" />
            </div>
          </div>
        </div>
      )}

      {newGroup && (
        <div>
          <NewGroup
            onBack={handleBackFromNewGroup}
            onGroupCreated={onGroupCreated}
            selectedMembers={Array.from(groupMembers)}
          />
        </div>
      )}
    </div>
  );
};

export default CreateGroup;
