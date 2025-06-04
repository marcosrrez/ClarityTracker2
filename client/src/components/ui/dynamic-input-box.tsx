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
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl shadow-gray-900/5 dark:shadow-black/20">
        <div className="flex items-end gap-2 p-3">
          {/* Dynamic Textarea with Enhanced Styling */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full resize-none border-0 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl px-4 py-3 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 backdrop-blur-sm"
              style={{
                minHeight: "40px",
                maxHeight: "150px",
                overflowY: "hidden",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
              rows={1}
              aria-label="Enter your message"
              role="textbox"
            />
          </div>

          {/* Submit Button - Desktop (right side) with Elegant Design */}
          <div className="hidden sm:block">
            <Button
              onClick={handleSubmit}
              disabled={!message.trim()}
              size="sm"
              className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 disabled:shadow-none disabled:scale-100"
              aria-label="Submit message"
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Submit Button - Mobile (below input) with Enhanced Design */}
        <div className="sm:hidden px-3 pb-3">
          <Button
            onClick={handleSubmit}
            disabled={!message.trim()}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            aria-label="Submit message"
          >
            <Send className="h-4 w-4 mr-2 text-white" />
            <span className="text-white font-medium">Send Message</span>
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