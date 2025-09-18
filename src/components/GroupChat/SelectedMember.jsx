import React from "react";
import { AiOutlineClose } from "react-icons/ai";

const SelectedMember = ({ member, handleRemoveMember }) => {
  if (!member) return null;

  return (
    <div className="flex items-center bg-blue-100 hover:bg-blue-200 rounded-full px-3 py-1 m-1 transition-colors">
      <img
        className="h-6 w-6 rounded-full object-cover mr-2"
        src={
          member.urlAvatar ||
          "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
        }
        alt="member avatar"
        onError={(e) => {
          e.target.src = "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png";
        }}
      />
      <span className="text-sm font-medium text-blue-800 mr-2">
        {member.fullName || member.username}
      </span>
      <AiOutlineClose
        className="h-4 w-4 text-blue-600 cursor-pointer hover:text-blue-800 transition-colors"
        onClick={handleRemoveMember}
      />
    </div>
  );
};

export default SelectedMember;