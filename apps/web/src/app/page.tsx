'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { useTeams } from '@/contexts/TeamsContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { selectedTeam, loading: teamsLoading } = useTeams();

  useEffect(() => {
    if (authLoading || teamsLoading || !user) return;
    router.replace(selectedTeam ? '/pools' : '/teams');
  }, [authLoading, router, selectedTeam, teamsLoading, user]);

  return <Loading />;
}
