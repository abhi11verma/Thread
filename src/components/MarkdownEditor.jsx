import { forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';

const MarkdownEditor = forwardRef(function MarkdownEditor(
  { initialValue = '', onChange, onKeyDown, onSlugQuery, placeholder = '', minHeight = 72, autoFocus = false },
  ref,
) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Markdown.configure({ html: false, transformPastedText: true, transformCopiedText: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialValue,
    autofocus: autoFocus ? 'end' : false,
    onUpdate({ editor }) {
      const md = editor.storage.markdown.getMarkdown();
      onChange?.(md);
      if (onSlugQuery) {
        const { from } = editor.state.selection;
        const textBefore = editor.state.doc.textBetween(0, from, '\n');
        const match = textBefore.match(/\[\[([^\]]*)$/);
        onSlugQuery(match ? match[1] : null);
      }
    },
    editorProps: {
      handleKeyDown(_view, event) {
        if (onKeyDown) {
          onKeyDown(event);
          return event.defaultPrevented;
        }
        return false;
      },
      attributes: { class: 'wysiwyg-editor' },
    },
  });

  useImperativeHandle(ref, () => ({
    clear() { editor?.commands.clearContent(); },
    focus(pos = 'end') { editor?.commands.focus(pos); },
    getMarkdown() { return editor?.storage.markdown.getMarkdown() ?? ''; },
    scrollToHeading(headingText) {
      if (!editor) return;
      let targetPos = null;
      editor.state.doc.descendants((node, pos) => {
        if (targetPos !== null) return false;
        if (node.type.name === 'heading' && node.textContent === headingText) {
          targetPos = pos;
          return false;
        }
      });
      if (targetPos === null) return;
      try {
        editor.chain().focus().setTextSelection(targetPos + 1).run();
        const domNode = editor.view.nodeDOM(targetPos);
        if (domNode) domNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (_) {}
    },
    insertSlugCompletion(threadId) {
      if (!editor) return;
      const { from } = editor.state.selection;
      const $from = editor.state.selection.$from;
      const nodeStart = $from.start();
      const nodeText = $from.node().textContent;
      const cursorOffset = from - nodeStart;
      const bracketOffset = nodeText.lastIndexOf('[[', cursorOffset - 1);
      if (bracketOffset === -1) return;
      editor.chain().focus()
        .deleteRange({ from: nodeStart + bracketOffset, to: from })
        .insertContent(`[[${threadId}]]`)
        .run();
    },
  }), [editor]);

  return <EditorContent editor={editor} style={{ width: '100%', minHeight }} />;
});

export default MarkdownEditor;
