export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About Us</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-4">
              Digital Contracts is a secure contract management and exchange platform designed specifically for legal professionals.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
              <li>Secure user authentication and authorization</li>
              <li>Upload and send contracts to recipients</li>
              <li>Receive and review contract requests</li>
              <li>Sign, edit, or deny contracts</li>
              <li>Contract version control with full history</li>
              <li>Lock mechanism to prevent simultaneous edits</li>
              <li>Easy-to-navigate, modern interface</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">How It Works</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="text-xl font-semibold mb-2">For Senders</h3>
                <p>Upload a contract file, specify the recipient by username or email, and send. Track the status of your contracts and view version history.</p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">For Recipients</h3>
                <p>Receive contract requests, review the documents, and choose to sign, edit, or deny. When editing, the contract is automatically locked to prevent conflicts.</p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">Version Control</h3>
                <p>Every edit creates a new version of the contract, maintaining a complete history of all changes with timestamps and change notes.</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Security</h2>
            <p className="text-gray-700">
              We take security seriously. All user passwords are hashed using bcrypt, and authentication is handled through secure JWT tokens. 
              Contracts are stored securely, and only authorized users can access the documents they're involved with.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


