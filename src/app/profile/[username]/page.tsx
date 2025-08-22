'use client';

export const runtime = 'edge';

import { useParams } from 'next/navigation';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            {username}'s Profile
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Profile Info</h2>
              <div className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <p><strong>Username:</strong> {username}</p>
                <p><strong>Email:</strong> {username}@example.com</p>
                <p><strong>Verified:</strong> Yes</p>
                <p><strong>Registered:</strong> 1 year ago</p>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Listings (3)</h2>
              <div className="space-y-2">
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <h3 className="font-medium text-neutral-900 dark:text-white">Sample Listing 1</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Selling - 1,000,000 sats</p>
                </div>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <h3 className="font-medium text-neutral-900 dark:text-white">Sample Listing 2</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Looking for - 500,000 sats</p>
                </div>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <h3 className="font-medium text-neutral-900 dark:text-white">Sample Listing 3</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Selling - 2,000,000 sats</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
