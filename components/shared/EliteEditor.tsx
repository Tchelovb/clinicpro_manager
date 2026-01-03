import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, Heading1, Heading2, GripVertical, Variable } from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { TemplateService } from '../../src/services/documents/TemplateService';

interface EliteEditorProps {
    content: string;
    onChange?: (html: string) => void;
    editable?: boolean;
    className?: string; // Para layout externo
}

export const EliteEditor: React.FC<EliteEditorProps> = ({
    content,
    onChange,
    editable = true,
    className
}) => {

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Comece a escrever seu documento de elite...',
                emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-slate-400 before:float-left before:h-0 before:pointer-events-none',
            }),
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            if (onChange) {
                onChange(editor.getHTML());
            }
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] px-8 py-10 bg-white shadow-sm border border-slate-100 rounded-lg',
            },
        },
    });

    if (!editor) {
        return null;
    }

    const availableVariables = TemplateService.getAvailableVariables();

    const insertVariable = (varId: string) => {
        editor.chain().focus().insertContent(`{{${varId}}}`).run();
    };

    return (
        <div className={cn("flex flex-col gap-4", className)}>

            {/* Toolbar (Only if editable) */}
            {editable && (
                <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg sticky top-0 z-20 backdrop-blur-sm bg-opacity-90">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={cn("p-2 rounded hover:bg-slate-200 transition", editor.isActive('bold') && "bg-slate-300")}
                    >
                        <Bold size={18} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={cn("p-2 rounded hover:bg-slate-200 transition", editor.isActive('italic') && "bg-slate-300")}
                    >
                        <Italic size={18} />
                    </button>
                    <div className="w-px h-6 bg-slate-300 mx-1" />
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={cn("p-2 rounded hover:bg-slate-200 transition", editor.isActive('heading', { level: 1 }) && "bg-slate-300")}
                    >
                        <Heading1 size={18} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={cn("p-2 rounded hover:bg-slate-200 transition", editor.isActive('heading', { level: 2 }) && "bg-slate-300")}
                    >
                        <Heading2 size={18} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={cn("p-2 rounded hover:bg-slate-200 transition", editor.isActive('bulletList') && "bg-slate-300")}
                    >
                        <List size={18} />
                    </button>

                    <div className="flex-1" />

                    {/* Variable Inserter */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition text-sm font-medium">
                            <Variable size={16} />
                            <span>Variáveis</span>
                        </button>

                        {/* Dropdown de Variáveis */}
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl p-2 hidden group-hover:block max-h-64 overflow-y-auto z-50">
                            <p className="text-xs font-bold text-slate-400 px-2 py-1 uppercase">Inserir Coringa</p>
                            {availableVariables.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => insertVariable(v.id)}
                                    className="w-full text-left px-2 py-1.5 hover:bg-slate-50 text-sm text-slate-700 rounded flex items-center justify-between group/item"
                                >
                                    <span>{v.label}</span>
                                    <span className="text-[10px] text-slate-400 font-mono opacity-0 group-hover/item:opacity-100">{`{{${v.id}}}`}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Area */}
            <EditorContent editor={editor} className={cn("min-h-[500px]", !editable && "pointer-events-none opacity-80")} />

            <style>{`
                .ProseMirror {
                    outline: none;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #adb5bd;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};
