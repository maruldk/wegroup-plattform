
'use client';

import React, { useState } from 'react';
import { formatTime, formatDate, cn, generateAvatarUrl } from '@/lib/utils';
import { MoreVertical, Edit, Trash2, Reply, Smile } from 'lucide-react';
import type { Message } from './chat-window';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  className?: string;
}

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
}

function MessageItem({
  message,
  isOwn,
  showAvatar,
  showTimestamp,
  onEditMessage,
  onDeleteMessage,
  onAddReaction,
  onRemoveReaction
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showReactions, setShowReactions] = useState(false);

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEditMessage?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  const handleReactionClick = (emoji: string) => {
    const existingReaction = message.reactions?.find(
      r => r.emoji === emoji && r.userId === message.senderId
    );
    
    if (existingReaction) {
      onRemoveReaction?.(message.id, emoji);
    } else {
      onAddReaction?.(message.id, emoji);
    }
    setShowReactions(false);
  };

  return (
    <div
      className={cn(
        "group relative flex",
        isOwn ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0 mr-3">
          <img
            src={message.sender.avatar || generateAvatarUrl(message.sender.name)}
            alt={message.sender.name}
            className="w-8 h-8 rounded-full"
          />
        </div>
      )}
      
      {/* Spacer for alignment */}
      {!isOwn && !showAvatar && <div className="w-11" />}

      <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
        {/* Sender name and timestamp */}
        {showTimestamp && (
          <div className={cn(
            "flex items-center space-x-2 mb-1 text-xs text-muted-foreground",
            isOwn && "flex-row-reverse space-x-reverse"
          )}>
            {!isOwn && <span className="font-medium">{message.sender.name}</span>}
            <span>{formatTime(message.createdAt)}</span>
            {message.isEdited && <span className="italic">(edited)</span>}
          </div>
        )}

        {/* Message content */}
        <div className="relative">
          <div
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
              message.type === 'SYSTEM' && "bg-accent text-accent-foreground italic"
            )}
          >
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyPress={handleKeyPress}
                onBlur={handleEdit}
                className="w-full bg-transparent border-none outline-none resize-none"
                rows={1}
                autoFocus
              />
            ) : (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}
          </div>

          {/* Message actions */}
          {showActions && !isEditing && message.type !== 'SYSTEM' && (
            <div className={cn(
              "absolute top-0 flex items-center space-x-1 bg-background border rounded-lg shadow-sm p-1",
              isOwn ? "-left-20" : "-right-20"
            )}>
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 hover:bg-accent rounded transition-colors"
                title="Add reaction"
              >
                <Smile className="w-4 h-4" />
              </button>
              
              {isOwn && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Edit message"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteMessage?.(message.id)}
                    className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              
              <button
                className="p-1 hover:bg-accent rounded transition-colors"
                title="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Reaction picker */}
          {showReactions && (
            <div className={cn(
              "absolute top-full mt-1 bg-popover border rounded-lg shadow-lg p-2 z-10",
              isOwn ? "right-0" : "left-0"
            )}>
              <div className="flex space-x-1">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className="text-lg hover:bg-accent rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Message reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(
              message.reactions.reduce((acc, reaction) => {
                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="flex items-center space-x-1 bg-accent hover:bg-accent/80 rounded-full px-2 py-1 text-xs transition-colors"
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center space-x-2 bg-accent rounded-lg p-2 text-sm"
              >
                <div className="flex-1">
                  <div className="font-medium">{attachment.fileName}</div>
                  <div className="text-xs text-muted-foreground">
                    {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <a
                  href={attachment.fileUrl}
                  download={attachment.fileName}
                  className="text-primary hover:underline"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  currentUserId,
  onEditMessage,
  onDeleteMessage,
  onAddReaction,
  onRemoveReaction,
  className
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-32 text-muted-foreground", className)}>
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const isOwn = message.senderId === currentUserId;
        const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== message.senderId);
        const showTimestamp = !prevMessage || 
          prevMessage.senderId !== message.senderId ||
          new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 5 * 60 * 1000; // 5 minutes

        return (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={isOwn}
            showAvatar={showAvatar}
            showTimestamp={showTimestamp}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            onAddReaction={onAddReaction}
            onRemoveReaction={onRemoveReaction}
          />
        );
      })}
    </div>
  );
}
