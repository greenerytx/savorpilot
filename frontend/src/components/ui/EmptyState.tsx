import { Link } from 'react-router-dom';
import { Button } from './Button';

interface EmptyStateProps {
  illustration: 'recipes' | 'collections' | 'search' | 'cooking' | 'pantry';
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

// Warm, delightful SVG illustrations with subtle animations
const illustrations = {
  recipes: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Warm background glow */}
      <ellipse cx="100" cy="90" rx="70" ry="50" fill="url(#warmGlow)" opacity="0.3"/>

      {/* Cookbook with warm tones */}
      <rect x="50" y="40" width="100" height="80" rx="6" fill="#fff8f0" stroke="#c9533a" strokeWidth="2"/>
      <rect x="50" y="40" width="50" height="80" rx="6" fill="#fffaf5" stroke="#c9533a" strokeWidth="2"/>
      <line x1="100" y1="40" x2="100" y2="120" stroke="#c9533a" strokeWidth="2"/>

      {/* Spine decoration - animated hearts */}
      <g className="animate-pulse">
        <circle cx="100" cy="55" r="4" fill="#ff6b5b"/>
        <circle cx="100" cy="80" r="4" fill="#db6b47"/>
        <circle cx="100" cy="105" r="4" fill="#ff6b5b"/>
      </g>

      {/* Page lines with warm color */}
      <line x1="60" y1="55" x2="90" y2="55" stroke="#f9dcc4" strokeWidth="2" strokeLinecap="round"/>
      <line x1="60" y1="65" x2="85" y2="65" stroke="#f9dcc4" strokeWidth="2" strokeLinecap="round"/>
      <line x1="60" y1="75" x2="88" y2="75" stroke="#f9dcc4" strokeWidth="2" strokeLinecap="round"/>
      <line x1="60" y1="85" x2="82" y2="85" stroke="#f9dcc4" strokeWidth="2" strokeLinecap="round"/>

      {/* Right page - cute chef hat */}
      <path d="M120 60 C120 50 140 50 140 60 L140 75 C140 78 137 80 130 80 C123 80 120 78 120 75 Z" fill="#fffaf5" stroke="#ff6b5b" strokeWidth="1.5"/>
      <ellipse cx="130" cy="60" rx="12" ry="6" fill="white" stroke="#ff6b5b" strokeWidth="1.5"/>
      <ellipse cx="130" cy="95" rx="14" ry="8" fill="#fef3e8" stroke="#db6b47" strokeWidth="1.5"/>
      <path d="M124 93 C126 91 134 91 136 93" stroke="#db6b47" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Floating sparkles */}
      <circle cx="35" cy="45" r="4" fill="#ff6b5b" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="170" cy="50" r="5" fill="#14b8a3" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="165" cy="115" r="4" fill="#fde047" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.8s" repeatCount="indefinite"/>
      </circle>

      {/* Star sparkle */}
      <path d="M40 100 L42 105 L47 105 L43 108 L45 113 L40 110 L35 113 L37 108 L33 105 L38 105Z" fill="#fde047" opacity="0.8"/>

      <defs>
        <radialGradient id="warmGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ff6b5b"/>
          <stop offset="100%" stopColor="#ff6b5b" stopOpacity="0"/>
        </radialGradient>
      </defs>
    </svg>
  ),
  collections: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Warm background glow */}
      <ellipse cx="100" cy="80" rx="60" ry="45" fill="url(#collectionGlow)" opacity="0.25"/>

      {/* Folder stack with warm colors */}
      <rect x="45" y="60" width="110" height="70" rx="8" fill="#e3e7dd" stroke="#697a59" strokeWidth="2"/>
      <rect x="50" y="50" width="110" height="70" rx="8" fill="#ccfbef" stroke="#14b8a3" strokeWidth="2"/>
      <rect x="55" y="40" width="110" height="70" rx="8" fill="#fff5f0" stroke="#ff6b5b" strokeWidth="2"/>

      {/* Folder tab */}
      <path d="M55 40 L55 33 Q55 28 62 28 L88 28 Q95 28 97 33 L100 40" fill="#fff5f0" stroke="#ff6b5b" strokeWidth="2"/>

      {/* Heart in folder - animated */}
      <path d="M108 62 C108 52 122 52 122 62 C122 52 136 52 136 62 C136 78 122 88 122 88 C122 88 108 78 108 62Z" fill="#ffe3e0" stroke="#ff6b5b" strokeWidth="2">
        <animate attributeName="transform" type="scale" values="1;1.05;1" dur="1.5s" repeatCount="indefinite" origin="center"/>
      </path>

      {/* Floating stars */}
      <path d="M38 42 L41 49 L48 49 L43 53 L45 60 L38 56 L31 60 L33 53 L28 49 L35 49Z" fill="#fde047">
        <animate attributeName="transform" type="rotate" values="0 38 51;10 38 51;0 38 51" dur="3s" repeatCount="indefinite"/>
      </path>
      <path d="M168 75 L170 80 L175 80 L171 83 L173 88 L168 85 L163 88 L165 83 L161 80 L166 80Z" fill="#14b8a3">
        <animate attributeName="transform" type="rotate" values="0 168 81;-10 168 81;0 168 81" dur="2.5s" repeatCount="indefinite"/>
      </path>

      {/* Floating dots */}
      <circle cx="170" cy="45" r="3" fill="#ff6b5b" opacity="0.6">
        <animate attributeName="cy" values="45;40;45" dur="2s" repeatCount="indefinite"/>
      </circle>

      <defs>
        <radialGradient id="collectionGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#14b8a3"/>
          <stop offset="100%" stopColor="#14b8a3" stopOpacity="0"/>
        </radialGradient>
      </defs>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Warm background glow */}
      <ellipse cx="90" cy="75" rx="50" ry="40" fill="url(#searchGlow)" opacity="0.2"/>

      {/* Magnifying glass with warm tones */}
      <circle cx="85" cy="65" r="38" fill="#fff8f0" stroke="#334e68" strokeWidth="3"/>
      <circle cx="85" cy="65" r="28" fill="white" stroke="#f9dcc4" strokeWidth="3"/>
      <line x1="112" y1="92" x2="148" y2="128" stroke="#334e68" strokeWidth="8" strokeLinecap="round"/>
      <line x1="114" y1="94" x2="145" y2="125" stroke="#ff6b5b" strokeWidth="4" strokeLinecap="round" opacity="0.3"/>

      {/* Sparkle inside lens */}
      <circle cx="72" cy="52" r="6" fill="white" opacity="0.8"/>
      <circle cx="78" cy="58" r="3" fill="white" opacity="0.6"/>

      {/* Floating food icons */}
      <circle cx="45" cy="45" r="6" fill="#ff6b5b" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="155" cy="55" r="5" fill="#14b8a3" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="160" cy="100" r="4" fill="#fde047" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="35" cy="95" r="5" fill="#db6b47" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.2s" repeatCount="indefinite"/>
      </circle>

      {/* Question marks - animated */}
      <text x="77" y="72" fontSize="20" fill="#f9dcc4" fontFamily="Georgia, serif" fontWeight="bold">?</text>

      <defs>
        <radialGradient id="searchGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fde047"/>
          <stop offset="100%" stopColor="#fde047" stopOpacity="0"/>
        </radialGradient>
      </defs>
    </svg>
  ),
  cooking: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Warm background glow */}
      <ellipse cx="100" cy="90" rx="65" ry="45" fill="url(#cookingGlow)" opacity="0.25"/>

      {/* Pot shadow */}
      <ellipse cx="100" cy="118" rx="48" ry="10" fill="#d9e2ec" opacity="0.5"/>

      {/* Pot with warmer colors */}
      <path d="M52 72 L52 100 Q52 112 65 116 L135 116 Q148 112 148 100 L148 72" fill="url(#potGradient)" stroke="#334e68" strokeWidth="2"/>
      <ellipse cx="100" cy="72" rx="48" ry="12" fill="#829ab1" stroke="#334e68" strokeWidth="2"/>

      {/* Pot handles */}
      <ellipse cx="40" cy="85" rx="8" ry="5" fill="none" stroke="#334e68" strokeWidth="3"/>
      <ellipse cx="160" cy="85" rx="8" ry="5" fill="none" stroke="#334e68" strokeWidth="3"/>

      {/* Lid with handle */}
      <ellipse cx="100" cy="56" rx="42" ry="9" fill="#9fb3c8" stroke="#334e68" strokeWidth="2"/>
      <ellipse cx="100" cy="46" rx="10" ry="5" fill="#627d98" stroke="#334e68" strokeWidth="1.5"/>

      {/* Steam - animated */}
      <g opacity="0.7">
        <path d="M78 38 Q73 25 80 12" stroke="#bcccdc" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <animate attributeName="d" values="M78 38 Q73 25 80 12;M78 38 Q83 25 78 12;M78 38 Q73 25 80 12" dur="2s" repeatCount="indefinite"/>
        </path>
        <path d="M100 32 Q95 18 100 5" stroke="#bcccdc" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <animate attributeName="d" values="M100 32 Q95 18 100 5;M100 32 Q105 18 100 5;M100 32 Q95 18 100 5" dur="2.5s" repeatCount="indefinite"/>
        </path>
        <path d="M122 38 Q127 25 120 12" stroke="#bcccdc" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <animate attributeName="d" values="M122 38 Q127 25 120 12;M122 38 Q117 25 122 12;M122 38 Q127 25 120 12" dur="1.8s" repeatCount="indefinite"/>
        </path>
      </g>

      {/* Floating food elements */}
      <circle cx="35" cy="105" r="5" fill="#ff6b5b" opacity="0.7">
        <animate attributeName="cy" values="105;100;105" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="170" cy="75" r="4" fill="#14b8a3" opacity="0.6">
        <animate attributeName="cy" values="75;70;75" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <path d="M165 45 L168 38 L171 45" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round">
        <animate attributeName="transform" type="rotate" values="0 168 42;10 168 42;0 168 42" dur="3s" repeatCount="indefinite"/>
      </path>

      <defs>
        <radialGradient id="cookingGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ff6b5b"/>
          <stop offset="100%" stopColor="#ff6b5b" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="potGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#829ab1"/>
          <stop offset="100%" stopColor="#627d98"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  pantry: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Warm background glow */}
      <ellipse cx="100" cy="85" rx="70" ry="50" fill="url(#pantryGlow)" opacity="0.2"/>

      {/* Shelves with warm wood tone */}
      <rect x="25" y="120" width="150" height="10" rx="3" fill="url(#shelfGradient)" stroke="#697a59" strokeWidth="2"/>
      <rect x="25" y="68" width="150" height="10" rx="3" fill="url(#shelfGradient)" stroke="#697a59" strokeWidth="2"/>

      {/* Jars on top shelf */}
      <rect x="40" y="38" width="28" height="30" rx="4" fill="#fef9c3" stroke="#eab308" strokeWidth="2"/>
      <rect x="40" y="32" width="28" height="10" rx="3" fill="#eab308"/>
      <circle cx="54" cy="50" r="5" fill="#f5ede0" opacity="0.6"/>

      <rect x="78" y="42" width="24" height="26" rx="4" fill="#ffe3e0" stroke="#ff6b5b" strokeWidth="2"/>
      <ellipse cx="90" cy="38" rx="12" ry="5" fill="#ff6b5b"/>

      <rect x="112" y="35" width="26" height="33" rx="4" fill="#ccfbef" stroke="#14b8a3" strokeWidth="2"/>
      <rect x="112" y="28" width="26" height="10" rx="3" fill="#14b8a3"/>
      <circle cx="125" cy="50" r="5" fill="#fff" opacity="0.4"/>

      {/* Items on bottom shelf */}
      <ellipse cx="52" cy="115" rx="18" ry="9" fill="#fbeae3" stroke="#db6b47" strokeWidth="2"/>
      <path d="M45 112 C48 108 56 108 59 112" stroke="#db6b47" strokeWidth="1.5" strokeLinecap="round"/>

      <ellipse cx="95" cy="112" rx="14" ry="11" fill="#e3e7dd" stroke="#697a59" strokeWidth="2"/>

      <rect x="122" y="93" width="32" height="27" rx="5" fill="#fff8f0" stroke="#627d98" strokeWidth="2"/>
      <rect x="128" y="100" width="20" height="3" rx="1" fill="#bcccdc"/>
      <rect x="128" y="106" width="15" height="3" rx="1" fill="#bcccdc"/>

      {/* Floating sparkles */}
      <circle cx="172" cy="45" r="4" fill="#ff6b5b" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite"/>
      </circle>
      <path d="M22 92 L26 85 L30 92" stroke="#14b8a3" strokeWidth="2.5" strokeLinecap="round">
        <animate attributeName="transform" type="rotate" values="0 26 89;-10 26 89;0 26 89" dur="2.5s" repeatCount="indefinite"/>
      </path>
      <circle cx="178" cy="105" r="3" fill="#fde047" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.4;0.7" dur="1.8s" repeatCount="indefinite"/>
      </circle>

      <defs>
        <radialGradient id="pantryGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#eab308"/>
          <stop offset="100%" stopColor="#eab308" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="shelfGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c8d0be"/>
          <stop offset="100%" stopColor="#a5b296"/>
        </linearGradient>
      </defs>
    </svg>
  ),
};

export function EmptyState({ illustration, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-16 px-6 ${className}`}>
      {/* Illustration with subtle hover animation */}
      <div className="w-52 h-44 mx-auto mb-8 transform transition-transform duration-500 hover:scale-105">
        {illustrations[illustration]}
      </div>

      {/* Title with display font */}
      <h3 className="text-2xl font-display text-primary-800 mb-3">{title}</h3>

      {/* Description with warm color */}
      <p className="text-primary-500 max-w-md mx-auto mb-8 leading-relaxed">{description}</p>

      {/* Action button with warm hover */}
      {action && (
        action.href ? (
          <Link to={action.href}>
            <Button className="btn-primary px-8 py-3 text-base shadow-lg shadow-coral-200/50 hover:shadow-coral-300/50 transition-shadow">
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button
            className="btn-primary px-8 py-3 text-base shadow-lg shadow-coral-200/50 hover:shadow-coral-300/50 transition-shadow"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
