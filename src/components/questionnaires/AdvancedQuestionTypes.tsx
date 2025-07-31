'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisySlider } from '@/components/ui/DaisySlider';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  Grid3X3, GripVertical, Image, MapPin, PenTool, Code2,
  Upload, Trash2, CheckCircle, RotateCcw, AlertTriangle,
  Info, Map, Move
} from 'lucide-react';

// Enhanced types for advanced questions
interface MatrixQuestion {
  rows: Array<{ id: string; text: string; required?: boolean }>;
  columns: Array<{ id: string; text: string; value: string | number }>;
  allowMultiple?: boolean;
  randomizeRows?: boolean;
  randomizeColumns?: boolean;
  style: 'radio' | 'checkbox' | 'dropdown' | 'scale';
}

interface RankingQuestion {
  items: Array<{ id: string; text: string; description?: string; image?: string }>;
  maxRankings?: number;
  minRankings?: number;
  allowTies?: boolean;
  randomizeItems?: boolean;
}

interface ImageQuestion {
  images: Array<{ 
    id: string; 
    url: string; 
    alt: string; 
    clickable?: boolean;
    hotspots?: Array<{ x: number; y: number; label: string }>;
  }>;
  selectionType: 'single' | 'multiple' | 'hotspot' | 'annotation';
  allowUpload?: boolean;
  maxSelections?: number;
}

interface SignatureQuestion {
  required: boolean;
  backgroundColor?: string;
  penColor?: string;
  penWidth?: number;
  showTimestamp?: boolean;
  showLocation?: boolean;
  clearable?: boolean;
}

interface LocationQuestion {
  mapType: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
  zoom: number;
  allowSearch?: boolean;
  restrictToRegion?: boolean;
  region?: { lat: number; lng: number; radius: number };
  showAddress?: boolean;
  requireAccuracy?: boolean;
}

interface CustomHTMLQuestion {
  htmlContent: string;
  cssStyles?: string;
  jsCode?: string;
  allowUserInput?: boolean;
  inputFields?: Array<{ name: string; type: string; required: boolean }>;
  sandbox?: boolean;
}

// Matrix/Grid Question Component
export function MatrixQuestionComponent({ 
  config, 
  value, 
  onChange, 
  readonly = false 
}: {
  config: MatrixQuestion;
  value?: any;
  onChange?: (value: any) => void;
  readonly?: boolean;
}) {
  const [responses, setResponses] = useState(value || {});

  const handleResponse = (rowId: string, columnId: string, checked: boolean) => {
    if (readonly) return;

    const newResponses = { ...responses };
    
    if (config.style === 'radio' || !config.allowMultiple) {
      // Single selection per row
      newResponses[rowId] = checked ? columnId : null;
    } else {
      // Multiple selection per row
      if (!newResponses[rowId]) newResponses[rowId] = [];
      if (checked) {
        newResponses[rowId] = [...newResponses[rowId], columnId];
      } else {
        newResponses[rowId] = newResponses[rowId].filter((id: string) => id !== columnId);
      }
    }

    setResponses(newResponses);
    onChange?.(newResponses);
  };

  const displayRows = config.randomizeRows 
    ? [...config.rows].sort(() => Math.random() - 0.5)
    : config.rows;

  const displayColumns = config.randomizeColumns
    ? [...config.columns].sort(() => Math.random() - 0.5)
    : config.columns;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 border-b"></th>
              {displayColumns.map((column) => (
                <th key={column.id} className="text-center p-3 border-b min-w-[100px]">
                  <div className="text-sm font-medium">{column.text}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">
                  <div className="flex items-center">
                    {row.text}
                    {row.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                </td>
                {displayColumns.map((column) => (
                  <td key={column.id} className="p-3 text-center">
                    {config.style === 'radio' ? (
                      <input
                        type="radio"
                        name={`matrix-${row.id}`}
                        value={column.id}
                        checked={responses[row.id] === column.id}
                        onChange={(e) => handleResponse(row.id, column.id, e.target.checked)}
                        disabled={readonly}
                        className="w-4 h-4"
                      />
                    ) : config.style === 'checkbox' ? (
                      <input
                        type="checkbox"
                        checked={Array.isArray(responses[row.id]) 
                          ? responses[row.id].includes(column.id)
                          : responses[row.id] === column.id
                        }
                        onChange={(e) => handleResponse(row.id, column.id, e.target.checked)}
                        disabled={readonly}
                        className="w-4 h-4"
                      />
                    ) : config.style === 'scale' ? (
                      <DaisyButton
                        variant={responses[row.id] === column.id ? "primary" : "outline"}
                        size="sm"
                        onClick={() => handleResponse(row.id, column.id, true)}
                        disabled={readonly}
                        className="w-8 h-8 p-0"
                      >
                        {column.value}
                      </DaisyButton>
                    ) : (
                      <DaisySelect
                        value={responses[row.id] || ''}
                        onValueChange={(value) => handleResponse(row.id, value, true)}
                        disabled={readonly}
                      >
                        <DaisySelectTrigger className="w-full">
                          <DaisySelectValue placeholder="Select..." />
                        </DaisySelectTrigger>
                        <DaisySelectContent>
                          {displayColumns.map((col) => (
                            <DaisySelectItem key={col.id} value={col.id}>
                              {col.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </DaisySelect>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Ranking Question Component
export function RankingQuestionComponent({ 
  config, 
  value, 
  onChange, 
  readonly = false 
}: {
  config: RankingQuestion;
  value?: string[];
  onChange?: (value: string[]) => void;
  readonly?: boolean;
}) {
  const [rankedItems, setRankedItems] = useState<string[]>(value || []);
  const [availableItems, setAvailableItems] = useState<string[]>(
    config.items
      .filter(item => !value?.includes(item.id))
      .map(item => item.id)
  );

  const handleReorder = (newOrder: string[]) => {
    if (readonly) return;
    setRankedItems(newOrder);
    onChange?.(newOrder);
  };

  const addToRanking = (itemId: string) => {
    if (readonly) return;
    if (config.maxRankings && rankedItems.length >= config.maxRankings) {
      toast({
        title: 'Maximum rankings reached',
        description: `You can only rank up to ${config.maxRankings} items.`,
        variant: 'destructive',
      });
      return;
    }

    const newRanked = [...rankedItems, itemId];
    const newAvailable = availableItems.filter(id => id !== itemId);
    
    setRankedItems(newRanked);
    setAvailableItems(newAvailable);
    onChange?.(newRanked);
  };

  const removeFromRanking = (itemId: string) => {
    if (readonly) return;
    const newRanked = rankedItems.filter(id => id !== itemId);
    const newAvailable = [...availableItems, itemId];
    
    setRankedItems(newRanked);
    setAvailableItems(newAvailable);
    onChange?.(newRanked);
  };

  const displayItems = config.randomizeItems 
    ? [...config.items].sort(() => Math.random() - 0.5)
    : config.items;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Items */}
        <div>
          <h4 className="font-medium mb-3 text-notion-text-primary">Available Items</h4>
          <div className="space-y-2 min-h-[200px] border rounded-lg p-3 bg-gray-50">
            {displayItems
              .filter(item => availableItems.includes(item.id))
              .map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  className="border rounded p-3 bg-white cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => addToRanking(item.id)}
                >
                  <div className="flex items-center space-x-3">
                    {item.image && (
                      <img src={item.image} alt={item.text} className="w-8 h-8 rounded object-cover" />
                    )}
                    <div>
                      <div className="font-medium">{item.text}</div>
                      {item.description && (
                        <div className="text-sm text-gray-600">{item.description}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>

        {/* Ranked Items */}
        <div>
          <h4 className="font-medium mb-3 text-notion-text-primary">
            Your Rankings 
            {config.maxRankings && (
              <span className="text-sm text-gray-500 ml-2">
                ({rankedItems.length}/{config.maxRankings})
              </span>
            )}
          </h4>
          <div className="min-h-[200px] border rounded-lg p-3 bg-blue-50">
            <Reorder.Group 
              axis="y" 
              values={rankedItems} 
              onReorder={handleReorder}
              className="space-y-2"
            >
              {rankedItems.map((itemId, index) => {
                const item = config.items.find(i => i.id === itemId);
                if (!item) return null;

                return (
                  <Reorder.Item key={itemId} value={itemId}>
                    <motion.div
                      layout
                      className="border rounded p-3 bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">
                            {index + 1}
                          </div>
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          {item.image && (
                            <img src={item.image} alt={item.text} className="w-8 h-8 rounded object-cover" />
                          )}
                          <div>
                            <div className="font-medium">{item.text}</div>
                            {item.description && (
                              <div className="text-sm text-gray-600">{item.description}</div>
                            )}
                          </div>
                        </div>
                        <DaisyButton
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromRanking(itemId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </DaisyButton>
                      </div>
                    </motion.div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
        </div>
      </div>

      {config.minRankings && rankedItems.length < config.minRankings && (
        <DaisyAlert>
          <DaisyAlertTriangle className="w-4 h-4" />
          <DaisyAlertDescription>
            Please rank at least {config.minRankings} items.
          
        </DaisyAlert>
      )}
    </div>
  );
}

// Image Question Component
export function ImageQuestionComponent({ 
  config, 
  value, 
  onChange, 
  readonly = false 
}: {
  config: ImageQuestion;
  value?: any;
  onChange?: (value: any) => void;
  readonly?: boolean;
}) {
  const [selectedImages, setSelectedImages] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : []
  );
  const [hotspots, setHotspots] = useState<Array<{ imageId: string; x: number; y: number; label: string }>>(
    value?.hotspots || []
  );
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; url: string; alt: string }>>([]);

  const handleImageSelect = (imageId: string) => {
    if (readonly) return;

    let newSelection: string[];
    
    if (config.selectionType === 'single') {
      newSelection = [imageId];
    } else {
      if (selectedImages.includes(imageId)) {
        newSelection = selectedImages.filter(id => id !== imageId);
      } else {
        if (config.maxSelections && selectedImages.length >= config.maxSelections) {
          toast({
            title: 'Maximum selections reached',
            description: `You can only select up to ${config.maxSelections} images.`,
            variant: 'destructive',
          });
          return;
        }
        newSelection = [...selectedImages, imageId];
      }
    }

    setSelectedImages(newSelection);
    onChange?.(config.selectionType === 'single' ? newSelection[0] : newSelection);
  };

  const handleImageClick = (imageId: string, event: React.MouseEvent<HTMLDivElement>) => {
    if (config.selectionType === 'hotspot' && !readonly) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      
      const newHotspot = {
        imageId,
        x,
        y,
        label: `Point ${hotspots.length + 1}`
      };
      
      const newHotspots = [...hotspots, newHotspot];
      setHotspots(newHotspots);
      onChange?.({ hotspots: newHotspots });
    } else {
      handleImageSelect(imageId);
    }
  };

  const handleImageUpload = (file: File) => {
    if (!config.allowUpload) return;

    const url = URL.createObjectURL(file);
    const newImage = {
      id: `uploaded-${Date.now()}`,
      url,
      alt: file.name
    };
    
    setUploadedImages(prev => [...prev, newImage]);
  };

  const allImages = [...config.images, ...uploadedImages];

  return (
    <div className="space-y-4">
      {config.selectionType === 'hotspot' && (
        <DaisyAlert>
          <Info className="w-4 h-4" />
          <DaisyAlertDescription>
            Click on the image to mark important areas or points of interest.
          
        </DaisyAlert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allImages.map((image) => (
          <motion.div
            key={image.id}
            layout
            className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
              selectedImages.includes(image.id)
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={(e) => handleImageClick(image.id, e)}
          >
            <img
              src={image.url}
              alt={image.alt}
              className="w-full h-48 object-cover"
            />
            
            {/* Hotspots */}
            {config.selectionType === 'hotspot' && hotspots
              .filter(h => h.imageId === image.id)
              .map((hotspot, index) => (
                <div
                  key={index}
                  className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`
                  }}
                >
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {hotspot.label}
                  </div>
                </div>
              ))
            }

            {/* Selection indicator */}
            {selectedImages.includes(image.id) && config.selectionType !== 'hotspot' && (
              <div className="absolute top-2 right-2">
                <CheckCircle className="w-6 h-6 text-blue-600 bg-white rounded-full" />
              </div>
            )}

            {/* Image overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all" />
          </motion.div>
        ))}

        {/* Upload area */}
        {config.allowUpload && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">Upload an image</p>
            <DaisyInput
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="hidden"
              id="image-upload"
            />
            <DaisyLabel htmlFor="image-upload" className="cursor-pointer">
              <DaisyButton variant="outline" size="sm" asChild>
                <span>Choose File</span>
              </DaisyButton>
            </DaisyLabel>
          </div>
        )}
      </div>

      {config.maxSelections && selectedImages.length > 0 && (
        <div className="text-sm text-gray-600">
          Selected: {selectedImages.length} / {config.maxSelections}
        </div>
      )}
    </div>
  );
}

// Signature Capture Component
export function SignatureQuestionComponent({ 
  config, 
  value, 
  onChange, 
  readonly = false 
}: {
  config: SignatureQuestion;
  value?: string;
  onChange?: (value: string) => void;
  readonly?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState<string>(value || '');
  const [timestamp, setTimestamp] = useState<Date | null>(null);

  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new window.Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = value;
      }
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readonly) return;
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readonly) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = config.penWidth || 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = config.penColor || '#000000';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL();
      setSignature(dataURL);
      setTimestamp(new Date());
      onChange?.(dataURL);
    }
  };

  const clearSignature = () => {
    if (readonly) return;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (config.backgroundColor) {
          ctx.fillStyle = config.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
    setSignature('');
    setTimestamp(null);
    onChange?.('');
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="border border-gray-300 rounded cursor-crosshair w-full"
          style={{ backgroundColor: config.backgroundColor || 'white' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            {signature ? 'Signature captured' : 'Please sign above'}
          </div>
          
          {config.clearable && (
            <DaisyButton variant="outline" size="sm" onClick={clearSignature}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </DaisyButton>
          )}
        </div>
      </div>

      {config.showTimestamp && timestamp && (
        <div className="text-xs text-gray-500">
          Signed at: {timestamp.toLocaleString()}
        </div>
      )}

      {config.required && !signature && (
        <DaisyAlert>
          <DaisyAlertTriangle className="w-4 h-4" />
          <DaisyAlertDescription>
            Signature is required to continue.
          
        </DaisyAlert>
      )}
    </div>
  );
}

// Location Picker Component
export function LocationQuestionComponent({ 
  config, 
  value, 
  onChange, 
  readonly = false 
}: {
  config: LocationQuestion;
  value?: { lat: number; lng: number; address?: string };
  onChange?: (value: { lat: number; lng: number; address?: string }) => void;
  readonly?: boolean;
}) {
  const [selectedLocation, setSelectedLocation] = useState(value);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    if (readonly) return;
    
    const location = { lat, lng, address };
    setSelectedLocation(location);
    onChange?.(location);
  };

  const searchLocation = async () => {
    if (!searchQuery.trim() || !config.allowSearch) return;
    
    setIsSearching(true);
    try {
      // Mock geocoding - in real app, use Google Maps Geocoding API
      const mockLat = 40.7128 + (Math.random() - 0.5) * 0.1;
      const mockLng = -74.0060 + (Math.random() - 0.5) * 0.1;
      
      handleLocationSelect(mockLat, mockLng, searchQuery);
      
      toast({
        title: 'Location Found',
        description: `Found coordinates for "${searchQuery}"`,
      });
    } catch (error) {
      toast({
        title: 'Search Failed',
        description: 'Could not find the specified location.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if (readonly || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationSelect(
          position.coords.latitude,
          position.coords.longitude,
          'Current Location'
        );
      },
      (error) => {
        toast({
          title: 'Location Error',
          description: 'Could not access your current location.',
          variant: 'destructive',
        });
      }
    );
  };

  return (
    <div className="space-y-4">
      {config.allowSearch && (
        <div className="flex space-x-2">
          <DaisyInput
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
            disabled={readonly}
          />
          <DaisyButton onClick={searchLocation} disabled={isSearching || readonly}>
            {isSearching ? 'Searching...' : 'Search'}
          </DaisyButton>
          <DaisyButton variant="outline" onClick={getCurrentLocation} disabled={readonly}>
            <MapPin className="w-4 h-4 mr-2" />
            Current
          </DaisyButton>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        {/* Mock map display */}
        <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 relative flex items-center justify-center">
          <div className="text-center">
            <Map className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Interactive Map</p>
            {selectedLocation && (
              <div className="absolute top-4 left-4 bg-white rounded p-2 shadow text-sm">
                <div className="font-medium">Selected Location</div>
                <div>Lat: {selectedLocation.lat.toFixed(6)}</div>
                <div>Lng: {selectedLocation.lng.toFixed(6)}</div>
                {selectedLocation.address && (
                  <div className="text-gray-600">{selectedLocation.address}</div>
                )}
              </div>
            )}
            
            {selectedLocation && (
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-red-500" />
              </div>
            )}
          </div>
        </div>

        {/* Mock satellite view toggle */}
        <div className="p-2 border-t bg-gray-50 flex justify-between items-center">
          <DaisySelect value={config.mapType} disabled>
            <DaisySelectTrigger className="w-32">
              <DaisySelectValue />
            </DaisySelectTrigger>
            <DaisySelectContent>
              <DaisySelectItem value="roadmap">Roadmap</SelectItem>
              <DaisySelectItem value="satellite">Satellite</SelectItem>
              <DaisySelectItem value="terrain">Terrain</SelectItem>
              <DaisySelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </DaisySelect>
          
          <div className="text-sm text-gray-600">
            Zoom: {config.zoom}x
          </div>
        </div>
      </div>

      {selectedLocation && config.showAddress && (
        <div className="text-sm text-gray-600">
          <strong>Address:</strong> {selectedLocation.address || 'Address not available'}
        </div>
      )}

      {config.requireAccuracy && !selectedLocation && (
        <DaisyAlert>
          <DaisyAlertTriangle className="w-4 h-4" />
          <DaisyAlertDescription>
            Please select a location to continue.
          
        </DaisyAlert>
      )}
    </div>
  );
}

// Custom HTML Question Component
export function CustomHTMLQuestionComponent({ 
  config, 
  value, 
  onChange, 
  readonly = false 
}: {
  config: CustomHTMLQuestion;
  value?: any;
  onChange?: (value: any) => void;
  readonly?: boolean;
}) {
  const [inputValues, setInputValues] = useState(value || {});
  const [showCode, setShowCode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleInputChange = (fieldName: string, fieldValue: any) => {
    if (readonly) return;
    
    const newValues = { ...inputValues, [fieldName]: fieldValue };
    setInputValues(newValues);
    onChange?.(newValues);
  };

  const sanitizeHTML = (html: string) => {
    // Basic HTML sanitization - in production, use a proper sanitization library
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/javascript:/gi, '');
  };

  const generateIFrameContent = () => {
    const sanitizedHTML = config.sandbox ? sanitizeHTML(config.htmlContent) : config.htmlContent;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              margin: 0; 
              padding: 16px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            ${config.cssStyles || ''}
          </style>
        </head>
        <body>
          ${sanitizedHTML}
          ${config.jsCode && !config.sandbox ? `<script>${config.jsCode}</script>` : ''}
        </body>
      </html>
    `;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Custom Content</h4>
        <div className="flex space-x-2">
          <DaisyButton
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
          >
            <Code2 className="w-4 h-4 mr-2" />
            {showCode ? 'Hide Code' : 'Show Code'}
          </DaisyButton>
          {config.sandbox && (
            <DaisyBadge variant="secondary" className="text-xs">
              Sandboxed
            </DaisyBadge>
          )}
        </div>
      </div>

      {showCode && (
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="text-sm">HTML Content</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
            <DaisyTextarea
              value={config.htmlContent}
              readOnly
              rows={8}
              className="font-mono text-sm"
            />
          </DaisyCardContent>
        </DaisyCard>
      )}

      <div className="border rounded-lg overflow-hidden">
        <iframe
          ref={iframeRef}
          srcDoc={generateIFrameContent()}
          className="w-full h-64 border-0"
          sandbox={config.sandbox ? "allow-same-origin" : "allow-same-origin allow-scripts"}
        />
      </div>

      {config.allowUserInput && config.inputFields && config.inputFields.length > 0 && (
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="text-sm">Additional Input</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-4">
            {config.inputFields.map((field) => (
              <div key={field.name}>
                <DaisyLabel htmlFor={field.name}>
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </DaisyLabel>
                {field.type === 'textarea' ? (
                  <DaisyTextarea
                    id={field.name}
                    value={inputValues[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    disabled={readonly}
                  />
                ) : (
                  <DaisyInput
                    id={field.name}
                    type={field.type}
                    value={inputValues[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    disabled={readonly}
                  />
                )}
              </div>
            ))}
          </DaisyCardContent>
        </DaisyCard>
      )}
    </div>
  );
}

// Question type configurations for the builder
export const ADVANCED_QUESTION_TYPES = {
  matrix: {
    id: 'matrix',
    name: 'Matrix/Grid',
    icon: Grid3X3,
    description: 'Multiple questions with the same answer choices',
    component: MatrixQuestionComponent,
    defaultConfig: {
      rows: [
        { id: 'row1', text: 'Question 1', required: false },
        { id: 'row2', text: 'Question 2', required: false }
      ],
      columns: [
        { id: 'col1', text: 'Strongly Disagree', value: 1 },
        { id: 'col2', text: 'Disagree', value: 2 },
        { id: 'col3', text: 'Neutral', value: 3 },
        { id: 'col4', text: 'Agree', value: 4 },
        { id: 'col5', text: 'Strongly Agree', value: 5 }
      ],
      style: 'radio' as const,
      allowMultiple: false,
      randomizeRows: false,
      randomizeColumns: false
    } as MatrixQuestion
  },
  ranking: {
    id: 'ranking',
    name: 'Ranking',
    icon: Move,
    description: 'Drag and drop items to rank them',
    component: RankingQuestionComponent,
    defaultConfig: {
      items: [
        { id: 'item1', text: 'Option 1', description: 'First option' },
        { id: 'item2', text: 'Option 2', description: 'Second option' },
        { id: 'item3', text: 'Option 3', description: 'Third option' }
      ],
      maxRankings: undefined,
      minRankings: 1,
      allowTies: false,
      randomizeItems: false
    } as RankingQuestion
  },
  image: {
    id: 'image',
    name: 'Image Selection',
    icon: Image,
    description: 'Select from images or mark areas on images',
    component: ImageQuestionComponent,
    defaultConfig: {
      images: [
        { id: 'img1', url: '/api/placeholder/300/200', alt: 'Sample Image 1' },
        { id: 'img2', url: '/api/placeholder/300/200', alt: 'Sample Image 2' }
      ],
      selectionType: 'single' as const,
      allowUpload: true,
      maxSelections: 1
    } as ImageQuestion
  },
  signature: {
    id: 'signature',
    name: 'Signature',
    icon: PenTool,
    description: 'Capture digital signatures',
    component: SignatureQuestionComponent,
    defaultConfig: {
      required: true,
      backgroundColor: '#ffffff',
      penColor: '#000000',
      penWidth: 2,
      showTimestamp: true,
      showLocation: false,
      clearable: true
    } as SignatureQuestion
  },
  location: {
    id: 'location',
    name: 'Location Picker',
    icon: MapPin,
    description: 'Select geographic locations',
    component: LocationQuestionComponent,
    defaultConfig: {
      mapType: 'roadmap' as const,
      zoom: 10,
      allowSearch: true,
      restrictToRegion: false,
      showAddress: true,
      requireAccuracy: true
    } as LocationQuestion
  },
  custom_html: {
    id: 'custom_html',
    name: 'Custom HTML',
    icon: Code2,
    description: 'Embed custom HTML content',
    component: CustomHTMLQuestionComponent,
    defaultConfig: {
      htmlContent: '<div><h3>Custom Content</h3><p>Add your custom HTML here.</p></div>',
      cssStyles: '',
      jsCode: '',
      allowUserInput: false,
      inputFields: [],
      sandbox: true
    } as CustomHTMLQuestion
  }
};

export type {
  MatrixQuestion,
  RankingQuestion,
  ImageQuestion,
  SignatureQuestion,
  LocationQuestion,
  CustomHTMLQuestion
}; 