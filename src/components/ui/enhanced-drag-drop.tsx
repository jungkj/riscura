import React, { useState, useRef } from 'react';
import { motion, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { variants, timings, easings } from '@/lib/design-system/micro-interactions';

// Enhanced Draggable Item
interface EnhancedDraggableProps {
  children: React.ReactNode;
  id: string;
  data?: any;
  onDragStart?: (id: string, data?: any) => void;
  onDragEnd?: (id: string, info: any) => void;
  disabled?: boolean;
  className?: string;
  dragHandle?: boolean;
}

export const EnhancedDraggable: React.FC<EnhancedDraggableProps> = ({
  children,
  id,
  data,
  onDragStart,
  onDragEnd,
  disabled = false,
  className = '',
  dragHandle = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // 3D tilt effects based on drag position
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleDragStart = () => {
    setIsDragging(true);
    onDragStart?.(id, data);
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    onDragEnd?.(id, info);
  };

  return (
    <motion.div
      className={cn(
        'relative cursor-grab active:cursor-grabbing touch-manipulation',
        isDragging && 'z-50',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      drag={!disabled}
      dragControls={dragHandle ? dragControls : undefined}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      style={{ 
        x, 
        y, 
        rotateX: isDragging ? rotateX : 0, 
        rotateY: isDragging ? rotateY : 0,
        scale: isDragging ? 1.05 : 1
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileHover={!disabled && !isDragging ? { scale: 1.02 } : undefined}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-grabbed={isDragging}
      aria-label={`Draggable item ${id}`}
    >
      {/* Drag Handle */}
      {dragHandle && (
        <div
          className="absolute top-2 left-2 cursor-grab active:cursor-grabbing p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-4 h-4 flex flex-col justify-center items-center gap-0.5">
            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Drag Shadow */}
      {isDragging && (
        <motion.div
          className="absolute inset-0 bg-black rounded-lg opacity-20 blur-lg -z-10"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1.2 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {children}
    </motion.div>
  );
};

// Enhanced Drop Zone
interface EnhancedDropZoneProps {
  children?: React.ReactNode;
  onDrop?: (draggedId: string, data?: any) => void;
  onDragOver?: (draggedId: string) => void;
  onDragLeave?: () => void;
  accept?: string[];
  className?: string;
  activeClassName?: string;
  placeholder?: React.ReactNode;
  disabled?: boolean;
}

export const EnhancedDropZone: React.FC<EnhancedDropZoneProps> = ({
  children,
  onDrop,
  onDragOver,
  onDragLeave,
  accept,
  className = '',
  activeClassName = '',
  placeholder,
  disabled = false
}) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOver(false);
      onDragLeave?.();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    setIsOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    const draggedData = e.dataTransfer.getData('application/json');
    
    onDrop?.(draggedId, draggedData ? JSON.parse(draggedData) : undefined);
  };

  return (
    <motion.div
      className={cn(
        'relative border-2 border-dashed border-slate-300 rounded-lg transition-all',
        isOver && !disabled && 'border-blue-500 bg-blue-50',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
        isOver && !disabled && activeClassName
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={{
        scale: isOver && !disabled ? 1.02 : 1,
        borderColor: isOver && !disabled ? '#3b82f6' : '#d1d5db'
      }}
      transition={{
        duration: timings.quick,
        ease: easings.snappy
      }}
      role="region"
      aria-label="Drop zone"
      aria-dropeffect={disabled ? "none" : "move"}
    >
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: isOver && !disabled ? 1 : 0 }}
        transition={{ duration: timings.quick }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children || (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {placeholder || (
              <>
                <motion.div
                  className="w-12 h-12 border-2 border-slate-300 border-dashed rounded-full flex items-center justify-center mb-4"
                  animate={{
                    scale: isOver && !disabled ? 1.2 : 1,
                    borderColor: isOver && !disabled ? '#3b82f6' : '#d1d5db'
                  }}
                  transition={{ duration: timings.quick }}
                >
                  <motion.div
                    className="w-4 h-4 bg-slate-400 rounded-full"
                    animate={{
                      backgroundColor: isOver && !disabled ? '#3b82f6' : '#94a3b8'
                    }}
                    transition={{ duration: timings.quick }}
                  />
                </motion.div>
                <p className="text-sm text-slate-600 font-medium">
                  {isOver && !disabled ? 'Release to drop' : 'Drag items here'}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Drop Indicator */}
      {isOver && !disabled && (
        <motion.div
          className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: timings.quick, ease: easings.bounce }}
        >
          <motion.div
            className="absolute inset-0 bg-blue-500/20 rounded-lg"
            animate={{
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

// Sortable List Component
interface SortableListProps {
  items: Array<{ id: string; content: React.ReactNode; data?: any }>;
  onReorder: (newOrder: string[]) => void;
  className?: string;
  itemClassName?: string;
  gap?: number;
}

export const SortableList: React.FC<SortableListProps> = ({
  items,
  onReorder,
  className = '',
  itemClassName = '',
  gap = 8
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) return;
    
    const currentOrder = items.map(item => item.id);
    const draggedIndex = currentOrder.indexOf(draggedItem);
    const targetIndex = currentOrder.indexOf(targetId);
    
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    
    onReorder(newOrder);
  };

  return (
    <div className={cn('space-y-2', className)} style={{ gap }}>
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <EnhancedDraggable
            id={item.id}
            data={item.data}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={cn(
              'bg-white border border-slate-200 rounded-lg overflow-hidden',
              draggedItem === item.id && 'shadow-2xl z-50',
              itemClassName
            )}
            dragHandle
          >
            <EnhancedDropZone
              onDrop={handleDrop}
              accept={['list-item']}
              className="min-h-[60px] border-0"
              activeClassName="bg-blue-50"
            >
              {item.content}
            </EnhancedDropZone>
          </EnhancedDraggable>
        </motion.div>
      ))}
    </div>
  );
}; 