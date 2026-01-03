import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { BookOpen, Target, Lightbulb, Users } from 'lucide-react';
import { StrategicPrinciple } from '../../src/data/strategicWisdom';

interface StrategicWisdomModalProps {
    isOpen: boolean;
    onClose: () => void;
    principle: StrategicPrinciple;
    roleSpecificAction: string;
    userRole: string;
}

export function StrategicWisdomModal({
    isOpen,
    onClose,
    principle,
    roleSpecificAction,
    userRole
}: StrategicWisdomModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white">
                            <BookOpen size={24} />
                        </div>
                        Princípio de Gestão - Dia {principle.day}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    {/* Verse Section */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-100/50 to-indigo-100/50 dark:from-violet-950/20 dark:to-indigo-950/20 rounded-2xl blur-xl"></div>
                        <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl border border-violet-200/50 dark:border-violet-800/50 shadow-lg">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="text-6xl text-violet-200 dark:text-violet-900 leading-none">"</div>
                                <div className="flex-1">
                                    <p className="text-lg font-medium text-slate-700 dark:text-slate-200 italic leading-relaxed">
                                        {principle.verse}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 text-right">
                                — {principle.verseReference}
                            </p>
                        </div>
                    </div>

                    {/* Business Vision */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="text-blue-600 dark:text-blue-400" size={20} />
                            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                                Visão Empresarial
                            </h3>
                        </div>
                        <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                            {principle.businessVision}
                        </p>
                    </div>

                    {/* Role-Specific Action */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-6 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="text-emerald-600 dark:text-emerald-400" size={20} />
                            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                                Para Você ({userRole})
                            </h3>
                        </div>
                        <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {roleSpecificAction}
                        </p>
                    </div>

                    {/* General Action */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-6 rounded-2xl border border-amber-200/50 dark:border-amber-800/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="text-amber-600 dark:text-amber-400" size={20} />
                            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                                Ação Prática Hoje
                            </h3>
                        </div>
                        <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                            {principle.practicalAction}
                        </p>
                    </div>

                    {/* Footer Quote */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 italic">
                            "A excelência não é um ato, mas um hábito. Que este princípio guie suas decisões hoje."
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
