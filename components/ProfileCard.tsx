

import React from 'react';
import { ProfileStats } from '../types'; // ProfileStats is now correctly imported
import { AR_LABELS } from '../constants';

interface ProfileCardProps {
  name: string;
  title: string;
  stats: ProfileStats;
  profileLink: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ name, title, stats, profileLink }) => {
  return (
    <div className="bg-white rounded-lg shadow-xl p-6 mr-6 -mt-20 w-80 text-center relative z-10">
      <img
        src="https://picsum.photos/100/100?random=4"
        alt={name}
        className="w-24 h-24 rounded-full mx-auto border-4 border-white object-cover -mt-16 shadow-lg"
      />
      <h3 className="text-xl font-bold text-gray-800 mt-4">{name}</h3>
      <p className="text-orange-500 text-sm">{title}</p>

      <div className="mt-6 border-t border-b border-gray-200 py-4 text-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span>{AR_LABELS.opportunitiesApplied}</span>
          <span className="font-semibold text-gray-900">{stats.applied}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span>{AR_LABELS.opportunitiesWon}</span>
          <span className="font-semibold text-gray-900">{stats.won}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>{AR_LABELS.currentOpportunities}</span>
          <span className="font-semibold text-gray-900">{stats.current}</span>
        </div>
      </div>

      <button className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200">
        {AR_LABELS.viewPublicProfile}
      </button>

      <div className="mt-4 text-sm text-gray-500">
        <a href={profileLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {profileLink}
        </a>
        <button
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          onClick={() => navigator.clipboard.writeText(profileLink)}
          aria-label="نسخ الرابط"
        >
          <svg className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-4 2a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;