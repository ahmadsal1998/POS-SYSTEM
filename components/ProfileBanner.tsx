

import React from 'react';
import { AR_LABELS } from '../constants';

const ProfileBanner: React.FC = () => {
  return (
    <div
      className="relative w-full h-48 bg-cover bg-center rounded-lg shadow-md"
      style={{ backgroundImage: 'url(https://picsum.photos/1200/400?random=2)' }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
      <div className="relative h-full flex items-center justify-start p-6 text-white text-right">
        <div>
          <h2 className="text-3xl font-bold mb-2">{AR_LABELS.healthyFood}</h2>
          <div className="flex items-center justify-end space-x-2 space-x-reverse mb-4">
            <img src="https://picsum.photos/40/40?random=3" alt="Harumi Kobayashi" className="w-10 h-10 rounded-full border-2 border-white" />
            <span className="text-lg font-semibold">Harumi Kobayashi</span>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{AR_LABELS.followMe}</p>
            <p>areallygreatsite.com</p>
            <p>+123-456-7890</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBanner;