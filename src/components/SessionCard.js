/**
 * SessionCard Component
 * Displays a WhatsApp session card
 */

export default function SessionCard({ session, onClick }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return '✅';
      case 'connecting':
        return '🔄';
      case 'disconnected':
        return '⭕';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div
      onClick={onClick}
      className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-whatsapp"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{session.name}</h3>
          {session.phone_number && (
            <p className="text-sm text-gray-600 mt-1">+{session.phone_number}</p>
          )}
        </div>
        <span className="text-2xl">{getStatusIcon(session.status)}</span>
      </div>

      <div className="space-y-2">
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
          {session.status.toUpperCase()}
        </div>

        {session.last_connected_at && (
          <p className="text-xs text-gray-500">
            Last connected: {new Date(session.last_connected_at).toLocaleString()}
          </p>
        )}

        <p className="text-xs text-gray-500">
          Created: {new Date(session.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-whatsapp hover:text-whatsapp-dark font-medium text-sm">
          Open Chat →
        </button>
      </div>
    </div>
  );
}
