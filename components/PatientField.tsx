import React, { useState, useEffect, memo } from 'react';
import { format, parse, isValid } from 'date-fns';

interface PatientFieldProps {
    label: string;
    name: string;
    value: any;
    onChange: (e: React.ChangeEvent<any>) => void; // Using any to be compatible with parent
    type?: string;
    options?: { value: string; label: string }[];
    required?: boolean;
    isEditing?: boolean;
    className?: string; // Additional prop for flexibility
}

// Styles extracted from PatientForm
const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";
const inputClass = "w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400";
const valueClass = "text-slate-700 dark:text-slate-300 font-medium py-2 border-b border-slate-200 dark:border-slate-700";

export const PatientField = memo(({
    label,
    name,
    value,
    onChange,
    type = 'text',
    options,
    required = false,
    isEditing = true
}: PatientFieldProps) => {

    // --- SAFE BIRTH DATE LOGIC ---
    const [localDate, setLocalDate] = useState('');

    // Sync from parent value (database) to local state
    useEffect(() => {
        if (name === 'birth_date' && value && typeof value === 'string' && value.length === 10) {
            try {
                const parsed = parse(value, 'yyyy-MM-dd', new Date());
                if (isValid(parsed)) {
                    setLocalDate(format(parsed, 'dd/MM/yyyy'));
                }
            } catch (e) {
                // ignore invalid dates from DB
            }
        } else if (name === 'birth_date' && !value) {
            setLocalDate('');
        }
    }, [value, name]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, ''); // Numbers only

        // Mask DD/MM/YYYY
        if (val.length >= 2) {
            val = val.substring(0, 2) + '/' + val.substring(2);
        }
        if (val.length >= 5) {
            val = val.substring(0, 5) + '/' + val.substring(5, 9);
        }

        setLocalDate(val); // Update LOCAL state only - no parent re-render!
    };

    const handleDateBlur = () => {
        // On blur, validate and update parent
        if (localDate.length === 10) { // 10 chars = DD/MM/YYYY
            const digits = localDate.replace(/\D/g, '');
            if (digits.length === 8) {
                const day = digits.substring(0, 2);
                const month = digits.substring(2, 4);
                const year = digits.substring(4, 8);

                try {
                    const parsed = parse(`${day}/${month}/${year}`, 'dd/MM/yyyy', new Date());
                    if (isValid(parsed)) {
                        const isoDate = format(parsed, 'yyyy-MM-dd');
                        // Call parent onChange with ISO date
                        // Mocking an event object
                        onChange({ target: { name, value: isoDate } } as any);
                        return;
                    }
                } catch (e) { }
            }
        }

        // If empty or invalid, clear parent or keep valid? 
        // If empty, clear parent
        if (localDate === '') {
            onChange({ target: { name, value: '' } } as any);
        }
        // If incomplete, maybe do nothing or revert? 
        // Let's rely on required validation or keep as is.
    };

    // --- RENDER ---

    if (!isEditing) {
        return (
            <div className="mb-4">
                <label className={labelClass}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <p className={valueClass}>
                    {name === 'birth_date' && value
                        ? (() => {
                            try { return format(parse(value, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy'); }
                            catch { return value; }
                        })()
                        : (value || 'Não informado')}
                </p>
            </div>
        );
    }

    // Edit Mode
    // Safe Date Input
    if (name === 'birth_date') {
        return (
            <div className="mb-4">
                <label className={labelClass}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={localDate}
                        onChange={handleDateChange}
                        onBlur={handleDateBlur}
                        className={inputClass}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        autoComplete="off"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <span className="mr-1">📅</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <label className={labelClass}>
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {options ? (
                <select
                    name={name}
                    value={value || ""}
                    className={inputClass}
                    onChange={onChange}
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ) : type === "textarea" ? (
                <textarea
                    name={name}
                    value={value || ""}
                    className={`${inputClass} resize-none`}
                    rows={3}
                    onChange={onChange}
                />
            ) : (
                <input
                    name={name}
                    value={value || ""}
                    type={type}
                    className={inputClass}
                    onChange={onChange}
                    required={required}
                    autoFocus={false}
                    autoComplete="off"
                    style={{ fontSize: '16px' }}
                />
            )}
        </div>
    );
});

PatientField.displayName = 'PatientField';
