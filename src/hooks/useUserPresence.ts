
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserPresence {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
  lastSeen: number;
}

interface UseUserPresenceReturn {
  users: Record<string, UserPresence>;
  updateCursor: (x: number, y: number) => void;
}

const USER_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function useUserPresence(roomId: string, userName: string): UseUserPresenceReturn {
  const [users, setUsers] = useState<Record<string, UserPresence>>({});
  const [channel, setChannel] = useState<any>(null);
  const [userColor] = useState(() => 
    USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
  );

  useEffect(() => {
    if (!roomId || !userName) return;

    const presenceChannel = supabase.channel(`presence-${roomId}`, {
      config: {
        presence: {
          key: userName,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        const newUsers: Record<string, UserPresence> = {};

        Object.entries(presenceState).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            if (presence.userId !== userName) { // Don't show own cursor
              newUsers[presence.userId] = {
                userId: presence.userId,
                userName: presence.userName,
                x: presence.x || 0,
                y: presence.y || 0,
                color: presence.color,
                lastSeen: Date.now(),
              };
            }
          }
        });

        setUsers(newUsers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId: userName,
            userName: userName,
            x: 0,
            y: 0,
            color: userColor,
            lastSeen: Date.now(),
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [roomId, userName, userColor]);

  const updateCursor = useCallback(
    async (x: number, y: number) => {
      if (channel) {
        await channel.track({
          userId: userName,
          userName: userName,
          x,
          y,
          color: userColor,
          lastSeen: Date.now(),
        });
      }
    },
    [channel, userName, userColor]
  );

  return { users, updateCursor };
}
