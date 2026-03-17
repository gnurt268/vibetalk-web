import React, { useState, useEffect } from "react";
import { BsArrowLeft } from "react-icons/bs";
import { AiOutlineSearch } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { searchUser } from "../../redux/Auth/Action";
import { findPrivateChat, createPrivateChat } from "../../redux/Chat/Action";

const StartNewChat = ({ onBack }) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const dispatch = useDispatch();
  const auth = useSelector((store) => store.auth);
  const chat = useSelector((store) => store.chat);
  const currentUser = auth?.user;
  const isCreatingChat = chat?.isCreatingChat;
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
        (user) => user.id !== currentUser?.id,
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = async (user) => {
    try {
      const existingChat = await dispatch(findPrivateChat(user.id));

      if (existingChat) {
        onBack();
        return;
      }
    } catch (error) {
      try {
        await dispatch(createPrivateChat(user.id));
        onBack();
      } catch (createError) {
        console.error("Error creating private chat:", createError);
        alert("Failed to start chat. Please try again.");
      }
    }
  };

  return (
    <div className="w-full h-full bg-white">
      {/* Header */}
      <div className="flex items-center space-x-10 bg-[#008069] text-white pt-11 px-10 pb-5">
        <BsArrowLeft
          size={20}
          className="cursor-pointer text-2xl font-bold"
          onClick={onBack}
        />
        <p className="cursor-pointer font-semibold text-lg">Start New Chat</p>
      </div>

      {/* Search Bar */}
      <div className="relative bg-white py-4 px-3 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search people..."
            className="w-full outline-none border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {!query && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-gray-400 text-center">
              <AiOutlineSearch className="text-6xl mb-4 mx-auto" />
              <p className="text-lg">Search for people to start chatting</p>
              <p className="text-sm mt-2">
                Enter a name or username to find contacts
              </p>
            </div>
          </div>
        )}

        {query && isSearching && (
          <div className="flex justify-center items-center h-20">
            <div className="text-gray-500">Searching...</div>
          </div>
        )}

        {query && !isSearching && searchResults.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32">
            <p className="text-gray-500">No users found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try searching with a different name
            </p>
          </div>
        )}

        {searchResults.map((user) => (
          <div
            key={user.id}
            onClick={() => handleStartChat(user)}
            className="flex items-center py-4 px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
          >
            <div className="flex-shrink-0">
              <img
                className="h-12 w-12 rounded-full object-cover"
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

            <div className="flex-1 ml-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-medium text-gray-900">
                  {user.fullName}
                </p>
                {isCreatingChat && (
                  <div className="text-sm text-green-600">Starting chat...</div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">@{user.username}</p>
              {user.email && (
                <p className="text-xs text-gray-400 mt-1">{user.email}</p>
              )}
            </div>

            <div className="flex-shrink-0 ml-4">
              <div className="text-green-600 text-sm font-medium">Chat</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StartNewChat;
