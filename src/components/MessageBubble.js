/**
 * MessageBubble Component
 * Displays individual message in chat
 */

import { format } from 'date-fns';

export default function MessageBubble({ message }) {
  const isFromMe = message.is_from_me;

  const formatTime = (timestamp) => {
    try {
      return format(new Date(parseInt(timestamp)), 'HH:mm');
    } catch {
      return '';
    }
  };

  const getAckIcon = (ack) => {
    switch (ack) {
      case 1:
        return '✓'; // Server received
      case 2:
        return '✓✓'; // Delivered
      case 3:
        return '✓✓'; // Read (could be blue)
      case 4:
        return '✓✓'; // Played
      default:
        return '⏱'; // Pending
    }
  };

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`message-bubble ${isFromMe ? 'message-from-me' : 'message-from-other'}`}>
        {/* Message Content */}
        <div className="mb-1">
          {message.has_media && message.type === 'image' ? (
            <div className="mb-2">
              <div className="bg-gray-200 rounded p-2 text-sm text-gray-600">
                📷 Image
              </div>
            </div>
          ) : null}

          {message.content && (
            <p className="text-gray-900 whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className={`flex items-center gap-1 text-xs ${isFromMe ? 'text-gray-600' : 'text-gray-500'}`}>
          <span>{formatTime(message.timestamp)}</span>
          {isFromMe && (
            <span className={message.ack_status >= 3 ? 'text-blue-500' : ''}>
              {getAckIcon(message.ack_status)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
