
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, Mic, Image, File } from 'lucide-react';
import { cn, debounce } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'TEXT' | 'IMAGE' | 'FILE') => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

export function MessageInput({
  onSendMessage,
  onTyping,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 2000,
  className
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Debounced typing indicator
  const debouncedStopTyping = useCallback(
    debounce(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 1000),
    [onTyping]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    if (value.length <= maxLength) {
      setMessage(value);
      
      // Handle typing indicators
      if (!isTyping && value.trim()) {
        setIsTyping(true);
        onTyping?.(true);
      }
      
      if (value.trim()) {
        debouncedStopTyping();
      } else {
        setIsTyping(false);
        onTyping?.(false);
      }
    }
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage, 'TEXT');
      setMessage('');
      setIsTyping(false);
      onTyping?.(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'FILE' | 'IMAGE') => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real implementation, you would upload the file and get a URL
      // For now, we'll just send a placeholder message
      const fileName = file.name;
      const fileSize = (file.size / 1024 / 1024).toFixed(2); // MB
      onSendMessage(`📎 ${fileName} (${fileSize} MB)`, type);
    }
    
    // Reset file input
    e.target.value = '';
  };

  // Common emojis for quick access
  const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '😢', '😡', '🔥', '💯'];

  return (
    <div className={cn("relative", className)}>
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-popover border rounded-lg shadow-lg p-3 z-10">
          <div className="grid grid-cols-6 gap-2">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  setMessage(prev => prev + emoji);
                  setShowEmojiPicker(false);
                  textareaRef.current?.focus();
                }}
                className="text-xl hover:bg-accent rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end space-x-2">
        {/* Attachment buttons */}
        <div className="flex space-x-1">
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
            title="Upload image"
          >
            <Image className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
            title="Upload file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "min-h-[40px] max-h-[120px]"
            )}
            style={{ height: 'auto' }}
          />
          
          {/* Character count */}
          {message.length > maxLength * 0.8 && (
            <div className="absolute -top-6 right-0 text-xs text-muted-foreground">
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex space-x-1">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={disabled || !message.trim()}
            className={cn(
              "p-2 rounded-lg transition-colors",
              message.trim() && !disabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground cursor-not-allowed opacity-50"
            )}
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        onChange={(e) => handleFileUpload(e, 'FILE')}
        className="hidden"
      />
      
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'IMAGE')}
        className="hidden"
      />
    </div>
  );
}
