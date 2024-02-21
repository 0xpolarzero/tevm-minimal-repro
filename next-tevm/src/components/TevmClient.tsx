'use client';

import { useEffect } from 'react';

import { createMemoryClient } from 'tevm';

const TevmClient = () => {
  useEffect(() => {
    console.log('TevmClient component mounted');

    createMemoryClient().then((client) => {
      console.log('client', client);
    });
  }, []);

  return <div>Tevm client component</div>;
};

export default TevmClient;
