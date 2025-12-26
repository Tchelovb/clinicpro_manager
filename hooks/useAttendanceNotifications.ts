import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useAttendanceNotifications = (clinicId: string | undefined, userId: string | undefined) => {
    const lastCheckRef = useRef<Date>(new Date());

    useEffect(() => {
        if (!clinicId || !userId) return;

        // Subscribe to real-time changes in appointments
        const channel = supabase
            .channel('attendance-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'appointments',
                    filter: `clinic_id=eq.${clinicId}`
                },
                (payload) => {
                    const newStatus = payload.new.status;
                    const oldStatus = payload.old?.status;

                    // Notify when patient arrives (status changes to ARRIVED)
                    if (newStatus === 'ARRIVED' && oldStatus !== 'ARRIVED') {
                        // Play notification sound
                        const audio = new Audio('/notification.mp3');
                        audio.play().catch(() => {
                            // Fallback to system beep if audio fails
                            console.log('🔔 Patient arrived!');
                        });

                        // Show toast notification
                        toast.success(
                            `Paciente chegou! Verifique a fila de atendimento.`,
                            {
                                duration: 5000,
                                icon: '🎯',
                                style: {
                                    background: '#10B981',
                                    color: '#fff',
                                    fontWeight: 'bold'
                                }
                            }
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [clinicId, userId]);
};
