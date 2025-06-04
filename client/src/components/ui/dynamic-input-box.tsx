import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface DynamicInputBoxProps {
  onSubmit: (message: string) => void;
  placeholder?: string;
  isConversationActive?: boolean;
  className?: string;
}

export function DynamicInputBox({ 
  onSubmit, 
  placeholder = "Type your message...", 
  isConversationActive = false,
  className = ""
}: DynamicInputBoxProps) {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to get accurate scrollHeight
    textarea.style.height = "40px";
    
    // Calculate new height (min 40px, max 150px)
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 150);
    textarea.style.height = `${newHeight}px`;
    
    // Show scrollbar if content exceeds max height
    textarea.style.overflowY = textarea.scrollHeight > 150 ? "auto" : "hidden";
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (message.trim()) {
      onSubmit(message.trim());
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    }
  };

  // Adjust height on mount and when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Position classes based on conversation state
  const getPositionClasses = () => {
    if (isConversationActive) {
      return "fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 z-50";
    }
    return "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4 z-50";
  };

  return (
    <div 
      ref={containerRef}
      className={`${getPositionClasses()} transition-all duration-500 ease-in-out ${className}`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        <div className="flex items-end gap-3 p-4">
          {/* Dynamic Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full resize-none border-0 bg-gray-50 dark:bg-gray-700 rounded-2xl px-4 py-3 text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              style={{
                minHeight: "40px",
                maxHeight: "150px",
                overflowY: "hidden"
              }}
              rows={1}
              aria-label="Enter your message"
              role="textbox"
            />
          </div>

          {/* Submit Button - Desktop (right side) */}
          <div className="hidden sm:block">
            <Button
              onClick={handleSubmit}
              disabled={!message.trim()}
              size="sm"
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              aria-label="Submit message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Submit Button - Mobile (below input) */}
        <div className="sm:hidden px-4 pb-4">
          <Button
            onClick={handleSubmit}
            disabled={!message.trim()}
            className="w-full rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Submit message"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>

      {/* Centered hint text when not in conversation */}
      {!isConversationActive && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}