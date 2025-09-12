import React from 'react';
import type { IFrontendTask } from '../types';

interface BusinessVolunteerDisplayProps {
  task: IFrontendTask;
}

const BusinessVolunteerDisplay: React.FC<BusinessVolunteerDisplayProps> = ({ task }) => {
  // Don't show anything if no business contact has been attempted
  if (!task.businessContactAttempted) {
    return null;
  }

  return (
    <div className="mt-4">
      {task.businessVolunteerInfo ? (
        // Business volunteer has been assigned
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <span className="text-blue-600 text-lg mr-2">🏢</span>
            <b className="text-blue-800">Business Volunteer Assigned</b>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-blue-700">Volunteer:</span>
              <p className="text-blue-600">{task.businessVolunteerInfo.volunteerName}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Phone:</span>
              <p className="text-blue-600">
                <a href={`tel:${task.businessVolunteerInfo.volunteerPhone}`} className="hover:underline">
                  {task.businessVolunteerInfo.volunteerPhone}
                </a>
              </p>
            </div>
            {task.businessVolunteerInfo.volunteerEmail && (
              <div>
                <span className="font-medium text-blue-700">Email:</span>
                <p className="text-blue-600">
                  <a href={`mailto:${task.businessVolunteerInfo.volunteerEmail}`} className="hover:underline">
                    {task.businessVolunteerInfo.volunteerEmail}
                  </a>
                </p>
              </div>
            )}
            <div>
              <span className="font-medium text-blue-700">Business:</span>
              <p className="text-blue-600">{task.businessVolunteerInfo.businessName}</p>
            </div>
            {task.businessVolunteerInfo.estimatedArrival && (
              <div className="md:col-span-2">
                <span className="font-medium text-blue-700">Estimated Arrival:</span>
                <p className="text-blue-600">
                  {new Date(task.businessVolunteerInfo.estimatedArrival).toLocaleString()}
                </p>
              </div>
            )}
            <div className="md:col-span-2">
              <span className="font-medium text-blue-700">Business Contact:</span>
              <p className="text-blue-600">
                <a href={`tel:${task.businessVolunteerInfo.businessContact}`} className="hover:underline">
                  {task.businessVolunteerInfo.businessContact}
                </a>
              </p>
            </div>
          </div>
          {task.businessVolunteerInfo.assignedAt && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-600">
                Assigned on {new Date(task.businessVolunteerInfo.assignedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      ) : task.businessContactedAt ? (
        // Business has been contacted but no volunteer assigned yet
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-yellow-600 text-lg mr-2">⏳</span>
            <b className="text-yellow-800">Business Contacted</b>
          </div>
          <p className="text-yellow-700 text-sm">
            We've contacted local businesses to provide a volunteer for this task. 
            They should respond within a few hours.
          </p>
          <p className="text-xs text-yellow-600 mt-2">
            Contacted on {new Date(task.businessContactedAt).toLocaleString()}
          </p>
        </div>
      ) : (
        // Business contact attempted but not yet contacted (shouldn't normally happen)
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-orange-600 text-lg mr-2">🔍</span>
            <b className="text-orange-800">Looking for Business Partners</b>
          </div>
          <p className="text-orange-700 text-sm">
            No volunteers found yet. We're working to connect you with local business partners.
          </p>
        </div>
      )}
    </div>
  );
};

export default BusinessVolunteerDisplay;