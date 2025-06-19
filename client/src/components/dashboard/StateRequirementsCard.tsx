import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppSettings } from "@shared/schema";

interface StateRequirement {
  totalCCH: number;
  directCCH: number;
  supervisionHours: number;
  ethicsHours: number;
  specialRequirements: string[];
  state: string;
  licenseType: string;
}

interface StateRequirementsCardProps {
  settings?: AppSettings | null;
  currentHours: number;
  category: "direct_hours" | "supervision" | "total_hours";
}

const STATE_REQUIREMENTS: Record<string, Record<string, StateRequirement>> = {
  "Arkansas": {
    "LPC": {
      totalCCH: 3000,
      directCCH: 1900,
      supervisionHours: 150,
      ethicsHours: 6,
      specialRequirements: [
        "Must complete 3000 supervised hours total",
        "1900 hours must be direct client contact",
        "Supervision by Board-approved supervisor required",
        "Minimum 2-year timeframe for completion",
        "At least 100 hours individual supervision"
      ],
      state: "Arkansas",
      licenseType: "LPC"
    }
  },
  "Texas": {
    "LPC": {
      totalCCH: 4000,
      directCCH: 3000,
      supervisionHours: 200,
      ethicsHours: 6,
      specialRequirements: [
        "Must complete 3000 direct client contact hours",
        "Supervision must be provided by LPC-S",
        "Maximum 1000 hours can be indirect client contact",
        "At least 100 hours must be individual supervision"
      ],
      state: "Texas",
      licenseType: "LPC"
    }
  },
  "California": {
    "LMFT": {
      totalCCH: 4000,
      directCCH: 3000,
      supervisionHours: 200,
      ethicsHours: 10,
      specialRequirements: [
        "Must complete 3000 direct client contact hours",
        "Supervision by Board-approved supervisor",
        "104 weeks of supervised experience minimum",
        "At least 52 weeks must be post-degree"
      ],
      state: "California",
      licenseType: "LMFT"
    }
  }
};

export const StateRequirementsCard = ({ settings, currentHours, category }: StateRequirementsCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get state from settings, default to a common state for demo
  const userState = settings?.goals?.stateRegion || "Arkansas";
  const licenseType = "LPC"; // Could be derived from user profile in the future
  
  const requirements = STATE_REQUIREMENTS[userState]?.[licenseType];
  
  if (!requirements) {
    return null; // Don't show if we don't have requirements for this state
  }

  const getRelevantInfo = () => {
    switch (category) {
      case "direct_hours":
        return {
          title: `${userState} LPC Direct Hours Requirement`,
          current: currentHours,
          required: requirements.directCCH,
          description: `In ${userState}, Licensed Professional Counselors must complete ${requirements.directCCH} direct client contact hours as part of their ${requirements.totalCCH} total supervised hours.`,
          keyPoints: [
            `${requirements.directCCH} direct client contact hours required`,
            `Part of ${requirements.totalCCH} total supervised hours`,
            `Supervised by Board-approved supervisor`,
            `Minimum 2-year completion timeframe`
          ]
        };
      case "supervision":
        return {
          title: `${userState} LPC Supervision Requirement`,
          current: currentHours,
          required: requirements.supervisionHours,
          description: `${userState} requires ${requirements.supervisionHours} hours of clinical supervision during your path to licensure.`,
          keyPoints: [
            `${requirements.supervisionHours} supervision hours required`,
            `At least 100 hours individual supervision`,
            `Remaining hours can be group supervision`,
            `Must be provided by Board-approved supervisor`
          ]
        };
      case "total_hours":
        return {
          title: `${userState} LPC Total Hours Requirement`,
          current: currentHours,
          required: requirements.totalCCH,
          description: `${userState} requires ${requirements.totalCCH} total supervised hours for LPC licensure, with ${requirements.directCCH} being direct client contact.`,
          keyPoints: [
            `${requirements.totalCCH} total supervised hours`,
            `${requirements.directCCH} must be direct client contact`,
            `${requirements.totalCCH - requirements.directCCH} can be indirect hours`,
            `${requirements.supervisionHours} supervision hours included`
          ]
        };
      default:
        return null;
    }
  };

  const info = getRelevantInfo();
  if (!info) return null;

  const progressPercentage = Math.min((info.current / info.required) * 100, 100);

  return (
    <Card className="bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left group hover:bg-blue-100/50 dark:hover:bg-blue-900/20 rounded-lg p-2 -m-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {info.title}
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3 text-sm">
            <p className="text-blue-800 dark:text-blue-200">
              {info.description}
            </p>
            
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  Your Progress
                </span>
                <span className="text-blue-900 dark:text-blue-100 font-bold">
                  {info.current} / {info.required} hours
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {progressPercentage.toFixed(1)}% complete
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-blue-700 dark:text-blue-300 font-medium">
                Key Requirements:
              </p>
              <ul className="space-y-1">
                {info.keyPoints.map((point, index) => (
                  <li key={index} className="text-blue-700 dark:text-blue-300 text-xs flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-xs text-blue-600 dark:text-blue-500 bg-blue-100/50 dark:bg-blue-900/30 rounded p-2">
              <strong>Note:</strong> Requirements may vary by specialization and can change. 
              Always verify current requirements with the {userState} licensing board.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};