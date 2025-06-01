
import React from 'react';
import { PalsList } from '@/components/profile/PalsList';
import { usePals } from '@/hooks/use-pals';

const PalsPage = () => {
  const { pals, isLoading, error } = usePals();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Pals</h1>
          <p className="text-muted-foreground">
            Connect and chat with your friends in the meme community
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              Error loading pals: {error}
            </p>
          </div>
        )}

        <PalsList pals={pals} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default PalsPage;
