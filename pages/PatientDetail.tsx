import React, { useState, useEffect } from 'react';
import PatientDetailSheet from '../components/PatientDetail';
import { useParams, useNavigate } from 'react-router-dom';

const PatientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Open sheet when component mounts
        setIsOpen(true);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Wait for animation before navigating
        setTimeout(() => {
            navigate('/dashboard/patients');
        }, 300);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <PatientDetailSheet
                patientId={id}
                open={isOpen}
                onClose={handleClose}
            />
        </div>
    );
};

export default PatientDetail;
